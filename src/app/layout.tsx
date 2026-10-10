import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"

import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import "@fontsource/inter/800.css"
import "@fontsource/poppins/400.css"
import "@fontsource/poppins/600.css"
import "@fontsource/poppins/700.css"
import "@fontsource/poppins/800.css"
import "@fontsource/playfair-display/400.css"
import "@fontsource/playfair-display/700.css"
import "@fontsource/bebas-neue/400.css"
import "@fontsource/oswald/400.css"
import "@fontsource/oswald/600.css"
import "@fontsource/merriweather/400.css"
import "@fontsource/merriweather/700.css"
import "@fontsource/dancing-script/400.css"
import "@fontsource/dancing-script/700.css"
import "@fontsource/caveat/400.css"
import "@fontsource/caveat/700.css"
import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/700.css"
import "@fontsource/permanent-marker/400.css"

export const metadata: Metadata = {
  title: "Studio — Free All-in-One Visual Design Platform",
  description:
    "Create graphics, edit photos, produce videos, build presentations, documents, whiteboards, charts and websites — free forever, no paywalls, no watermarks.",
  keywords: ["design", "photo editor", "video editor", "presentation", "canva alternative", "free design tool"],
  applicationName: "Studio",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  openGraph: {
    title: "Studio — Free All-in-One Visual Design Platform",
    description: "The free creative workspace: graphics, photo, video, presentations, docs, whiteboards, websites.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studio",
  },
  formatDetection: { telephone: false, date: false, address: false, email: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
        <Sonner position="bottom-right" />
      </body>
    </html>
  )
}
