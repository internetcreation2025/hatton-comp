import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hatton Padel",
  description: "Who's playing, and when.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hatton Padel",
    statusBarStyle: "black-translucent",
  },
  // It's a private group app — keep it out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#080d1c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col bg-bg text-ink">
        {children}
      </body>
    </html>
  );
}
