import { NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────────────
   Stock Media API — Pexels (primary) + Pixabay (fallback)

   Add to .env.local:
     PEXELS_API_KEY=your_key_here
     PIXABAY_API_KEY=your_key_here  (optional)

   Get a free Pexels key at: https://www.pexels.com/api/
   Get a free Pixabay key at: https://pixabay.com/api/docs/
─────────────────────────────────────────────────────────────────────── */

export type StockMediaType = "photo" | "video";

export type StockPhoto = {
  id: string;
  source: "pexels" | "pixabay";
  type: "photo";
  width: number;
  height: number;
  url: string;           // original full-res URL
  previewUrl: string;    // small preview for the grid
  mediumUrl: string;     // medium for timeline use
  thumbUrl: string;      // tiny thumbnail
  photographer: string;
  photographerUrl: string;
  alt: string;
  avgColor: string;
};

export type StockVideo = {
  id: string;
  source: "pexels" | "pixabay";
  type: "video";
  width: number;
  height: number;
  duration: number;       // seconds
  url: string;            // HD or best quality .mp4
  previewUrl: string;     // image thumbnail
  thumbUrl: string;
  videographer: string;
  videographerUrl: string;
  alt: string;
};

export type StockSearchResponse = {
  results: (StockPhoto | StockVideo)[];
  totalResults: number;
  page: number;
  perPage: number;
  nextPage: boolean;
  source: "pexels" | "pixabay" | "demo";
};

/* ── Route handler ──────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query   = (searchParams.get("q") ?? "").trim();
  const type    = (searchParams.get("type") ?? "photo") as StockMediaType;
  const page    = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(40, Math.max(8, Number(searchParams.get("per_page") ?? 20)));

  // Try Pexels first
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const data = await searchPexels({ query, type, page, perPage, apiKey: pexelsKey });
      return NextResponse.json(data);
    } catch (err) {
      console.warn("[stock] Pexels error:", err);
    }
  }

  // Fallback to Pixabay
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (pixabayKey) {
    try {
      const data = await searchPixabay({ query, type, page, perPage, apiKey: pixabayKey });
      return NextResponse.json(data);
    } catch (err) {
      console.warn("[stock] Pixabay error:", err);
    }
  }

  // Demo mode — curated set of real Pexels CDN thumbnails (no key needed)
  return NextResponse.json(buildDemoResults(query, type, page, perPage));
}

/* ── Pexels ─────────────────────────────────────────────────────────── */

async function searchPexels({
  query,
  type,
  page,
  perPage,
  apiKey,
}: {
  query: string;
  type: StockMediaType;
  page: number;
  perPage: number;
  apiKey: string;
}): Promise<StockSearchResponse> {
  const baseUrl = type === "video" ? "https://api.pexels.com/videos" : "https://api.pexels.com/v1";
  const endpoint = query
    ? `${baseUrl}/search?query=${encodeURIComponent(query || "nature")}&page=${page}&per_page=${perPage}&orientation=portrait`
    : type === "video"
      ? `${baseUrl}/popular?page=${page}&per_page=${perPage}`
      : `${baseUrl}/curated?page=${page}&per_page=${perPage}`;

  const res = await fetch(endpoint, {
    headers: { Authorization: apiKey },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const json = await res.json() as PexelsApiResponse;

  const results = type === "video"
    ? (json.videos ?? []).map(mapPexelsVideo)
    : (json.photos ?? []).map(mapPexelsPhoto);

  return {
    results,
    totalResults: json.total_results ?? results.length,
    page,
    perPage,
    nextPage: Boolean(json.next_page),
    source: "pexels",
  };
}

function mapPexelsPhoto(p: PexelsPhoto): StockPhoto {
  return {
    id: `pexels-${p.id}`,
    source: "pexels",
    type: "photo",
    width: p.width,
    height: p.height,
    url: p.src.original,
    previewUrl: p.src.large,
    mediumUrl: p.src.medium,
    thumbUrl: p.src.tiny,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    alt: p.alt ?? "",
    avgColor: p.avg_color ?? "#111827",
  };
}

function mapPexelsVideo(v: PexelsVideo): StockVideo {
  // Find best mp4 file — prefer HD (1280) or FHD (1920), fallback to first
  const sorted = [...(v.video_files ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const hd = sorted.find((f) => (f.width ?? 0) >= 1280 && f.file_type?.includes("mp4")) ?? sorted[0];

  return {
    id: `pexels-${v.id}`,
    source: "pexels",
    type: "video",
    width: v.width,
    height: v.height,
    duration: v.duration,
    url: hd?.link ?? "",
    previewUrl: v.image,
    thumbUrl: v.image,
    videographer: v.user?.name ?? "Pexels",
    videographerUrl: `https://www.pexels.com/@${v.user?.url ?? ""}`,
    alt: `Stock video ${v.id}`,
  };
}

/* ── Pixabay ─────────────────────────────────────────────────────────── */

async function searchPixabay({
  query,
  type,
  page,
  perPage,
  apiKey,
}: {
  query: string;
  type: StockMediaType;
  page: number;
  perPage: number;
  apiKey: string;
}): Promise<StockSearchResponse> {
  const q = encodeURIComponent(query || "nature");
  const endpoint =
    type === "video"
      ? `https://pixabay.com/api/videos/?key=${apiKey}&q=${q}&page=${page}&per_page=${perPage}&video_type=all`
      : `https://pixabay.com/api/?key=${apiKey}&q=${q}&page=${page}&per_page=${perPage}&image_type=photo&orientation=vertical`;

  const res = await fetch(endpoint, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  const json = await res.json() as PixabayApiResponse;

  const results = type === "video"
    ? (json.hits ?? []).map(mapPixabayVideo)
    : (json.hits ?? []).map(mapPixabayPhoto);

  return {
    results,
    totalResults: json.totalHits ?? results.length,
    page,
    perPage,
    nextPage: page * perPage < (json.totalHits ?? 0),
    source: "pixabay",
  };
}

function mapPixabayPhoto(h: PixabayHit): StockPhoto {
  return {
    id: `pixabay-${h.id}`,
    source: "pixabay",
    type: "photo",
    width: h.imageWidth ?? h.webformatWidth ?? 800,
    height: h.imageHeight ?? h.webformatHeight ?? 600,
    url: h.largeImageURL ?? h.webformatURL,
    previewUrl: h.webformatURL,
    mediumUrl: h.webformatURL,
    thumbUrl: h.previewURL,
    photographer: h.user ?? "Pixabay",
    photographerUrl: `https://pixabay.com/users/${h.user ?? ""}`,
    alt: h.tags ?? "",
    avgColor: "#111827",
  };
}

function mapPixabayVideo(h: PixabayHit): StockVideo {
  const mp4 = h.videos?.medium ?? h.videos?.small ?? h.videos?.tiny;
  return {
    id: `pixabay-${h.id}`,
    source: "pixabay",
    type: "video",
    width: mp4?.width ?? 640,
    height: mp4?.height ?? 360,
    duration: h.duration ?? 10,
    url: mp4?.url ?? "",
    previewUrl: h.webformatURL ?? h.previewURL ?? "",
    thumbUrl: h.previewURL ?? "",
    videographer: h.user ?? "Pixabay",
    videographerUrl: `https://pixabay.com/users/${h.user ?? ""}`,
    alt: h.tags ?? "",
  };
}

/* ── Demo mode (no API keys) ─────────────────────────────────────────── */

const DEMO_PHOTOS: StockPhoto[] = [
  { id: "d-1", source: "pexels", type: "photo", width: 4272, height: 2848, url: "https://images.pexels.com/photos/1261731/pexels-photo-1261731.jpeg", previewUrl: "https://images.pexels.com/photos/1261731/pexels-photo-1261731.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/1261731/pexels-photo-1261731.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/1261731/pexels-photo-1261731.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Life Of Pix", photographerUrl: "https://www.pexels.com/@life-of-pix", alt: "Green forest", avgColor: "#1a4a2a" },
  { id: "d-2", source: "pexels", type: "photo", width: 3648, height: 5472, url: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg", previewUrl: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Tobias Bj", photographerUrl: "https://www.pexels.com/@tobiasbjorkli", alt: "City street", avgColor: "#1e293b" },
  { id: "d-3", source: "pexels", type: "photo", width: 6000, height: 4000, url: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg", previewUrl: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "fauxels", photographerUrl: "https://www.pexels.com/@fauxels", alt: "Business team meeting", avgColor: "#0f172a" },
  { id: "d-4", source: "pexels", type: "photo", width: 5472, height: 3648, url: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg", previewUrl: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Ella Olsson", photographerUrl: "https://www.pexels.com/@ella-olsson", alt: "Food photography bowl", avgColor: "#7c3d12" },
  { id: "d-5", source: "pexels", type: "photo", width: 5184, height: 3456, url: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg", previewUrl: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Pixabay", photographerUrl: "https://www.pexels.com/@pixabay", alt: "Luxury car", avgColor: "#1c1c1c" },
  { id: "d-6", source: "pexels", type: "photo", width: 3840, height: 2160, url: "https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg", previewUrl: "https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Dominika Roseclay", photographerUrl: "https://www.pexels.com/@dominika-roseclay", alt: "Retail shopping", avgColor: "#0f4c75" },
  { id: "d-7", source: "pexels", type: "photo", width: 4032, height: 3024, url: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg", previewUrl: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Andrea Piacquadio", photographerUrl: "https://www.pexels.com/@olly", alt: "Professional portrait", avgColor: "#1a1a2e" },
  { id: "d-8", source: "pexels", type: "photo", width: 5184, height: 3456, url: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg", previewUrl: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Pexels", photographerUrl: "https://www.pexels.com", alt: "Dubai skyline", avgColor: "#1e3a5f" },
  { id: "d-9", source: "pexels", type: "photo", width: 6016, height: 4016, url: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg", previewUrl: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "fauxels", photographerUrl: "https://www.pexels.com/@fauxels", alt: "Tech office", avgColor: "#0f2744" },
  { id: "d-10", source: "pexels", type: "photo", width: 3456, height: 5184, url: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg", previewUrl: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Min An", photographerUrl: "https://www.pexels.com/@minan1398", alt: "Smartphone social media", avgColor: "#1a1a2e" },
  { id: "d-11", source: "pexels", type: "photo", width: 4272, height: 2848, url: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg", previewUrl: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Bryan Catota", photographerUrl: "https://www.pexels.com/@bryancatota", alt: "Coffee shop", avgColor: "#3d1f0a" },
  { id: "d-12", source: "pexels", type: "photo", width: 5184, height: 3456, url: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg", previewUrl: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800", mediumUrl: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400", thumbUrl: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200", photographer: "Italo Melo", photographerUrl: "https://www.pexels.com/@italomelo", alt: "Portrait professional", avgColor: "#2c2c2c" },
];

function buildDemoResults(
  query: string,
  type: StockMediaType,
  page: number,
  perPage: number,
): StockSearchResponse {
  if (type === "video") {
    // No real demo videos — return empty with clear message
    return { results: [], totalResults: 0, page, perPage, nextPage: false, source: "demo" };
  }

  const filtered = query
    ? DEMO_PHOTOS.filter((p) => p.alt.toLowerCase().includes(query.toLowerCase())).slice(0, perPage)
    : DEMO_PHOTOS.slice((page - 1) * perPage, page * perPage);

  return {
    results: filtered.length ? filtered : DEMO_PHOTOS.slice(0, perPage),
    totalResults: DEMO_PHOTOS.length,
    page,
    perPage,
    nextPage: false,
    source: "demo",
  };
}

/* ── Pexels API types ────────────────────────────────────────────────── */

type PexelsApiResponse = {
  photos?: PexelsPhoto[];
  videos?: PexelsVideo[];
  total_results?: number;
  next_page?: string;
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  photographer: string;
  photographer_url: string;
  avg_color?: string;
  alt?: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
};

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  duration: number;
  image: string;
  user?: { name?: string; url?: string };
  video_files?: Array<{
    id: number;
    quality?: string;
    file_type?: string;
    width?: number;
    height?: number;
    link: string;
  }>;
};

/* ── Pixabay API types ───────────────────────────────────────────────── */

type PixabayApiResponse = {
  hits?: PixabayHit[];
  totalHits?: number;
};

type PixabayHit = {
  id: number;
  tags?: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL?: string;
  imageWidth?: number;
  imageHeight?: number;
  webformatWidth?: number;
  webformatHeight?: number;
  user?: string;
  duration?: number;
  videos?: {
    large?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    tiny?: { url: string; width: number; height: number };
  };
};
