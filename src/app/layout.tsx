import type { Metadata, Viewport } from "next";
import {
  Almarai,
  Cairo,
  Changa,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans_Arabic,
  Noto_Sans_Arabic,
  Tajawal,
} from "next/font/google";
import { BRAND } from "@/lib/brand";
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

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const almarai = Almarai({
  variable: "--font-almarai",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const changa = Changa({
  variable: "--font-changa",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  themeColor: BRAND.colors.background,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: BRAND.metaTitle,
    template: `%s | ${BRAND.nameAr}`,
  },
  description: BRAND.description,
  keywords: [
    "محرر فيديو", "ذكاء اصطناعي", "تيك توك", "انستقرام", "يوتيوب شورتس",
    "video editor", "AI", "Arabic", "Saudi", "short-form content",
    BRAND.fullName, "المنصة", "Al-Manassa", "video AI",
  ],
  authors: [{ name: BRAND.fullName }],
  creator: BRAND.fullName,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: BRAND.fullName,
    title: BRAND.metaTitle,
    description: BRAND.description,
    images: [
      {
        url: "/platform-logo.png",
        width: 1024,
        height: 558,
        alt: `${BRAND.fullName} — ${BRAND.taglineAr}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.metaTitle,
    description: BRAND.taglineAr,
    images: ["/platform-logo.png"],
  },
  icons: {
    icon: [
      { url: "/platform-icon.png", type: "image/png" },
      { url: "/platform-logo.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/platform-icon.png", type: "image/png" }],
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
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${ibmPlexArabic.variable} ${tajawal.variable} ${notoSansArabic.variable} ${almarai.variable} ${changa.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[--background] text-[--foreground]">
        {children}
      </body>
    </html>
  );
}
