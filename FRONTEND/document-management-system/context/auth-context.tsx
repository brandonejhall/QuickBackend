"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

type UserRole = "admin" | "user"

interface User {
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Test users for development environment
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin' as const
  },
  user: {
    email: 'user@test.com',
    password: 'user123',
    role: 'user' as const
  }
}

// Test documents for development environment
const TEST_DOCUMENTS = [
  {
    id: '1',
    name: 'Sample Contract.pdf',
    userId: 'admin@test.com',
    uploadedAt: new Date('2024-04-01').toISOString(),
    type: 'contract'
  },
  {
    id: '2',
    name: 'Property Deed.pdf',
    userId: 'user@test.com',
    uploadedAt: new Date('2024-04-02').toISOString(),
    type: 'deed'
  },
  {
    id: '3',
    name: 'Lease Agreement.pdf',
    userId: 'admin@test.com',
    uploadedAt: new Date('2024-04-03').toISOString(),
    type: 'lease'
  },
  {
    id: '4',
    name: 'Insurance Policy.pdf',
    userId: 'user@test.com',
    uploadedAt: new Date('2024-04-04').toISOString(),
    type: 'insurance'
  },
  {
    id: '5',
    name: 'Property Survey.pdf',
    userId: 'admin@test.com',
    uploadedAt: new Date('2024-04-05').toISOString(),
    type: 'survey'
  }
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only run this effect once
    if (isInitialized) return

    console.log('Initializing auth state')
    // Check for existing auth state
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedDocuments = localStorage.getItem('documents')

    if (storedToken && storedUser) {
      console.log('Found stored auth state')
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      
      // Initialize documents if not present
      if (!storedDocuments) {
        console.log('Initializing empty documents array')
        localStorage.setItem('documents', JSON.stringify([]))
      }
    }
    setIsInitialized(true)
    setIsLoading(false)
  }, [isInitialized])

  const login = async (email: string, password: string) => {
    try {
      // Prevent multiple login attempts
      if (isLoading) return
      setIsLoading(true)

      console.log('Attempting login with:', { email })
      
      // Check if user is already logged in
      if (token) {
        console.log('User already logged in, logging out first')
        await logout()
      }

      // Check for test users in development
      if (process.env.NODE_ENV === 'development') {
        if (email === 'admin@test.com' && password === 'admin123') {
          console.log('Logging in as test admin')
          const mockToken = 'mock-admin-token'
          localStorage.setItem('token', mockToken)
          setToken(mockToken)
          setUser({ email, role: 'admin' as UserRole })
          // Initialize empty documents array for test admin
          localStorage.setItem('documents', JSON.stringify([]))
          setIsLoading(false)
          router.push('/dashboard')
          return
        } else if (email === 'user@test.com' && password === 'user123') {
          console.log('Logging in as test user')
          const mockToken = 'mock-user-token'
          localStorage.setItem('token', mockToken)
          setToken(mockToken)
          setUser({ email, role: 'user' as UserRole })
          // Initialize empty documents array for test user
          localStorage.setItem('documents', JSON.stringify([]))
          setIsLoading(false)
          router.push('/dashboard')
          return
        }
      }

      // Normal API login for production
      console.log('Attempting API login')
      const response = await authApi.login({ email, password })
      console.log('Login response:', response)
      
      if (!response.role) {
        throw new Error('No role received from server')
      }
      
      const userData = { email, role: response.role as UserRole }
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(response.access_token)
      setUser(userData)
      // Initialize empty documents array for new user
      localStorage.setItem('documents', JSON.stringify([]))
      setIsLoading(false)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('Logging out user')
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('documents')
      
      // Reset state
      setToken(null)
      setUser(null)
      
      // Navigate to login page
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    isLoading: isLoading || !isInitialized
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

