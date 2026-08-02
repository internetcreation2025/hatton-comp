import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { THEME_COLOUR, THEME_COOKIE, readTheme } from "@/lib/theme";
import { siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Link previews need full URLs, not relative ones.
  metadataBase: new URL(siteUrl()),
  title: "Hatton Competitors",
  description: "Who's playing, and when.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // This is the name that appears under the icon on an iPhone home screen.
    title: "Hatton Competitors",
    statusBarStyle: "default",
  },
  // It's a private group app — keep it out of search results.
  robots: { index: false, follow: false },
};

// No themeColor here on purpose — it's emitted per-request in <head> below so
// it can follow the chosen theme, and two theme-color tags would conflict.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the saved preference on the server so the page arrives in the right
  // colours — no flash of the wrong theme on the way in.
  const theme = readTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en-GB"
      data-theme={theme}
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content={THEME_COLOUR[theme]} />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-bg text-ink">
        {children}
      </body>
    </html>
  );
}
