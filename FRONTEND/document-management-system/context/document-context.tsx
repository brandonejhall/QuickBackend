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
      if (!user) {
        setDocuments([])
        setIsLoading(false)
        return
      }

      try {
        // Fetch documents from API
        console.log('Fetching documents for user:', user.email)
        const response = await api.get(`/documents/documents/${encodeURIComponent(user.email)}`)
        console.log('Documents response:', response.data)
        
        const formattedDocuments = response.data.map((doc: any) => ({
          id: doc.id?.toString() || Date.now().toString(),
          name: doc.filename,
          userId: user.email,
          uploadedAt: doc.created_at || new Date().toISOString(),
          type: doc.document_type || 'unknown'
        }))

        setDocuments(formattedDocuments)
      } catch (error) {
        console.error('Error loading documents:', error)
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [user])

  const addDocument = (document: Document) => {
    setDocuments(prev => [...prev, document])
  }

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const uploadDocument = async (document: DocumentUpload) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to upload documents')
      }

      const formData = new FormData()
      formData.append("file", document.file)
      
      // Create document data object
      const documentData = {
        filename: document.name,
        document_type: document.type,
        email: user.email
      }
      
      // Append document data as JSON string
      formData.append("document", JSON.stringify(documentData))

      console.log('Uploading document:', {
        filename: document.name,
        type: document.type,
        email: user.email
      })

      const response = await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      console.log('Upload response:', response.data)

      // Add the new document to the list
      const newDocument = {
        id: response.data.id || Date.now().toString(),
        name: document.name,
        userId: user.email,
        uploadedAt: new Date().toISOString(),
        type: document.type
      }

      setDocuments(prev => {
        const newDocuments = [newDocument, ...prev]
        localStorage.setItem('documents', JSON.stringify(newDocuments))
        return newDocuments
      })

      return newDocument
    } catch (error) {
      console.error("Error uploading document:", error)
      throw error
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`)
      setDocuments(prev => {
        const newDocuments = prev.filter(doc => doc.id !== id)
        localStorage.setItem('documents', JSON.stringify(newDocuments))
        return newDocuments
      })
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

