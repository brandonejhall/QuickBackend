'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const LoginForm = dynamic(() => import('@/components/auth/login-form'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-white p-6 shadow-md">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-20 w-48 animate-pulse bg-gray-200" />
          <div className="h-8 w-48 animate-pulse bg-gray-200" />
          <div className="h-4 w-64 animate-pulse bg-gray-200" />
        </div>
      </div>
    </div>
  ),
})

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50" suppressHydrationWarning>
      <Suspense fallback={
        <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-white p-6 shadow-md">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="h-20 w-48 animate-pulse bg-gray-200" />
            <div className="h-8 w-48 animate-pulse bg-gray-200" />
            <div className="h-4 w-64 animate-pulse bg-gray-200" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
} 