import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/analytics/GoogleTagManager";
import { PWAInstaller } from "@/features/pwa";
import { DrawerProvider } from "@/shared/contexts/DrawerContext";
import { DrawerManager } from "@/shared/components/drawers/DrawerManager";

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
    default: "SUEKK - ใครไม่เสือก ไทยเสือก",
    template: "%s | SUEKK",
  },
  description: "แพลตฟอร์มโซเชียลมีเดียไทยแท้ แบ่งปันเรื่องราว ความคิด และเชื่อมต่อกับคนไทย",
  keywords: ["โซเชียล", "ไทย", "social media", "community", "thailand"],
  authors: [{ name: "SUEKK Team" }],
  creator: "SUEKK",
  icons: {
    icon: [
      { url: "/icon-white.svg", sizes: "any" },
    ],
    apple: [
      { url: "/icon-white.svg", sizes: "180x180" },
    ],
    shortcut: "/icon-white.svg",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "SUEKK",
    title: "SUEKK - ใครไม่เสือก ไทยเสือก",
    description: "แพลตฟอร์มโซเชียลมีเดียไทยแท้ แบ่งปันเรื่องราว ความคิด และเชื่อมต่อกับคนไทย",
    images: [
      {
        url: "/icon-white.svg",
        width: 1200,
        height: 630,
        alt: "SUEKK Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SUEKK - ใครไม่เสือก ไทยเสือก",
    description: "แพลตฟอร์มโซเชียลมีเดียไทยแท้ แบ่งปันเรื่องราว ความคิด และเชื่อมต่อกับคนไทย",
    images: ["/icon-white.svg"],
    creator: "@suekk",
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
          title: 'SUEKK RSS Feed',
        },
      ],
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "SUEKK",
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
            <DrawerProvider>
              <ChatProvider>
                <NotificationProvider>
                  {children}
                  <DrawerManager />
                  <Toaster />
                </NotificationProvider>
              </ChatProvider>
            </DrawerProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
