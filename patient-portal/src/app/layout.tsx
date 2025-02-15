import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import BottomNav from "@/components/BottomNav"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Patient App",
  description: "A simple and intuitive patient app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}>
        <main className="flex-grow overflow-auto pb-20">
          <div className="max-w-2xl mx-auto px-4">{children}</div>
        </main>
        <BottomNav />
      </body>
    </html>
  )
}

