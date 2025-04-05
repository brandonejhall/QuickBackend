"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <img
              src="/logo-with-slogan.png"
              alt="BRIMS Logo"
              width={160}
              height={40}
              className="h-auto w-full max-w-[160px]"
            />
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-brims-blue hover:bg-brims-blue/90">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

