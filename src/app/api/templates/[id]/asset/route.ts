import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getTemplateAssetPath } from "@/lib/video-template-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("file") ?? "thumbnail.png";

  try {
    const asset = await fs.readFile(getTemplateAssetPath(id, fileName));
    return new NextResponse(asset, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Template asset not found." }, { status: 404 });
  }
}
