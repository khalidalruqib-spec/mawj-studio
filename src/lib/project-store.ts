import type { EditPlan } from "@/lib/edit-plan";
import type { AspectRatio, Platform, VideoStyleId } from "@/lib/video-styles";

export type StudioProject = {
  id: string;
  title: string;
  status: "draft" | "uploaded" | "planned" | "rendering" | "completed" | "failed";
  styleId: VideoStyleId;
  platform: Platform;
  aspectRatio: AspectRatio;
  sourceFileName: string;
  sourceFileSize: number;
  sourceMimeType: string;
  sourceDurationSeconds: number;
  storageBucket?: string | null;
  storagePath?: string | null;
  editPlan?: EditPlan | null;
  createdAt: string;
  updatedAt: string;
};

const projects = new Map<string, StudioProject>();

export function listLocalProjects() {
  return [...projects.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLocalProject(id: string) {
  return projects.get(id) ?? null;
}

export function createLocalProject(input: Omit<StudioProject, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const project: StudioProject = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  projects.set(project.id, project);
  return project;
}

export function updateLocalProject(id: string, patch: Partial<StudioProject>) {
  const existing = projects.get(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };

  projects.set(id, updated);
  return updated;
}
