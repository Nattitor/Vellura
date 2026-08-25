import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Vellura | The Intelligent Workspace",
  description: "Generate hyper-personalized, premium executive cover letters and pitches with AI. The intelligent workspace for your career.",
  openGraph: {
    title: "Vellura | The Intelligent Workspace",
    description: "Generate hyper-personalized, premium executive cover letters and pitches with AI.",
    url: "https://vellura.com",
    siteName: "Vellura",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vellura | The Intelligent Workspace",
    description: "Generate hyper-personalized, premium executive cover letters and pitches with AI.",
  },
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
