import { NextResponse } from "next/server";
import { getTemplates } from "@/lib/video-template-store";

export async function GET() {
  const templates = await getTemplates();
  return NextResponse.json({ templates });
}
