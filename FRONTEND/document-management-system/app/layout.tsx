import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { DocumentProvider } from "@/context/document-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Document Management System",
  description: "Manage your documents securely and efficiently",
  generator: 'v0.dev',
  icons: {
    icon: '/logo-symbol.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <DocumentProvider>
            {children}
            <Toaster />
          </DocumentProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import './globals.css'