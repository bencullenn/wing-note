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
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-purple-100">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <h1 className="text-3xl font-bold text-gray-900">
                <span className="text-purple-600">Wingnote</span> EHR System
              </h1>
              <p className="mt-1 text-sm text-gray-500">Electronic Health Records Management</p>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}

