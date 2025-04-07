"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth-context'
import api from "@/lib/api"

interface Document {
  id: string
  name: string
  userId: string
  uploadedBy: string
  uploadedAt: string
  type: string
}

interface DocumentUpload {
  name: string
  type: string
  size: number
  file: File
}

interface PaginationInfo {
  total: number
  page: number
  per_page: number
  total_pages: number
}

interface DocumentContextType {
  documents: Document[]
  isLoading: boolean
  pagination: PaginationInfo
  currentPage: number
  addDocument: (document: Document) => void
  removeDocument: (id: string) => void
  uploadDocument: (document: DocumentUpload) => Promise<any>
  deleteDocument: (id: string) => Promise<void>
  downloadDocument: (filename: string, email: string) => Promise<void>
  loadMoreDocuments: (page: number) => Promise<void>
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    per_page: 5,
    total_pages: 1
  })
  const { user } = useAuth()

  const loadDocuments = async (page: number = 1) => {
    if (!user?.email) {
      setDocuments([])
      setPagination({ total: 0, page: 1, per_page: 5, total_pages: 1 })
      setCurrentPage(1)
      return
    }

    try {
      setIsLoading(true)
      const response = await api.get(`/documents/documents/${encodeURIComponent(user.email)}?page=${page}`)
      
      if (!response.data || !response.data.documents) {
        console.error('Invalid response format:', response.data)
        setDocuments([])
        setPagination({ total: 0, page: 1, per_page: 5, total_pages: 1 })
        return
      }

      const formattedDocuments = response.data.documents.map((doc: any) => ({
        id: doc.id?.toString() || Date.now().toString(),
        name: doc.filename,
        userId: doc.email,
        uploadedBy: doc.uploaded_by || user.email,
        uploadedAt: doc.created_at || new Date().toISOString(),
        type: doc.document_type || 'unknown'
      }))

      setDocuments(page === 1 ? formattedDocuments : [...documents, ...formattedDocuments])
      
      setPagination({
        total: response.data.total || 0,
        page: response.data.page || page,
        per_page: response.data.per_page || 5,
        total_pages: response.data.total_pages || 1
      })
      setCurrentPage(response.data.page || page)
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
      setPagination({ total: 0, page: 1, per_page: 5, total_pages: 1 })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.email) {
      loadDocuments(1)
    } else {
      setDocuments([])
      setPagination({ total: 0, page: 1, per_page: 5, total_pages: 1 })
      setCurrentPage(1)
      setIsLoading(false)
    }
  }, [user?.email])

  const loadMoreDocuments = async (page: number) => {
    if (!user?.email) return
    await loadDocuments(page)
  }

  const addDocument = (document: Document) => {
    if (!user?.email) return
    setDocuments(prev => [document, ...prev])
  }

  const removeDocument = (id: string) => {
    if (!user?.email) return
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const uploadDocument = async (document: DocumentUpload) => {
    if (!user?.email) {
      throw new Error('User must be logged in to upload documents')
    }

    try {
      const formData = new FormData()
      formData.append("file", document.file)
      
      const documentData = {
        filename: document.name,
        document_type: document.type,
        email: user.email
      }
      
      formData.append("document", JSON.stringify(documentData))

      const response = await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const newDocument = {
        id: response.data.id || Date.now().toString(),
        name: document.name,
        userId: user.email,
        uploadedBy: user.email,
        uploadedAt: new Date().toISOString(),
        type: document.type
      }

      setDocuments(prev => [newDocument, ...prev])
      return newDocument
    } catch (error) {
      console.error("Error uploading document:", error)
      throw error
    }
  }

  const deleteDocument = async (id: string) => {
    if (!user?.email) return
    try {
      await api.delete(`/documents/delete/${id}`)
      removeDocument(id)
    } catch (error) {
      console.error("Error deleting document:", error)
      throw error
    }
  }

  const downloadDocument = async (filename: string, email: string) => {
    if (!user?.email) return
    try {
      const response = await api.get(`/documents/download/${email}/${filename}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading document:", error)
      throw error
    }
  }

  const value = {
    documents,
    isLoading,
    pagination,
    currentPage,
    addDocument,
    removeDocument,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    loadMoreDocuments
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

