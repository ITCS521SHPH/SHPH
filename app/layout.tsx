import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SyncStatusComponent } from "@/components/offline/sync-status"
import { OfflineIndicator } from "@/components/offline/offline-indicator"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "SHPH - Subdistrict Health Promotion Hospital",
  description: "Healthcare management system for VHVs, doctors, patients, and caregivers",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <SyncStatusComponent />
          <OfflineIndicator />
          <Toaster />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
