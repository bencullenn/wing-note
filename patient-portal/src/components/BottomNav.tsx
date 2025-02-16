"use client"

import Link from "next/link"
import { Home, User } from "lucide-react"
import { usePathname } from "next/navigation"

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-center gap-20 xs:gap-24 sm:gap-28 md:gap-32 items-center h-16">
        <Link
          href="/"
          className={`flex flex-col items-center space-y-1 px-4 py-2 ${
            pathname === "/"
              ? "text-purple-600 font-medium"
              : "text-gray-500"
          }`}
        >
          <Home className="w-6 h-6"
            strokeWidth={pathname === "/" ? 2.5 : 2}
            stroke={pathname === "/" ? "#9333EA" : "#6B7280"}
          />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          href="/profile"
          className={`flex flex-col items-center space-y-1 px-4 py-2 ${
            pathname === "/profile"
              ? "text-purple-600 font-medium"
              : "text-gray-500"
          }`}
        >
          <User className="w-6 h-6"
            strokeWidth={pathname === "/profile" ? 2.5 : 2}
            stroke={pathname === "/profile" ? "#9333EA" : "#6B7280"}
          />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  )
}

