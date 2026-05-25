import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/projects";
import { createProjectSchema } from "@/lib/validation";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات المشروع غير مكتملة." }, { status: 400 });
  }

  try {
    const project = await createProject(parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر إنشاء المشروع." },
      { status: 500 },
    );
  }
}
