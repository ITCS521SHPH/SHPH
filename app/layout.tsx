import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "HealthFlow - Healthcare Management System",
  description:
    "Comprehensive healthcare management platform for doctors, VHVs, caregivers, and patients",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Load Leaflet CSS globally to fix MIME issue */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha512-sA+gLD3fYlr4dyyW2i6v4vQZ+6U6eZQYpsNhn+U7b+8W7+P3a9Ork7HkJtRz/NbVGWw3V5R3LyiZ1c6h1zWgMg=="
          crossOrigin=""
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
