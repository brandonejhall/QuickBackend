"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  email: string
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
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
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Initialize auth state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      }
      setIsInitialized(true)
    }
  }, [])

  const logout = async () => {
    try {
      // Clear localStorage first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('documents')
      }
      
      // Clear axios headers
      delete axios.defaults.headers.common['Authorization']
      
      // Reset state
      setToken(null)
      setUser(null)
      
      // Wait for state to be cleared
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // Navigate to login
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Check for test users
      const testUser = Object.values(TEST_USERS).find(
        user => user.email === email && user.password === password
      )

      if (testUser) {
        // Create mock token
        const mockToken = 'test-token-' + testUser.role
        
        // Set localStorage first
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', mockToken)
          localStorage.setItem('user', JSON.stringify({ email: testUser.email, role: testUser.role }))
          localStorage.setItem('documents', JSON.stringify(TEST_DOCUMENTS))
        }
        
        // Set axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`
        
        // Update state
        setToken(mockToken)
        setUser({ email: testUser.email, role: testUser.role })
        
        // Wait for state to be updated
        await new Promise(resolve => setTimeout(resolve, 0))
        
        // Navigate to dashboard
        router.push('/dashboard')
        return
      }

      // Handle API login if needed
      if (process.env.NEXT_PUBLIC_API_URL) {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
          email,
          password,
        })

        const { access_token, role } = response.data
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', access_token)
          localStorage.setItem('user', JSON.stringify({ email, role }))
        }
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        
        setToken(access_token)
        setUser({ email, role })
        
        await new Promise(resolve => setTimeout(resolve, 0))
        
        router.push('/dashboard')
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
  }

  if (!isInitialized) {
    return null
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

