import type { Metadata, Viewport } from "next";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
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
  weight: ["300", "400", "600", "700", "900"],
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[--background] text-[--foreground]">
        {children}
      </body>
    </html>
  );
}
