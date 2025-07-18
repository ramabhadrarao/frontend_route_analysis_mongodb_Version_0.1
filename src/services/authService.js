import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async logout() {
    try {
      const response = await api.post('/api/auth/logout')
      return response.data
    } catch (error) {
      throw error
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/api/auth/profile')
      return response.data.user
    } catch (error) {
      throw error
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/api/auth/profile', profileData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await api.put('/api/auth/change-password', passwordData)
      return response.data
    } catch (error) {
      throw error
    }
  }
}

export { api }