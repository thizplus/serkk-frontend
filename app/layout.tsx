import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/analytics/GoogleTagManager";
import { PWAInstaller } from "@/components/pwa/PWAInstaller";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "VOOBIZE - โซเชียลไทยแท้",
    template: "%s | VOOBIZE",
  },
  description: "แพลตฟอร์มโซเชียลมีเดียไทยแท้ แบ่งปันเรื่องราว ความคิด และเชื่อมต่อกับคนไทย",
  keywords: ["โซเชียล", "ไทย", "social media", "community", "thailand"],
  authors: [{ name: "VOOBIZE Team" }],
  creator: "VOOBIZE",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "VOOBIZE",
    title: "VOOBIZE - โซเชียลไทยแท้",
    description: "แพลตฟอร์มโซเชียลมีเดียไทยแท้ แบ่งปันเรื่องราว ความคิด และเชื่อมต่อกับคนไทย",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "VOOBIZE Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOOBIZE - โซเชียลไทยแท้",
    description: "แพลตฟอร์มโซเชียลมีเดียไทยแท้ แบ่งปันเรื่องราว ความคิด และเชื่อมต่อกับคนไทย",
    images: ["/logo.png"],
    creator: "@voobize",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    types: {
      'application/rss+xml': [
        {
          url: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}/rss.xml`,
          title: 'VOOBIZE RSS Feed',
        },
      ],
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "VOOBIZE",
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleTagManagerNoScript gtmId={gtmId} />
        <GoogleTagManager gtmId={gtmId} />
        <PWAInstaller />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
