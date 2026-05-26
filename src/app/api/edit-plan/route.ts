import { NextResponse } from "next/server";
import { createDemoEditPlan } from "@/lib/edit-plan";
import { enhanceEditPlanWithOpenAI } from "@/lib/openai-edit";
import { updateProjectPlan } from "@/lib/projects";
import { editPlanRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = editPlanRequestSchema.safeParse(normalizeEditPlanBody(body));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات الفيديو أو الستايل غير مكتملة." },
      { status: 400 },
    );
  }

  const basePlan = createDemoEditPlan(parsed.data);
  const plan = await enhanceEditPlanWithOpenAI(basePlan, parsed.data);
  const project = parsed.data.projectId
    ? await updateProjectPlan(parsed.data.projectId, plan).catch(() => null)
    : null;

  return NextResponse.json({
    plan,
    project,
    mode: process.env.OPENAI_API_KEY ? "ai-ready" : "demo-plan",
  });
}

function normalizeEditPlanBody(body: Record<string, unknown>) {
  const durationSeconds = Number(
    body.durationSeconds ??
      body.sourceDurationSeconds ??
      body.totalDurationSeconds ??
      30,
  );
  const mediaCount = Number(body.mediaCount ?? 1);
  const fallbackFileName =
    mediaCount > 1
      ? `${mediaCount} uploaded media assets`
      : "browser-local-video.mp4";

  return {
    ...body,
    fileName: typeof body.fileName === "string" && body.fileName.trim()
      ? body.fileName
      : fallbackFileName,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : 30,
    platform: body.platform ?? "tiktok",
    aspectRatio: body.aspectRatio ?? "9:16",
    languageMode: body.languageMode ?? "arabic",
    styleId: body.styleId ?? "viral-saudi",
    brandName: typeof body.brandName === "string" ? body.brandName : "Mawj Studio",
    goal: body.goal ?? "engagement",
  };
}
