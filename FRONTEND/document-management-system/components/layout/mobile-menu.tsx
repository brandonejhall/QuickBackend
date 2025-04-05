"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </Button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b bg-white p-4 shadow-md">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-center">
              <Image
                src="/logo-with-slogan.png"
                alt="BRIMS Logo"
                width={160}
                height={40}
                className="h-auto w-full max-w-[160px]"
                priority
                unoptimized
              />
            </div>
            {user ? (
              <>
                <div className="flex items-center space-x-4">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src="/founder.jpeg"
                      alt="User Avatar"
                      fill
                      className="object-cover"
                      priority
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={logout} className="w-full">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full bg-brims-blue hover:bg-brims-blue/90">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 