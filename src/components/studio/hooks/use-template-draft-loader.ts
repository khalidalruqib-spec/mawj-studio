import { useEffect } from "react";
import type { TemplateProject } from "@/lib/video-template-engine";

export function useTemplateDraftLoader({
  onLoad,
  onError,
}: {
  onLoad: (project: TemplateProject) => void;
  onError: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw =
      window.sessionStorage.getItem("mawj-template-project-draft") ??
      window.localStorage.getItem("mawj-template-project-draft");

    if (!raw) return;

    window.setTimeout(() => {
      try {
        const project = JSON.parse(raw) as TemplateProject;
        onLoad(project);
        window.sessionStorage.removeItem("mawj-template-project-draft");
      } catch {
        onError();
      }
    }, 0);
  }, [onError, onLoad]);
}
