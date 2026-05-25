import { NextResponse } from "next/server";
import { deleteProject, getProject, updateProject } from "@/lib/projects";
import { updateProjectSchema } from "@/lib/validation";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ProjectRouteContext) {
  const { id } = await context.params;
  const project = await getProject(id);

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
    const project = await updateProject(id, parsed.data);

    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر تحديث المشروع." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { id } = await context.params;

  try {
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر حذف المشروع." },
      { status: 500 },
    );
  }
}
