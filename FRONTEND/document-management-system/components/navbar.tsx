"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth-context"

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-800">
              Document Management
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {user?.email}
            </span>
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 