import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { isUsableMediaDuration, resolveMediaDuration } from "@/lib/media-duration";

const DB_NAME = "mawj-studio";
const DB_VERSION = 1;

export type StoredMediaType = "video" | "audio" | "image";

export type StoredMediaRecord = {
  id: string;
  name: string;
  type: StoredMediaType;
  blob: Blob;
  thumbnail?: Blob;
  durationSeconds?: number;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
  createdAt: number;
};

export type StoredProjectRecord = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  updatedAt: number;
};

type StoreMediaFileOptions = {
  id?: string;
};

interface MawjStudioDB extends DBSchema {
  media: {
    key: string;
    value: StoredMediaRecord;
    indexes: {
      "by-created-at": number;
      "by-type": StoredMediaType;
    };
  };
  projects: {
    key: string;
    value: StoredProjectRecord;
    indexes: {
      "by-updated-at": number;
    };
  };
}

let database: IDBPDatabase<MawjStudioDB> | null = null;

export function canUseIndexedDB() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export async function getMediaDB() {
  if (!canUseIndexedDB()) {
    throw new Error("IndexedDB is not available in this browser.");
  }

  if (database) return database;

  database = await openDB<MawjStudioDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const mediaStore = db.createObjectStore("media", { keyPath: "id" });
      mediaStore.createIndex("by-created-at", "createdAt");
      mediaStore.createIndex("by-type", "type");

      const projectStore = db.createObjectStore("projects", { keyPath: "id" });
      projectStore.createIndex("by-updated-at", "updatedAt");
    },
  });

  return database;
}

export async function storeMediaFile(
  file: File,
  options: StoreMediaFileOptions = {},
): Promise<StoredMediaRecord> {
  const db = await getMediaDB();
  const mediaType = getStoredMediaType(file);
  const metadata =
    mediaType === "video"
      ? await extractVideoMetadata(file).catch(() => ({}))
      : mediaType === "image"
        ? await extractImageMetadata(file).catch(() => ({}))
        : mediaType === "audio"
          ? await extractAudioMetadata(file).catch(() => ({}))
          : {};
  const record: StoredMediaRecord = {
    id: options.id ?? createId("media"),
    name: file.name,
    type: mediaType,
    blob: file,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    createdAt: Date.now(),
    ...metadata,
  };

  await db.put("media", record);
  return record;
}

export async function getMediaRecord(id: string) {
  const db = await getMediaDB();
  return db.get("media", id);
}

export async function listMediaRecords() {
  const db = await getMediaDB();
  const records = await db.getAllFromIndex("media", "by-created-at");
  return records.reverse();
}

export async function deleteMediaRecord(id: string) {
  const db = await getMediaDB();
  await db.delete("media", id);
}

export async function storeProjectSnapshot(record: StoredProjectRecord) {
  const db = await getMediaDB();
  await db.put("projects", record);
}

export async function getProjectSnapshot(id: string) {
  const db = await getMediaDB();
  return db.get("projects", id);
}

export async function getLatestProjectSnapshot() {
  const db = await getMediaDB();
  let cursor = await db.transaction("projects").store.index("by-updated-at").openCursor(null, "prev");
  const latest = cursor?.value ?? null;
  cursor = null;
  return latest;
}

function getStoredMediaType(file: File): StoredMediaType {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return "video";
}

function extractVideoMetadata(file: File) {
  return new Promise<Pick<StoredMediaRecord, "thumbnail" | "durationSeconds" | "width" | "height">>(
    (resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      let resolvedDuration: number | undefined;

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => URL.revokeObjectURL(url);

      video.onerror = () => {
        cleanup();
        reject(new Error("Could not read video metadata."));
      };

      video.onloadedmetadata = async () => {
        resolvedDuration = await resolveMediaDuration(video).catch(() => undefined);
        const seekTime = Math.min(0.5, Math.max(0, (resolvedDuration || 1) / 4));
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 90;
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (thumbnail) => {
            cleanup();
            resolve({
              thumbnail: thumbnail ?? undefined,
              durationSeconds: isUsableMediaDuration(video.duration)
                ? video.duration
                : resolvedDuration,
              width: video.videoWidth || undefined,
              height: video.videoHeight || undefined,
            });
          },
          "image/webp",
          0.72,
        );
      };

      video.src = url;
    },
  );
}

function extractImageMetadata(file: File) {
  return new Promise<Pick<StoredMediaRecord, "thumbnail" | "width" | "height">>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    const cleanup = () => URL.revokeObjectURL(url);

    image.onload = () => {
      const thumbnail = createImageThumbnail(image);
      cleanup();
      resolve({
        thumbnail,
        width: image.naturalWidth || undefined,
        height: image.naturalHeight || undefined,
      });
    };

    image.onerror = () => {
      cleanup();
      reject(new Error("Could not read image metadata."));
    };

    image.src = url;
  });
}

function extractAudioMetadata(file: File) {
  return new Promise<Pick<StoredMediaRecord, "durationSeconds">>((resolve, reject) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);

    const cleanup = () => URL.revokeObjectURL(url);

    audio.preload = "metadata";
    audio.onloadedmetadata = async () => {
      const duration = await resolveMediaDuration(audio).catch(() => undefined);
      cleanup();
      resolve({
        durationSeconds: isUsableMediaDuration(duration) ? duration : undefined,
      });
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Could not read audio metadata."));
    };
    audio.src = url;
  });
}

function createImageThumbnail(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const maxWidth = 180;
  const maxHeight = 120;
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/webp", 0.72);
  const [header, data] = dataUrl.split(",");
  const mimeType = header.match(/data:(.*?);base64/)?.[1] ?? "image/webp";
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
