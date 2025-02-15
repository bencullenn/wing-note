import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EHR System",
  description: "Simple EHR system for patient management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="container mx-auto p-4">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary">EHR System</h1>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}

