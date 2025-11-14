import { Metadata } from "next";

export const metadata: Metadata = {
  title: "POC: Mobile Media Viewer - Testing Only",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function POCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
