import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const siteUrl = getSiteUrl();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#07080b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Mawj Studio — محرر الفيديو بالذكاء الاصطناعي",
    template: "%s | Mawj Studio",
  },
  description:
    "منصة تحرير الفيديو القصير بالذكاء الاصطناعي للمبدعين السعوديين والعرب. حوّل أفكارك إلى محتوى احترافي لـ TikTok وInstagram وYouTube Shorts.",
  keywords: [
    "محرر فيديو", "ذكاء اصطناعي", "تيك توك", "انستقرام", "يوتيوب شورتس",
    "video editor", "AI", "Arabic", "Saudi", "short-form content",
    "Mawj Studio", "موج ستوديو",
  ],
  authors: [{ name: "Mawj Studio" }],
  creator: "Mawj Studio",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "Mawj Studio",
    title: "Mawj Studio — محرر الفيديو بالذكاء الاصطناعي",
    description:
      "منصة تحرير الفيديو القصير بالذكاء الاصطناعي للمبدعين السعوديين والعرب.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Mawj Studio — AI Video Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mawj Studio — محرر الفيديو بالذكاء الاصطناعي",
    description: "حوّل أفكارك إلى محتوى احترافي بالذكاء الاصطناعي.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/mawj-icon.svg", type: "image/svg+xml" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[--background] text-[--foreground]">
        {children}
      </body>
    </html>
  );
}
