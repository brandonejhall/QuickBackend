import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Document {
  filename: string
  document_type: string
  email: string
}

export interface DocumentResponse {
  filename: string
  document_type: string
  created_at: string
}

export const documentApi = {
  // Upload a document
  async uploadDocument(file: File, document: Document) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document', JSON.stringify(document))

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete a document
  async deleteDocument(email: string, filename: string) {
    const response = await axios.delete(`${API_URL}/delete/${email}/${filename}`)
    return response.data
  },

  // Get user documents
  async getUserDocuments(email: string): Promise<DocumentResponse[]> {
    const response = await axios.get(`${API_URL}/documents/${email}`)
    return response.data
  },
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // For MVP testing, we'll skip token handling
    // In production, we would get the token from localStorage or cookies
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token")
      window.location.href = "/"
    }
    return Promise.reject(error)
  },
)

export default api

