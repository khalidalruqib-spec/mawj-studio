import { NextResponse } from "next/server";
import { getAuthContext, isUnauthenticatedError } from "@/lib/auth-context";
import { getProject, updateProjectUpload } from "@/lib/projects";
import { createSupabaseServerClient, getSupabaseAdminClient, VIDEO_BUCKET } from "@/lib/supabase/server";
import { uploadUrlSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = uploadUrlSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الرفع غير مكتملة." }, { status: 400 });
  }

  const auth = await getAuthContext();
  let project = null;

  try {
    project = await getProject(id, auth.userId);
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }
    throw error;
  }

  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
  }

  const safeName = parsed.data.fileName
    .replace(/[^\w.\-\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  const storagePath = auth.userId
    ? `${auth.userId}/${id}/source/${Date.now()}-${safeName}`
    : `${id}/source/${Date.now()}-${safeName}`;
  const supabase = getSupabaseAdminClient() ?? (await createSupabaseServerClient());

  if (!supabase) {
    const updatedProject = await updateProjectUpload(id, storagePath, auth.userId);
    return NextResponse.json({
      mode: "local-preview",
      bucket: "local-preview",
      path: storagePath,
      token: null,
      project: updatedProject,
    });
  }

  const { data, error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const updatedProject = await updateProjectUpload(id, storagePath, auth.userId);

  return NextResponse.json({
    mode: "supabase",
    bucket: VIDEO_BUCKET,
    path: data.path,
    token: data.token,
    project: updatedProject,
  });
}
