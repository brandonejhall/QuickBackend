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
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    per_page: 5,
    total_pages: 1
  })
  const { user } = useAuth()

  const loadDocuments = async (page: number = 1) => {
    if (!user) {
      setDocuments([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await api.get(`/documents/documents/${encodeURIComponent(user.email)}?page=${page}`)
      
      const formattedDocuments = response.data.documents.map((doc: any) => ({
        id: doc.id?.toString() || Date.now().toString(),
        name: doc.filename,
        userId: doc.email,
        uploadedBy: doc.uploaded_by || user.email,
        uploadedAt: doc.created_at || new Date().toISOString(),
        type: doc.document_type || 'unknown'
      }))

      setDocuments(page === 1 ? formattedDocuments : [...documents, ...formattedDocuments])
      setPagination(response.data)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments(1)
  }, [user])

  const loadMoreDocuments = async (page: number) => {
    await loadDocuments(page)
  }

  const addDocument = (document: Document) => {
    setDocuments(prev => [document, ...prev])
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
        uploadedBy: user.email,
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
      await api.delete(`/documents/delete/${id}`)
      removeDocument(id)
    } catch (error) {
      console.error("Error deleting document:", error)
      throw error
    }
  }

  const downloadDocument = async (filename: string, email: string) => {
    try {
      const response = await api.get(`/documents/download/${email}/${filename}`, {
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      throw error;
    }
  };

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

