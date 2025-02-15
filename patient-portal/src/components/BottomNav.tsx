"use client"

import { Home, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-2xl mx-auto flex justify-around items-center h-16">
        <Link
          href="/"
          className={`flex flex-col items-center px-6 ${pathname === "/" ? "text-purple-600" : "text-gray-500"}`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href="/profile"
          className={`flex flex-col items-center px-6 ${pathname === "/profile" ? "text-purple-600" : "text-gray-500"}`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  )
}

