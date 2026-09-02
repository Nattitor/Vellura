import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/providers/language-provider";
import { LanguageType } from "@/utils/i18n/dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLang = (cookieStore.get("vellura_ui_language")?.value as LanguageType) || "Spanish";
  const cookieOutput = cookieStore.get("vellura_output_language")?.value || "Spanish";

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLanguage={cookieLang} initialOutputLanguage={cookieOutput}>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
