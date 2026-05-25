import type { Metadata } from "next";
import { TemplateBrowser } from "@/components/template-browser";
import { getTemplates } from "@/lib/video-template-store";

export const metadata: Metadata = {
  title: "Templates | Mawj Studio",
  description: "JSON-based editable video templates for Mawj Studio.",
};

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return <TemplateBrowser templates={templates} />;
}
