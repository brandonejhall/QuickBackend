'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  // Add debug logging
  console.log('Protected Route State:', {
    isAuthenticated,
    isAdmin,
    user,
    requireAdmin,
    isChecking
  })

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 50))
      
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login')
        router.push('/login')
      } else if (requireAdmin && !isAdmin) {
        console.log('Admin access required but user is not admin, redirecting to dashboard')
        router.push('/dashboard')
      }
      setIsChecking(false)
    }

    checkAuth()
  }, [isAuthenticated, isAdmin, router, requireAdmin])

  // Don't render anything while checking auth
  if (isChecking) {
    console.log('Still checking auth state')
    return null
  }

  // Only check for admin access if requireAdmin is true
  if (!isAuthenticated) {
    console.log('Not authenticated, not rendering')
    return null
  }

  if (requireAdmin && !isAdmin) {
    console.log('Admin access required but user is not admin, not rendering')
    return null
  }

  console.log('Rendering protected content')
  return <>{children}</>
} 