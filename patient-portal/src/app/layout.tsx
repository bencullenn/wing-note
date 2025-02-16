import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Patient Portal',
  description: 'A portal for patients to view their medical information',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`} suppressHydrationWarning={true}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-purple-100">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-purple-600">Wingnote</span> Patient Portal
              </h1>
              <p className="mt-1 text-sm text-gray-500">Your Health Information at Your Fingertips</p>
            </div>
          </header>
          
          <main className="flex-1 pb-20">
            <div className="max-w-2xl mx-auto px-4">{children}</div>
          </main>
          
          <BottomNav />
        </div>
      </body>
    </html>
  )
}

