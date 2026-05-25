import { create } from "zustand";
import {
  createTimelineItem,
  getTrackForLayerType,
  type Asset,
  type Layer,
  type TimelineItem,
  type Track,
  type VideoProject,
} from "@/lib/video-project-model";

const HISTORY_LIMIT = 25;

type MoveTimelineItemInput = {
  itemId: string;
  trackId?: string;
  start?: number;
};

type ResizeTimelineItemInput = {
  itemId: string;
  start?: number;
  duration?: number;
};

export type VideoProjectStore = {
  currentProject: VideoProject | null;
  selectedLayerId: string | null;
  selectedTimelineItemId: string | null;
  playhead: number;
  zoom: number;
  past: VideoProject[];
  future: VideoProject[];
  setCurrentProject: (project: VideoProject, options?: { resetHistory?: boolean }) => void;
  clearProject: () => void;
  selectLayer: (layerId: string | null) => void;
  selectTimelineItem: (itemId: string | null) => void;
  setPlayhead: (seconds: number) => void;
  setZoom: (zoom: number) => void;
  addAsset: (asset: Asset) => void;
  addLayer: (layer: Layer, trackId?: string) => void;
  updateLayer: (layerId: string, patch: Partial<Layer>) => void;
  deleteLayer: (layerId: string) => void;
  addTimelineItem: (item: TimelineItem | Omit<TimelineItem, "end">) => void;
  updateTimelineItem: (itemId: string, patch: Partial<TimelineItem>) => void;
  moveTimelineItem: (input: MoveTimelineItemInput) => void;
  resizeTimelineItem: (input: ResizeTimelineItemInput) => void;
  deleteTimelineItem: (itemId: string) => void;
  undo: () => void;
  redo: () => void;
};

type StoreSet = (
  partial:
    | Partial<VideoProjectStore>
    | ((state: VideoProjectStore) => Partial<VideoProjectStore>),
) => void;

type StoreGet = () => VideoProjectStore;

