import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface Document {
  filename: string
  document_type: string
  email: string
}

export interface DocumentResponse {
  id: string
  filename: string
  document_type: string
  created_at: string
  uploaded_by: string
  email: string
}

export interface PaginatedDocumentResponse {
  documents: DocumentResponse[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface UserSignup {
  email: string
  fullname: string
  password: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  role: string
}

export interface ProjectNote {
  id: number
  title: string
  description: string
  file_id: string | null
  file_name: string | null
  file_type: string | null
  created_at: string
  updated_at: string
}

export const authApi = {
  // Sign up a new user
  async signup(userData: UserSignup): Promise<{ message: string }> {
    console.log('Attempting to signup with data:', userData)
    console.log('API URL:', `${API_URL}/api/auth/signup`)
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, userData)
      console.log('Signup response:', response.data)
      return response.data
    } catch (error) {
      console.error('Signup error:', error)
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        })
      }
      throw error
    }
  },

  // Login user
  async login(userData: UserLogin): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/login`, userData)
    return response.data
  },
}

export const documentApi = {
  // Get documents root
  async getDocumentsRoot() {
    const response = await api.get('/documents')
    return response.data
  },

  // Upload a document
  async uploadDocument(file: File, document: Document) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document', JSON.stringify(document))

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete a document
  async deleteDocument(documentId: string) {
    const response = await api.delete(`/documents/delete/${documentId}`)
    return response.data
  },

  // Get user documents
  async getUserDocuments(email: string, page: number = 1): Promise<PaginatedDocumentResponse> {
    const response = await api.get(`/documents/documents/${email}?page=${page}`)
    return response.data
  },

  // Search users
  async searchUsers(query: string) {
    const response = await api.get(`/documents/users/search/${query}`)
    return response.data
  },

  // Get recent uploads
  async getRecentUploads(limit: number = 10) {
    try {
      console.log('Fetching recent uploads...')
      const response = await api.get(`/documents/recent-uploads?limit=${limit}`)
      console.log('Recent uploads response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching recent uploads:', error)
      throw error
    }
  }
}

export const projectNotesApi = {
  // Get all project notes
  async getProjectNotes(): Promise<ProjectNote[]> {
    const response = await api.get('/project-notes')
    return response.data
  },

  // Create a new project note
  async createProjectNote(formData: FormData): Promise<ProjectNote> {
    const response = await api.post('/project-notes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete a project note
  async deleteProjectNote(noteId: number): Promise<void> {
    await api.delete(`/project-notes/${noteId}`)
  },

  // Update a project note
  async updateProjectNote(noteId: number, formData: FormData): Promise<ProjectNote> {
    const response = await api.put(`/project-notes/${noteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Download a file
  async downloadFile(noteId: number): Promise<Blob> {
    const response = await api.get(`/project-notes/${noteId}/download`, {
      responseType: 'blob',
    })
    return response.data
  }
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

