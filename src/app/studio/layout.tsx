import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الاستوديو",
  description: "محرر Mawj Studio — رفع، قوالب، تايملاين، ذكاء اصطناعي، وتصدير.",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
