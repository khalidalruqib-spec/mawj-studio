import { NextResponse } from "next/server";
import { getAuthContext, isUnauthenticatedError } from "@/lib/auth-context";
import { createProject, listProjects } from "@/lib/projects";
import { createProjectSchema } from "@/lib/validation";

export async function GET() {
  const auth = await getAuthContext();

  try {
    const projects = await listProjects(auth.userId);
    return NextResponse.json({ projects });
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات المشروع غير مكتملة." }, { status: 400 });
  }

  try {
    const auth = await getAuthContext();
    const project = await createProject(parsed.data, auth.userId);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر إنشاء المشروع." },
      { status: 500 },
    );
  }
}
