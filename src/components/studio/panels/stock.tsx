"use client";

import { useEffect, useState } from "react";
import { FolderOpen, ImageIcon, Loader2, Plus, Search } from "lucide-react";
import type { MediaAsset } from "../foundation";
import { PanelHeading } from "../ui";

type StockItem = {
  id: string;
  type: "photo" | "video";
  url: string;
  previewUrl: string;
  thumbUrl: string;
  alt: string;
  width: number;
  height: number;
  duration?: number;
  creator: string;
  source: "pexels" | "pixabay" | "demo";
};

type StockApiResponse = {
  results: Array<{
    id: string;
    type: "photo" | "video";
    url: string;
    previewUrl: string;
    thumbUrl: string;
    width: number;
    height: number;
    duration?: number;
    source: "pexels" | "pixabay" | "demo";
    alt?: string;
    photographer?: string;
    videographer?: string;
  }>;
  nextPage: boolean;
  source: "pexels" | "pixabay" | "demo";
};

const STOCK_CATS = [
  { ar: "أشخاص", en: "people" },
  { ar: "طبيعة", en: "nature" },
  { ar: "أعمال", en: "business" },
  { ar: "طعام", en: "food" },
  { ar: "مدن", en: "city" },
  { ar: "تقنية", en: "technology" },
  { ar: "رياضة", en: "sport" },
  { ar: "سفر", en: "travel" },
] as const;

