import type { Json } from "@/lib/supabase/json";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          status: "draft" | "uploaded" | "planned" | "rendering" | "completed" | "failed";
          style_id:
            | "viral-saudi"
            | "premium-brand"
            | "podcast-cuts"
            | "product-drop"
            | "educational"
            | "restaurant-ad";
          platform: "tiktok" | "instagram" | "shorts" | "snapchat";
          aspect_ratio: "9:16" | "1:1" | "16:9";
          source_file_name: string;
          source_file_size: number;
          source_mime_type: string;
          source_duration_seconds: number;
          storage_bucket: string | null;
          storage_path: string | null;
          edit_plan: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      render_jobs: {
        Row: {
          id: string;
          project_id: string;
          status: "queued" | "running" | "completed" | "failed";
          input: Json;
          output: Json | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["render_jobs"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["render_jobs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "render_jobs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
