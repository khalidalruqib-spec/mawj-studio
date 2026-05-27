import { NextResponse } from "next/server";
import { getAuthContext, isUnauthenticatedError } from "@/lib/auth-context";
import { deleteProject, getProject, updateProject } from "@/lib/projects";
import { updateProjectSchema } from "@/lib/validation";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ProjectRouteContext) {
  const { id } = await context.params;
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

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات التحديث غير صحيحة." }, { status: 400 });
  }

  try {
    const auth = await getAuthContext();
    const project = await updateProject(id, parsed.data, auth.userId);

    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر تحديث المشروع." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { id } = await context.params;

  try {
    const auth = await getAuthContext();
    await deleteProject(id, auth.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر حذف المشروع." },
      { status: 500 },
    );
  }
}
