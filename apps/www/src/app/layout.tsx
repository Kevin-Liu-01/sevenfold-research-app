import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ketspen – Unified Research Workflow Platform",
  description:
    "Ketspen unifies discovery, reading, annotation and writing into one project-aware platform.",
  keywords: [
    "research workflow",
    "academic research",
    "AI research assistant",
    "paper management",
    "citation management",
    "research platform",
    "scientific writing",
    "literature review",
    "research tools",
    "knowledge management",
  ],
  openGraph: {
    title: "Ketspen – Unified Research Workflow Platform",
    description:
      "Ketspen unifies discovery, reading, annotation and writing into one project-aware platform.",
    url: "https://ketspen.com/",
    siteName: "Ketspen",
    images: [
      {
        url: "https://ketspen.com/og-image.jpg", // Replace with your actual Open Graph image
        width: 1200,
        height: 630,
        alt: "Ketspen – Unified Research Workflow Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ketspen – Unified Research Workflow Platform",
    description:
      "Ketspen unifies discovery, reading, annotation and writing into one project-aware platform.",
    creator: "@ketspen", // Replace with your actual Twitter handle
    images: ["https://ketspen.com/twitter-image.jpg"], // Replace with your actual Twitter image
  },
  alternates: {
    canonical: "https://ketspen.com/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
