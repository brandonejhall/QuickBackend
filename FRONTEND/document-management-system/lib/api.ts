import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
    const response = await axios.get(`${API_URL}/api/documents`)
    return response.data
  },

  // Upload a document
  async uploadDocument(file: File, document: Document) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document', JSON.stringify(document))

    const response = await axios.post(`${API_URL}/api/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete a document
  async deleteDocument(email: string, filename: string) {
    const response = await axios.delete(`${API_URL}/api/documents/delete/${email}/${filename}`)
    return response.data
  },

  // Get user documents
  async getUserDocuments(email: string): Promise<DocumentResponse[]> {
    const response = await axios.get(`${API_URL}/api/documents/documents/${email}`)
    return response.data
  },

  // Search users
  async searchUsers(query: string) {
    const response = await axios.get(`${API_URL}/api/documents/users/search/${query}`)
    return response.data
  },
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

