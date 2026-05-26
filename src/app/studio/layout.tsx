import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "الاستوديو",
  description: `محرر ${BRAND.fullName} — رفع، قوالب، تايملاين، ذكاء اصطناعي، وتصدير.`,
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
