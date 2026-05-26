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

  // Try PNG first, fall back to SVG equivalent
  const pngPath = getTemplateAssetPath(id, fileName);
  const svgName = fileName.replace(".png", ".svg");
  const svgPath = getTemplateAssetPath(id, svgName);

  // Try PNG
  try {
    const asset = await fs.readFile(pngPath);
    return new NextResponse(asset, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    // Fall through to SVG
  }

  // Try SVG
  try {
    const asset = await fs.readFile(svgPath);
    return new NextResponse(asset, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Template asset not found." }, { status: 404 });
  }
}
