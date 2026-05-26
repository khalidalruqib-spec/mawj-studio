import type { Metadata } from "next";
import { TemplateBrowser } from "@/components/template-browser";
import { getTemplates } from "@/lib/video-template-store";

export const metadata: Metadata = {
  title: "Template Marketplace — Mawj Studio",
  description:
    "19+ قالب فيديو احترافي: تيك توك، إعلانات، عيادات، بودكاست، عقار، فعاليات وأكثر. كل قالب يتحول إلى مشروع مونتاج كامل قابل للتعديل.",
};

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return <TemplateBrowser templates={templates} />;
}