export const useVideoProjectStore = create<VideoProjectStore>((set, get) => ({
  currentProject: null,
  selectedLayerId: null,
  selectedTimelineItemId: null,
  playhead: 0,
  zoom: 1,
  past: [],
  future: [],

  setCurrentProject: (project, options) => {
    set((state) => ({
      currentProject: project,
      selectedLayerId: project.selectedLayerId ?? state.selectedLayerId,
      selectedTimelineItemId: project.selectedItemId ?? state.selectedTimelineItemId,
      past:
        options?.resetHistory || !state.currentProject
          ? []
          : [state.currentProject, ...state.past].slice(0, HISTORY_LIMIT),
      future: [],
    }));
  },

  clearProject: () => {
    set({
      currentProject: null,
      selectedLayerId: null,
      selectedTimelineItemId: null,
      playhead: 0,
      past: [],
      future: [],
    });
  },

  selectLayer: (layerId) => {
    set((state) => {
      const selectedTimelineItemId = layerId
        ? state.currentProject?.tracks.flatMap((track) => track.items).find((item) => item.layerId === layerId)?.id ?? null
        : null;

      return {
        selectedLayerId: layerId,
        selectedTimelineItemId,
        currentProject: state.currentProject
          ? touchProject({
              ...state.currentProject,
              selectedLayerId: layerId ?? undefined,
              selectedItemId: selectedTimelineItemId ?? undefined,
            })
          : null,
      };
    });
  },

  selectTimelineItem: (itemId) => {
    set((state) => {
      const item = itemId
        ? state.currentProject?.tracks.flatMap((track) => track.items).find((entry) => entry.id === itemId) ?? null
        : null;

      return {
        selectedTimelineItemId: itemId,
        selectedLayerId: item?.layerId ?? null,
        currentProject: state.currentProject
          ? touchProject({
              ...state.currentProject,
              selectedItemId: itemId ?? undefined,
              selectedLayerId: item?.layerId,
            })
          : null,
      };
    });
  },

  setPlayhead: (seconds) => set({ playhead: Math.max(0, seconds) }),

  setZoom: (zoom) => set({ zoom: clamp(zoom, 0.2, 5) }),

  addAsset: (asset) => {
    commitProject(set, get, (project) => ({
      ...project,
      assets: upsertById(project.assets, asset),
    }));
  },

  addLayer: (layer, trackId) => {
    commitProject(set, get, (project) => {
      const targetTrack = ensureTrack(project.tracks, layer, trackId);
      const tracks = project.tracks.some((track) => track.id === targetTrack.id)
        ? project.tracks
        : [...project.tracks, targetTrack];
      const existingItem = targetTrack.items.find((item) => item.layerId === layer.id);
      const nextItem =
        existingItem ??
        createTimelineItem({
          id: createId("timeline-item"),
          layerId: layer.id,
          trackId: targetTrack.id,
          type: layer.type,
          start: layer.start,
          duration: layer.duration,
          zIndex: layer.zIndex,
          locked: layer.locked,
          hidden: layer.hidden,
        });

      return {
        ...project,
        selectedLayerId: layer.id,
        selectedItemId: nextItem.id,
        layers: upsertById(project.layers, layer),
        tracks: tracks.map((track) =>
          track.id === targetTrack.id
            ? {
                ...track,
                items: upsertById(track.items, nextItem),
              }
            : track,
        ),
      };
    });
  },

  updateLayer: (layerId, patch) => {
    commitProject(set, get, (project) => ({
      ...project,
      layers: project.layers.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              ...patch,
              style: patch.style ? { ...layer.style, ...patch.style } : layer.style,
              effects: patch.effects ?? layer.effects,
              keyframes: patch.keyframes ?? layer.keyframes,
            }
          : layer,
      ),
      tracks: project.tracks.map((track) => ({
        ...track,
        items: track.items.map((item) =>
          item.layerId === layerId
            ? normalizeTimelineItem({
                ...item,
                start: patch.start ?? item.start,
                duration: patch.duration ?? item.duration,
                zIndex: patch.zIndex ?? item.zIndex,
                locked: patch.locked ?? item.locked,
                hidden: patch.hidden ?? item.hidden,
              })
            : item,
        ),
      })),
    }));
  },

  deleteLayer: (layerId) => {
    commitProject(set, get, (project) => {
      const deletedItemIds = project.tracks
        .flatMap((track) => track.items)
        .filter((item) => item.layerId === layerId)
        .map((item) => item.id);

      return {
        ...project,
        selectedLayerId: project.selectedLayerId === layerId ? undefined : project.selectedLayerId,
        selectedItemId:
          project.selectedItemId && deletedItemIds.includes(project.selectedItemId)
            ? undefined
            : project.selectedItemId,
        layers: project.layers.filter((layer) => layer.id !== layerId),
        scenes: project.scenes.map((scene) => ({
          ...scene,
          layerIds: scene.layerIds.filter((id) => id !== layerId),
        })),
        tracks: project.tracks.map((track) => ({
          ...track,
          items: track.items.filter((item) => item.layerId !== layerId),
        })),
      };
    });
  },

  addTimelineItem: (item) => {
    commitProject(set, get, (project) => ({
      ...project,
      selectedItemId: item.id,
      selectedLayerId: item.layerId,
      tracks: project.tracks.map((track) =>
        track.id === item.trackId
          ? {
              ...track,
              items: upsertById(track.items, normalizeTimelineItem(item)),
            }
          : track,
      ),
    }));
  },

  updateTimelineItem: (itemId, patch) => {
    commitProject(set, get, (project) => {
      const existing = findTimelineItem(project, itemId);
      const nextItem = existing
        ? normalizeTimelineItem({
            ...existing,
            ...patch,
            start: patch.start ?? existing.start,
            duration: patch.duration ?? existing.duration,
            trackId: patch.trackId ?? existing.trackId,
          })
        : null;

      if (!nextItem) return project;

      return syncItemIntoProject(project, nextItem);
    });
  },

  moveTimelineItem: ({ itemId, trackId, start }) => {
    commitProject(set, get, (project) => {
      const existing = findTimelineItem(project, itemId);
      if (!existing) return project;

      const nextItem = normalizeTimelineItem({
        ...existing,
        trackId: trackId ?? existing.trackId,
        start: start ?? existing.start,
      });

      return syncItemIntoProject(project, nextItem);
    });
  },

  resizeTimelineItem: ({ itemId, start, duration }) => {
    commitProject(set, get, (project) => {
      const existing = findTimelineItem(project, itemId);
      if (!existing) return project;

      const nextItem = normalizeTimelineItem({
        ...existing,
        start: start ?? existing.start,
        duration: Math.max(0.1, duration ?? existing.duration),
      });

      return syncItemIntoProject(project, nextItem);
    });
  },

  deleteTimelineItem: (itemId) => {
    commitProject(set, get, (project) => ({
      ...project,
      selectedItemId: project.selectedItemId === itemId ? undefined : project.selectedItemId,
      tracks: project.tracks.map((track) => ({
        ...track,
        items: track.items.filter((item) => item.id !== itemId),
      })),
    }));
  },

  undo: () => {
    const state = get();
    const [previous, ...rest] = state.past;
    if (!previous || !state.currentProject) return;

    set({
      currentProject: previous,
      selectedLayerId: previous.selectedLayerId ?? null,
      selectedTimelineItemId: previous.selectedItemId ?? null,
      past: rest,
      future: [state.currentProject, ...state.future].slice(0, HISTORY_LIMIT),
    });
  },

  redo: () => {
    const state = get();
    const [next, ...rest] = state.future;
    if (!next || !state.currentProject) return;

    set({
      currentProject: next,
      selectedLayerId: next.selectedLayerId ?? null,
      selectedTimelineItemId: next.selectedItemId ?? null,
      past: [state.currentProject, ...state.past].slice(0, HISTORY_LIMIT),
      future: rest,
    });
  },
}));

