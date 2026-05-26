import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
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
    default: BRAND.metaTitle,
    template: `%s | ${BRAND.nameAr}`,
  },
  description: BRAND.description,
  keywords: [
    "محرر فيديو", "ذكاء اصطناعي", "تيك توك", "انستقرام", "يوتيوب شورتس",
    "video editor", "AI", "Arabic", "Saudi", "short-form content",
    BRAND.fullName, "موج", "MAWJ",
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
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: `${BRAND.fullName} — AI Video Editor`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.metaTitle,
    description: BRAND.taglineAr,
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
