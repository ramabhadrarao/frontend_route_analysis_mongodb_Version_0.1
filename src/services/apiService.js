import { api } from './authService'
import { config } from '../config/config'

export const apiService = {
  // Authentication APIs
  auth: {
    async login(credentials) {
      const response = await api.post('/api/auth/login', credentials)
      return response.data
    },

    async register(userData) {
      const response = await api.post('/api/auth/register', userData)
      return response.data
    },

    async logout() {
      const response = await api.post('/api/auth/logout')
      return response.data
    },

    async getProfile() {
      const response = await api.get('/api/auth/profile')
      return response.data.user
    }
  },

  // Dashboard APIs
  dashboard: {
    async getOverview() {
      const response = await api.get('/api/dashboard/overview')
      return response.data
    },

    async getStatistics(timeframe = '30d') {
      const response = await api.get(`/api/dashboard/statistics?timeframe=${timeframe}`)
      return response.data
    },

    async getAlerts(priority = 'all') {
      const response = await api.get(`/api/dashboard/alerts?priority=${priority}`)
      return response.data
    }
  },

  // Routes APIs
  routes: {
    async getAll(params = {}) {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/api/routes?${queryString}`)
      return response.data
    },

    async getById(routeId) {
      const response = await api.get(`/api/routes/${routeId}`)
      return response.data
    },

    async create(routeData) {
      const response = await api.post('/api/routes', routeData)
      return response.data
    },

    async update(routeId, routeData) {
      const response = await api.put(`/api/routes/${routeId}`, routeData)
      return response.data
    },

    async delete(routeId) {
      const response = await api.delete(`/api/routes/${routeId}`)
      return response.data
    },

    async uploadGPSRoute(formData) {
      const response = await api.post('/api/routes/upload-gps-route', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },

    async collectAllData(routeId) {
      const response = await api.post(`/api/routes/${routeId}/collect-all-data`)
      return response.data
    },

    async getGPSPoints(routeId) {
      const response = await api.get(`/api/routes/${routeId}/gps-points`)
      return response.data
    },

    async getEmergencyServices(routeId) {
      const response = await api.get(`/api/routes/${routeId}/emergency-services`)
      return response.data
    },

    async getWeatherData(routeId) {
      const response = await api.get(`/api/routes/${routeId}/weather-data`)
      return response.data
    },

    async getTrafficData(routeId) {
      const response = await api.get(`/api/routes/${routeId}/traffic-data`)
      return response.data
    },

    async getAccidentAreas(routeId) {
      const response = await api.get(`/api/routes/${routeId}/accident-areas`)
      return response.data
    },

    async getRoadConditions(routeId) {
      const response = await api.get(`/api/routes/${routeId}/road-conditions`)
      return response.data
    },

    async getSharpTurns(routeId) {
      const response = await api.get(`/api/routes/${routeId}/sharp-turns`)
      return response.data
    },

    async getBlindSpots(routeId) {
      const response = await api.get(`/api/routes/${routeId}/blind-spots`)
      return response.data
    },

    async analyzeVisibility(routeId) {
      const response = await api.post(`/api/routes/${routeId}/analyze-visibility`)
      return response.data
    }
  },

  // Bulk Processing APIs
  bulkProcessor: {
    async processCSV(formData) {
      const response = await api.post('/api/bulk-routes/process-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for bulk processing
      })
      return response.data
    },

    async processCSVEnhanced(formData) {
      const response = await api.post('/api/bulk-routes/process-csv-enhanced', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout for enhanced processing
      })
      return response.data
    },

    async enhanceExistingRoutes(routeIds, options = {}) {
      const response = await api.post('/api/bulk-routes/enhance-existing-routes', {
        routeIds,
        ...options
      })
      return response.data
    },

    async getStatus() {
      const response = await api.get('/api/bulk-routes/status')
      return response.data
    },

    async getResults(filename) {
      const response = await api.get(`/api/bulk-routes/results/${filename}`)
      return response.data
    }
  },

  // Risk Assessment APIs
  risk: {
    async calculateRisk(routeId) {
      const response = await api.get(`/api/risk/calculate/${routeId}`)
      return response.data
    },

    async recalculateRisk(routeId, forceRefresh = false) {
      const response = await api.post(`/api/risk/recalculate/${routeId}`, { forceRefresh })
      return response.data
    },

    async getRiskHistory(routeId) {
      const response = await api.get(`/api/risk/history/${routeId}`)
      return response.data
    },

    async batchCalculate(routeIds) {
      const response = await api.post('/api/risk/batch-calculate', { routeIds })
      return response.data
    },

    async getSummary() {
      const response = await api.get('/api/risk/summary')
      return response.data
    }
  },

  // Network Coverage APIs
  networkCoverage: {
    async analyzeRoute(routeId) {
      const response = await api.post(`/api/network-coverage/routes/${routeId}/analyze`)
      return response.data
    },

    async getOverview(routeId) {
      const response = await api.get(`/api/network-coverage/routes/${routeId}/overview`)
      return response.data
    },

    async getDeadZones(routeId, severity = 'all') {
      const response = await api.get(`/api/network-coverage/routes/${routeId}/dead-zones?severity=${severity}`)
      return response.data
    },

    async getCriticalDeadZones(routeId) {
      const response = await api.get(`/api/network-coverage/routes/${routeId}/critical-dead-zones`)
      return response.data
    },

    async getOperatorCoverage(routeId, operator) {
      const response = await api.get(`/api/network-coverage/routes/${routeId}/operator/${operator}`)
      return response.data
    },

    async getOperatorComparison(routeId) {
      const response = await api.get(`/api/network-coverage/routes/${routeId}/operator-comparison`)
      return response.data
    }
  },

  // Enhanced Road Conditions APIs
  enhancedRoadConditions: {
    async analyzeRoute(routeId, forceRefresh = false) {
      const response = await api.post(`/api/enhanced-road-conditions/routes/${routeId}/analyze`, { forceRefresh })
      return response.data
    },

    async getOverview(routeId) {
      const response = await api.get(`/api/enhanced-road-conditions/routes/${routeId}/overview`)
      return response.data
    },

    async getSegments(routeId, filters = {}) {
      const queryString = new URLSearchParams(filters).toString()
      const response = await api.get(`/api/enhanced-road-conditions/routes/${routeId}/segments?${queryString}`)
      return response.data
    },

    async getRiskAssessment(routeId) {
      const response = await api.get(`/api/enhanced-road-conditions/routes/${routeId}/risk-assessment`)
      return response.data
    },

    async getRecommendations(routeId, category = 'all') {
      const response = await api.get(`/api/enhanced-road-conditions/routes/${routeId}/recommendations?category=${category}`)
      return response.data
    },

    async compareRoutes(routeId, compareWith = 'user_routes') {
      const response = await api.get(`/api/enhanced-road-conditions/routes/${routeId}/compare?compareWith=${compareWith}`)
      return response.data
    }
  },

  // Visibility APIs (Sharp Turns & Blind Spots)
  visibility: {
    async analyzeRoute(routeId) {
      const response = await api.post(`/api/visibility/routes/${routeId}/analyze-sharp-turns`)
      return response.data
    },

    async getSharpTurns(routeId, filters = {}) {
      const queryString = new URLSearchParams(filters).toString()
      const response = await api.get(`/api/visibility/routes/${routeId}/sharp-turns?${queryString}`)
      return response.data
    },

    async getBlindSpots(routeId, filters = {}) {
      const queryString = new URLSearchParams(filters).toString()
      const response = await api.get(`/api/visibility/routes/${routeId}/blind-spots?${queryString}`)
      return response.data
    },

    async getVisibilityAnalysis(routeId) {
      const response = await api.get(`/api/visibility/routes/${routeId}/visibility-analysis`)
      return response.data
    },

    async getVisibilityStats(routeId) {
      const response = await api.get(`/api/visibility/routes/${routeId}/visibility-stats`)
      return response.data
    },

    async generateStreetViewImages(routeId, forceRegenerate = false) {
      const response = await api.post(`/api/visibility/routes/${routeId}/generate-street-view-images`, { forceRegenerate })
      return response.data
    }
  },

  // Report Generation APIs
  reports: {
    async generatePDF(routeId, options = {}) {
      const response = await api.post(`/api/pdf/routes/${routeId}/generate`, options, {
        responseType: 'blob'
      })
      return response
    },

    async getReportPreview(routeId) {
      const response = await api.get(`/api/pdf/routes/${routeId}/preview`)
      return response.data
    },

    async downloadReport(filename) {
      const response = await api.get(`/api/pdf/download/${filename}`, {
        responseType: 'blob'
      })
      return response
    }
  }
}