function commitProject(
  set: StoreSet,
  get: StoreGet,
  transform: (project: VideoProject) => VideoProject,
) {
  const state = get();
  if (!state.currentProject) return;

  const previous = state.currentProject;
  const next = touchProject(transform(previous));

  set({
    currentProject: next,
    selectedLayerId: next.selectedLayerId ?? state.selectedLayerId,
    selectedTimelineItemId: next.selectedItemId ?? state.selectedTimelineItemId,
    past: [previous, ...state.past].slice(0, HISTORY_LIMIT),
    future: [],
  });
}

function touchProject(project: VideoProject): VideoProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  };
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  if (!items.some((entry) => entry.id === item.id)) return [...items, item];
  return items.map((entry) => (entry.id === item.id ? item : entry));
}

function normalizeTimelineItem(item: TimelineItem | Omit<TimelineItem, "end">): TimelineItem {
  return {
    ...item,
    end: item.start + item.duration,
  };
}

function ensureTrack(tracks: Track[], layer: Layer, trackId?: string): Track {
  const existingById = trackId ? tracks.find((track) => track.id === trackId) : null;
  if (existingById) return existingById;

  const preferredType = getTrackForLayerType(layer.type);
  return (
    tracks.find((track) => track.type === preferredType) ??
    tracks[0] ?? {
      id: createId("track"),
      type: preferredType,
      name: `${preferredType[0].toUpperCase()}${preferredType.slice(1)} Track`,
      order: 0,
      items: [],
    }
  );
}

function findTimelineItem(project: VideoProject, itemId: string) {
  return project.tracks.flatMap((track) => track.items).find((item) => item.id === itemId) ?? null;
}

function syncItemIntoProject(project: VideoProject, item: TimelineItem): VideoProject {
  return {
    ...project,
    selectedItemId: item.id,
    selectedLayerId: item.layerId,
    layers: project.layers.map((layer) =>
      layer.id === item.layerId
        ? {
            ...layer,
            start: item.start,
            duration: item.duration,
            zIndex: item.zIndex,
            locked: item.locked,
            hidden: item.hidden,
          }
        : layer,
    ),
    tracks: project.tracks.map((track) => ({
      ...track,
      items:
        track.id === item.trackId
          ? upsertById(
              track.items.filter((entry) => entry.id !== item.id),
              item,
            )
          : track.items.filter((entry) => entry.id !== item.id),
    })),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
