import { NextResponse } from "next/server";
import { createDemoEditPlan } from "@/lib/edit-plan";
import { enhanceEditPlanWithOpenAI } from "@/lib/openai-edit";
import { editPlanRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = editPlanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات الفيديو أو الستايل غير مكتملة." },
      { status: 400 },
    );
  }

  const basePlan = createDemoEditPlan(parsed.data);
  const plan = await enhanceEditPlanWithOpenAI(basePlan, parsed.data);

  return NextResponse.json({
    plan,
    mode: process.env.OPENAI_API_KEY ? "ai-ready" : "demo-plan",
  });
}
