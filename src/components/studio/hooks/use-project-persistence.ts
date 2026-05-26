import { useEffect, type MutableRefObject } from "react";
import { storeProjectSnapshot } from "@/lib/media-db";

export function useProjectPersistence({
  renderResultUrl,
  restoredMediaOnceRef,
  onRestoreMedia,
  autosaveSnapshot,
  autosaveProjectId,
  autosaveProjectName,
}: {
  renderResultUrl?: string;
  restoredMediaOnceRef: MutableRefObject<boolean>;
  onRestoreMedia: (isCancelled: () => boolean) => Promise<void>;
  autosaveSnapshot: Record<string, unknown>;
  autosaveProjectId: string;
  autosaveProjectName: string;
}) {
  useEffect(() => {
    return () => {
      if (renderResultUrl) URL.revokeObjectURL(renderResultUrl);
    };
  }, [renderResultUrl]);

  useEffect(() => {
    if (restoredMediaOnceRef.current) return;
    restoredMediaOnceRef.current = true;

    let cancelled = false;
    void onRestoreMedia(() => cancelled).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [onRestoreMedia, restoredMediaOnceRef]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem("mawj-studio-autosave", JSON.stringify(autosaveSnapshot));

    void storeProjectSnapshot({
      id: autosaveProjectId,
      name: autosaveProjectName,
      data: autosaveSnapshot,
      updatedAt: Date.now(),
    }).catch(() => undefined);
  }, [autosaveProjectId, autosaveProjectName, autosaveSnapshot]);
}
