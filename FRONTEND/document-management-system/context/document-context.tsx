"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth-context'
import api from "@/lib/api"

interface Document {
  id: string
  name: string
  userId: string
  uploadedAt: string
  type: string
}

interface DocumentUpload {
  name: string
  type: string
  size: number
  file: File
}

interface DocumentContextType {
  documents: Document[]
  isLoading: boolean
  addDocument: (document: Document) => void
  removeDocument: (id: string) => void
  uploadDocument: (document: DocumentUpload) => Promise<any>
  deleteDocument: (id: string) => Promise<void>
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        // Try to get documents from localStorage first (for development)
        const storedDocuments = localStorage.getItem('documents')
        if (storedDocuments) {
          setDocuments(JSON.parse(storedDocuments))
          setIsLoading(false)
          return
        }

        // If no stored documents and API URL exists, fetch from API
        if (process.env.NEXT_PUBLIC_API_URL) {
          // TODO: Implement API call when backend is ready
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`)
          const data = await response.json()
          setDocuments(data)
        }
      } catch (error) {
        console.error('Error loading documents:', error)
        // Set empty array if both localStorage and API fail
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [user])

  const addDocument = (document: Document) => {
    setDocuments(prev => {
      const newDocuments = [...prev, document]
      // Update localStorage in development
      localStorage.setItem('documents', JSON.stringify(newDocuments))
      return newDocuments
    })
  }

  const removeDocument = (id: string) => {
    setDocuments(prev => {
      const newDocuments = prev.filter(doc => doc.id !== id)
      // Update localStorage in development
      localStorage.setItem('documents', JSON.stringify(newDocuments))
      return newDocuments
    })
  }

  const uploadDocument = async (document: DocumentUpload) => {
    try {
      const formData = new FormData()
      formData.append("file", document.file)
      formData.append("name", document.name)

      const response = await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setDocuments((prev) => [response.data, ...prev])
      return response.data
    } catch (error) {
      console.error("Error uploading document:", error)
      throw error
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`)
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (error) {
      console.error("Error deleting document:", error)
      throw error
    }
  }

  const value = {
    documents,
    isLoading,
    addDocument,
    removeDocument,
    uploadDocument,
    deleteDocument
  }

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider')
  }
  return context
}

