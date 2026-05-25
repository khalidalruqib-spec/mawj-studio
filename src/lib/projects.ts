import {
  createLocalProject,
  getLocalProject,
  listLocalProjects,
  updateLocalProject,
  type StudioProject,
} from "@/lib/project-store";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { EditPlan } from "@/lib/edit-plan";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type CreateProjectInput = {
  title: string;
  styleId: StudioProject["styleId"];
  platform: StudioProject["platform"];
  aspectRatio: StudioProject["aspectRatio"];
  sourceFileName: string;
  sourceFileSize: number;
  sourceMimeType: string;
  sourceDurationSeconds: number;
};

export async function listProjects() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return listLocalProjects();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    console.warn("Falling back to local projects:", error.message);
    return listLocalProjects();
  }

  return data.map(rowToProject);
}

export async function createProject(input: CreateProjectInput) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return createLocalProject({
      ...input,
      status: "draft",
      storageBucket: null,
      storagePath: null,
      editPlan: null,
    });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert(projectInputToRow(input))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToProject(data);
}

export async function getProject(id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return getLocalProject(id);

  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();

  if (error) return null;
  return rowToProject(data);
}

export async function updateProjectUpload(id: string, storagePath: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return updateLocalProject(id, {
      status: "uploaded",
      storageBucket: "local-preview",
      storagePath,
    });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      status: "uploaded",
      storage_bucket: process.env.SUPABASE_VIDEO_BUCKET ?? "mawj-source-videos",
      storage_path: storagePath,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToProject(data);
}

export async function updateProjectPlan(id: string, editPlan: EditPlan) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return updateLocalProject(id, {
      status: "planned",
      editPlan,
    });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      status: "planned",
      edit_plan: editPlan,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToProject(data);
}

function projectInputToRow(input: CreateProjectInput): Database["public"]["Tables"]["projects"]["Insert"] {
  return {
    id: crypto.randomUUID(),
    title: input.title,
    status: "draft",
    style_id: input.styleId,
    platform: input.platform,
    aspect_ratio: input.aspectRatio,
    source_file_name: input.sourceFileName,
    source_file_size: input.sourceFileSize,
    source_mime_type: input.sourceMimeType,
    source_duration_seconds: input.sourceDurationSeconds,
    storage_bucket: null,
    storage_path: null,
    edit_plan: null,
  };
}

function rowToProject(row: ProjectRow): StudioProject {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    styleId: row.style_id,
    platform: row.platform,
    aspectRatio: row.aspect_ratio,
    sourceFileName: row.source_file_name,
    sourceFileSize: row.source_file_size,
    sourceMimeType: row.source_mime_type,
    sourceDurationSeconds: row.source_duration_seconds,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    editPlan: row.edit_plan as EditPlan | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