export function StockMediaPanel({
  onAddToTimeline,
  onAddToMediaBin,
}: {
  onAddToTimeline: (asset: MediaAsset) => void;
  onAddToMediaBin: (asset: MediaAsset) => void;
}) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [items, setItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sourceLabel, setSourceLabel] = useState<"pexels" | "pixabay" | "demo" | "">("");
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    void fetchStock("", mediaType, 1, false);
  }, [mediaType]);

  async function fetchStock(q: string, type: "photo" | "video", p: number, append: boolean) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ q, type, page: String(p), per_page: "18" });
      const res = await fetch(`/api/stock?${params}`);
      if (!res.ok) throw new Error("stock api failed");
      const data = (await res.json()) as StockApiResponse;
      const mapped: StockItem[] = data.results.map((r) => ({
        id: r.id,
        type: r.type,
        url: r.url,
        previewUrl: r.previewUrl,
        thumbUrl: r.thumbUrl,
        alt: r.alt ?? "",
        width: r.width,
        height: r.height,
        duration: r.duration,
        creator: r.photographer ?? r.videographer ?? "",
        source: r.source,
      }));
      setItems((prev) => (append ? [...prev, ...mapped] : mapped));
      setHasMore(data.nextPage);
      setSourceLabel(data.source);
      setPage(p);
    } catch {
      // silently keep existing results on error
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveCategory("");
    void fetchStock(query, mediaType, 1, false);
  }

  function handleCat(en: string) {
    setQuery(en);
    setActiveCategory(en);
    void fetchStock(en, mediaType, 1, false);
  }

  function stockToAsset(item: StockItem): MediaAsset {
    const ext = item.type === "video" ? "mp4" : "jpg";
    const mime = item.type === "video" ? "video/mp4" : "image/jpeg";
    const name = `${item.source}-${item.id}.${ext}`;
    return {
      id: `stock-${item.id}`,
      name,
      file: new File([""], name, { type: mime }),
      url: item.type === "photo" ? item.previewUrl : item.url,
      kind: item.type === "video" ? "video" : "image",
      size: 0,
      width: item.width,
      height: item.height,
      ...(item.duration ? { durationSeconds: item.duration } : {}),
    };
  }

  function markAdded(id: string) {
    setAddedSet((prev) => new Set([...prev, id]));
    setTimeout(
      () =>
        setAddedSet((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      2000,
    );
  }

  return (
    <section className="panel flex h-full flex-col gap-3 overflow-hidden p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PanelHeading icon={ImageIcon} title="Stock Media" />
        {sourceLabel && (
          <span
            className={`badge text-[10px] ${
              sourceLabel === "demo" ? "badge-muted" : "badge-brand"
            }`}
          >
            {sourceLabel === "demo"
              ? "Demo"
              : sourceLabel === "pexels"
                ? "Pexels"
                : "Pixabay"}
          </span>
        )}
      </div>

      {/* Photo / Video tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--panel-soft)] p-1">
        {(["photo", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMediaType(t)}
            className={`rounded-md py-1 text-xs font-black transition ${
              mediaType === t
                ? "bg-[var(--brand)] text-black"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t === "photo" ? "📷 صور" : "🎬 فيديو"}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالإنجليزية..."
          dir="rtl"
          className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--brand)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="toolbar-btn flex items-center gap-1 px-2.5"
          aria-label="Search"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      </form>

      {/* Category quick filters */}
      <div className="flex flex-wrap gap-1">
        {STOCK_CATS.map((cat) => (
          <button
            key={cat.en}
            type="button"
            onClick={() => handleCat(cat.en)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition ${
              activeCategory === cat.en
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
            }`}
          >
            {cat.ar}
          </button>
        ))}
      </div>

      {/* Results grid */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && !isLoading ? (
          <div className="empty-state py-8">
            <ImageIcon className="h-10 w-10 opacity-30" aria-hidden="true" />
            <p className="empty-state-text mt-2">
              {sourceLabel === "demo" && mediaType === "video"
                ? "فيديوهات الستوك تحتاج مفتاح Pexels أو Pixabay"
                : "ابحث عن صور أو فيديوهات"}
            </p>
            <p className="empty-state-sub">
              {sourceLabel === "demo" && mediaType === "video"
                ? "أضف PEXELS_API_KEY لتفعيل البحث الحي عن الفيديو"
                : "ملايين الأصول المجانية"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((item) => {
                const added = addedSet.has(item.id);
                const isPortrait = item.height >= item.width;
                return (
                  <div
                    key={item.id}
                    className={`group relative overflow-hidden rounded-lg bg-[var(--panel-soft)] ${
                      isPortrait ? "aspect-[3/4]" : "aspect-video"
                    }`}
                  >
                    <div
                      role="img"
                      aria-label={item.alt || item.id}
                      className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:brightness-50"
                      style={{ backgroundImage: `url("${item.thumbUrl || item.previewUrl}")` }}
                    />

                    {/* Video duration badge */}
                    {item.type === "video" && item.duration !== undefined && (
                      <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-black text-white">
                        {Math.floor(item.duration / 60)}:
                        {String(item.duration % 60).padStart(2, "0")}
                      </span>
                    )}

                    {/* Source badge */}
                    <span className="absolute right-1 top-1 rounded bg-black/50 px-1 py-0.5 text-[8px] font-bold uppercase text-white/70">
                      {item.source === "demo" ? "free" : item.source}
                    </span>

                    {/* Action overlay — revealed on hover */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          onAddToTimeline(stockToAsset(item));
                          markAdded(item.id);
                        }}
                        className="flex w-full items-center justify-center gap-1 rounded bg-[var(--brand)] px-2 py-1 text-[10px] font-black text-black"
                      >
                        {added ? (
                          "✓ تمت الإضافة"
                        ) : (
                          <>
                            <Plus className="h-3 w-3" aria-hidden="true" />
                            أضف للتايملاين
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToMediaBin(stockToAsset(item))}
                        className="flex w-full items-center justify-center gap-1 rounded border border-white/30 bg-black/60 px-2 py-1 text-[10px] font-black text-white"
                      >
                        <FolderOpen className="h-3 w-3" aria-hidden="true" />
                        حفظ في الوسائط
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && !isLoading && (
              <button
                type="button"
                onClick={() => void fetchStock(query, mediaType, page + 1, true)}
                className="mt-3 w-full rounded-lg border border-[var(--line)] py-2 text-xs font-black text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                تحميل المزيد ↓
              </button>
            )}

            {/* Append-loading spinner */}
            {isLoading && items.length > 0 && (
              <div className="flex justify-center py-4">
                <Loader2
                  className="h-5 w-5 animate-spin text-[var(--brand)]"
                  aria-hidden="true"
                />
              </div>
            )}
          </>
        )}

        {/* Full-panel initial loading spinner */}
        {isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2
              className="h-8 w-8 animate-spin text-[var(--brand)]"
              aria-hidden="true"
            />
            <p className="text-xs text-[var(--muted)]">جارٍ التحميل...</p>
          </div>
        )}
      </div>

      {/* Attribution footer */}
      {sourceLabel && (sourceLabel !== "demo" || mediaType === "photo") && (
        <p className="text-center text-[9px] text-[var(--muted)]">
          {sourceLabel === "demo" ? "Demo photos from " : "Photos & videos by "}
          <a
            href={
              sourceLabel === "pexels" || sourceLabel === "demo"
                ? "https://www.pexels.com"
                : "https://pixabay.com"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand)] hover:underline"
          >
            {sourceLabel === "pixabay" ? "Pixabay" : "Pexels"}
          </a>
        </p>
      )}
    </section>
  );
}
