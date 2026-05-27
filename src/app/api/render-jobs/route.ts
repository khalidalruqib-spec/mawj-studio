import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createRenderJob, listRenderJobs } from "@/lib/render-jobs";

const renderJobSchema = z.object({
  projectId: z.string().optional(),
  sourcePath: z.string().optional(),
  format: z.enum(["mp4", "gif", "mp3", "srt", "thumbnail"]).default("mp4"),
  quality: z.enum(["720p", "1080p", "4k"]).default("1080p"),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  burnCaptions: z.boolean().default(true),
  removeBackground: z.boolean().default(false),
  audioEnhancement: z.array(z.string()).default([]),
});

export async function GET() {
  const auth = await getAuthContext();
  if (auth.isAuthEnabled && !auth.userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
  }

  return NextResponse.json({ jobs: listRenderJobs(auth.userId) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = renderJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid render job input." }, { status: 400 });
  }

  const auth = await getAuthContext();
  if (auth.isAuthEnabled && !auth.userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
  }

  const job = createRenderJob(parsed.data, auth.userId);
  return NextResponse.json({ job }, { status: 202 });
}
