import type { Metadata } from "next";
import { TemplateBrowser } from "@/components/template-browser";
import { getTemplates } from "@/lib/video-template-store";

export const metadata: Metadata = {
  title: "Template Marketplace — Mawj Studio",
  description:
    "24+ قالب فيديو احترافي مستوحى من CapCut وTikTok: ٣ أسباب، Flash Sale، POV، Karaoke، أخبار عاجلة، وأكثر.",
};

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return <TemplateBrowser templates={templates} />;
}
