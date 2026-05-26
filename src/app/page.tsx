import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Mawj Studio — استوديو الفيديو القصير بالذكاء الاصطناعي",
  description:
    "قوالب سعودية، تحرير ذكي، وكابشن عربي — منصة واحدة لمبدعي تيك توك والمتاجر والوكالات.",
};

export default function HomePage() {
  return <LandingPage />;
}
