import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/SessionProvider";
import { SavedRecipesProvider } from "@/components/recipe/SavedRecipesProvider";
import { SkillLevelWrapper } from "@/components/providers/SkillLevelWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.ellaspantry.co.uk"
  ),
  title: {
    default: "Ella's Pantry - Delicious Recipes for Every Occasion",
    template: "%s | Ella's Pantry",
  },
  description:
    "Discover thousands of delicious recipes with easy-to-follow instructions, ingredient lists, and helpful cooking tips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3863316145439936"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EJXMD4JRFB"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EJXMD4JRFB');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <AuthProvider>
          <SavedRecipesProvider>
            <SkillLevelWrapper>
              <Header />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </SkillLevelWrapper>
          </SavedRecipesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
