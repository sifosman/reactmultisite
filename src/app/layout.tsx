import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/site/SiteChrome";
import { ThemeProvider, ThemeStyles } from "@/components/providers/ThemeProvider";
import { getStoredTheme } from "@/lib/theme/getStoredTheme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Affordable React Ecomm",
  description: "Affordable Finds. ZAR pricing. Flat shipping R60.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getStoredTheme();

  return (
    <html lang="en">
      <head>
        <ThemeStyles theme={theme} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme={theme}>
          <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_10%_-10%,rgba(17,24,39,0.08),transparent_55%),radial-gradient(900px_circle_at_90%_0%,rgba(17,24,39,0.06),transparent_45%)]">
            <SiteChrome>{children}</SiteChrome>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
