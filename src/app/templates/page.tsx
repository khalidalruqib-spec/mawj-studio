import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { TemplateBrowser } from "@/components/template-browser";
import { getTemplates } from "@/lib/video-template-store";

export const metadata: Metadata = {
  title: "سوق القوالب",
  description: `24+ قالب فيديو احترافي على ${BRAND.nameAr} — CapCut وTikTok: ٣ أسباب، Flash Sale، POV، Karaoke، أخبار عاجلة، وأكثر.`,
};

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return <TemplateBrowser templates={templates} />;
}
