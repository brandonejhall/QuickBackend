"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

// Navigation items for regular users
const userNavigation = [
  { name: "Dashboard", href: "/dashboard" },
]

// Navigation items for admins
const adminNavigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Project Notes", href: "/project-notes" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Use the appropriate navigation based on user role
  const navigation = user?.role === 'admin' ? adminNavigation : userNavigation

  return (
    <div className="flex h-full flex-col border-r bg-white">
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                pathname === item.href ? "bg-brims-blue/10 text-brims-blue" : "text-muted-foreground hover:bg-brims-blue/5"
              )}
            >
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center space-x-4">
          <div className="relative h-5 w-5 overflow-hidden ">
            <Image
              src="/logo-symbol.png"
              alt="User Avatar"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

