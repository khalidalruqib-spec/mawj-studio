import { NextResponse } from "next/server";

const ALLOWED_STOCK_HOSTS = new Set([
  "images.pexels.com",
  "videos.pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing stock asset URL." }, { status: 400 });
  }

  let assetUrl: URL;
  try {
    assetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid stock asset URL." }, { status: 400 });
  }

  if (assetUrl.protocol !== "https:" || !ALLOWED_STOCK_HOSTS.has(assetUrl.hostname)) {
    return NextResponse.json({ error: "Stock asset host is not allowed." }, { status: 400 });
  }

  const isVideoAsset = assetUrl.hostname === "videos.pexels.com" || /\.(mp4|webm|mov)$/i.test(assetUrl.pathname);
  const response = await fetch(assetUrl, {
    headers: {
      "User-Agent": "MawjStudio/1.0",
    },
    ...(isVideoAsset ? { cache: "no-store" as const } : { next: { revalidate: 86_400 } }),
  });

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "Could not load stock asset." }, { status: response.status || 502 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
