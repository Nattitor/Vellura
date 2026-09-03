import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/providers/language-provider";
import { resolveInitialLanguage } from "@/utils/i18n/accept-language";
import { languageTypeToBcp47 } from "@/utils/i18n/bcp47";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090B",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerList = await headers();

  // 1. The user's previously chosen UI language (cookie) wins, if present.
  // 2. Otherwise, detect from the browser's Accept-Language header.
  // 3. Otherwise, default to English.
  const cookieLang = cookieStore.get("vellura_ui_language")?.value;
  const initialLang = resolveInitialLanguage(
    headerList.get("accept-language"),
    cookieLang
  );
  const cookieOutput = cookieStore.get("vellura_output_language")?.value || initialLang;
  const htmlLang = languageTypeToBcp47(initialLang);

  return (
    <html
      lang={htmlLang}
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLanguage={initialLang} initialOutputLanguage={cookieOutput}>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
