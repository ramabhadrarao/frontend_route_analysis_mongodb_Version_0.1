import { api } from './authService'

/**
 * Route Controller - Handles all route-related API operations
 * Centralizes route data fetching from all models for better organization
 */
export class RouteController {
  constructor() {
    this.baseUrl = '/api/routes'
  }

  // ==================== BASIC ROUTE OPERATIONS ====================
  
  /**
   * Get all routes with optional filtering and pagination
   * @param {Object} params - Query parameters (page, limit, search, riskLevel, etc.)
   * @returns {Promise<Object>} Routes data with pagination info
   */
  async getAllRoutes(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`${this.baseUrl}?${queryString}`)
      return response.data
    } catch (error) {
      throw this.handleError('Failed to fetch routes', error)
    }
  }

  /**
   * Get a single route by ID
   * @param {string} routeId - Route ID (_id or routeId)
   * @returns {Promise<Object>} Route data
   */
  async getRouteById(routeId) {
    try {
      console.log('RouteController: Fetching route by ID:', routeId)
      const response = await api.get(`${this.baseUrl}/${routeId}`)
      console.log('RouteController: Route response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Error fetching route:', error)
      throw this.handleError(`Failed to fetch route ${routeId}`, error)
    }
  }

  /**
   * Create a new route
   * @param {Object} routeData - Route information
   * @returns {Promise<Object>} Created route data
   */
  async createRoute(routeData) {
    try {
      const response = await api.post(this.baseUrl, routeData)
      return response.data
    } catch (error) {
      throw this.handleError('Failed to create route', error)
    }
  }

  /**
   * Update an existing route
   * @param {string} routeId - Route ID
   * @param {Object} routeData - Updated route information
   * @returns {Promise<Object>} Updated route data
   */
  async updateRoute(routeId, routeData) {
    try {
      const response = await api.put(`${this.baseUrl}/${routeId}`, routeData)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to update route ${routeId}`, error)
    }
  }

  /**
   * Delete a route (soft delete)
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteRoute(routeId) {
    try {
      const response = await api.delete(`${this.baseUrl}/${routeId}`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to delete route ${routeId}`, error)
    }
  }

  // ==================== GPS AND ROUTE DATA ====================

  /**
   * Upload GPS route from CSV file
   * @param {FormData} formData - Form data containing CSV file
   * @returns {Promise<Object>} Upload result
   */
  async uploadGPSRoute(formData) {
    try {
      const response = await api.post(`${this.baseUrl}/upload-gps-route`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw this.handleError('Failed to upload GPS route', error)
    }
  }

  /**
   * Get GPS points for a route
   * @param {string} routeId - Route ID
   * @returns {Promise<Array>} GPS points array
   */
  async getGPSPoints(routeId) {
    try {
      const response = await api.get(`${this.baseUrl}/${routeId}/gps-points`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch GPS points for route ${routeId}`, error)
    }
  }

  /**
   * Collect all data for a route (comprehensive data collection)
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Collection result
   */
  async collectAllRouteData(routeId) {
    try {
      const response = await api.post(`${this.baseUrl}/${routeId}/collect-all-data`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to collect all data for route ${routeId}`, error)
    }
  }

  // ==================== SAFETY AND HAZARD DATA ====================

  /**
   * Get emergency services along the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (type, distance, etc.)
   * @returns {Promise<Array>} Emergency services data
   */
  async getEmergencyServices(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/emergency-services?${queryString}` : 
        `${this.baseUrl}/${routeId}/emergency-services`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch emergency services for route ${routeId}`, error)
    }
  }

  /**
   * Get accident-prone areas along the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (severity, type, etc.)
   * @returns {Promise<Array>} Accident areas data
   */
  async getAccidentAreas(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/accident-areas?${queryString}` : 
        `${this.baseUrl}/${routeId}/accident-areas`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch accident areas for route ${routeId}`, error)
    }
  }

  /**
   * Get sharp turns along the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (severity, angle, etc.)
   * @returns {Promise<Array>} Sharp turns data
   */
  async getSharpTurns(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `/api/visibility/routes/${routeId}/sharp-turns?${queryString}` : 
        `/api/visibility/routes/${routeId}/sharp-turns`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch sharp turns for route ${routeId}`, error)
    }
  }

  /**
   * Get blind spots along the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (severity, type, etc.)
   * @returns {Promise<Array>} Blind spots data
   */
  async getBlindSpots(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `/api/visibility/routes/${routeId}/blind-spots?${queryString}` : 
        `/api/visibility/routes/${routeId}/blind-spots`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch blind spots for route ${routeId}`, error)
    }
  }

  // ==================== ENVIRONMENTAL DATA ====================

  /**
   * Get weather data for the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (date, type, etc.)
   * @returns {Promise<Array>} Weather data
   */
  async getWeatherData(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/weather-data?${queryString}` : 
        `${this.baseUrl}/${routeId}/weather-data`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch weather data for route ${routeId}`, error)
    }
  }

  /**
   * Get traffic data for the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (time, severity, etc.)
   * @returns {Promise<Array>} Traffic data
   */
  async getTrafficData(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/traffic-data?${queryString}` : 
        `${this.baseUrl}/${routeId}/traffic-data`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch traffic data for route ${routeId}`, error)
    }
  }

  /**
   * Get road conditions for the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (type, severity, etc.)
   * @returns {Promise<Array>} Road conditions data
   */
  async getRoadConditions(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/road-conditions?${queryString}` : 
        `${this.baseUrl}/${routeId}/road-conditions`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch road conditions for route ${routeId}`, error)
    }
  }

  // ==================== NETWORK AND CONNECTIVITY ====================

  /**
   * Get network coverage data for the route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Optional filters (operator, signal strength, etc.)
   * @returns {Promise<Array>} Network coverage data
   */
  async getNetworkCoverage(routeId, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `/api/network-coverage/routes/${routeId}/overview?${queryString}` : 
        `/api/network-coverage/routes/${routeId}/overview`
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch network coverage for route ${routeId}`, error)
    }
  }

  /**
   * Get network dead zones for the route
   * @param {string} routeId - Route ID
   * @param {string} severity - Severity filter ('all', 'critical', 'moderate', 'low')
   * @returns {Promise<Array>} Dead zones data
   */
  async getNetworkDeadZones(routeId, severity = 'all') {
    try {
      const response = await api.get(`/api/network-coverage/routes/${routeId}/dead-zones?severity=${severity}`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to fetch network dead zones for route ${routeId}`, error)
    }
  }

  // ==================== COMPREHENSIVE DATA FETCHING ====================

  /**
   * Get all route-related data in parallel for comprehensive view
   * @param {string} routeId - Route ID
   * @param {Object} options - Options for data fetching
   * @returns {Promise<Object>} All route data organized by category
   */
  async getAllRouteData(routeId, options = {}) {
    try {
      console.log('RouteController: Getting all route data for route:', routeId)
      console.log('RouteController: Route ID type:', typeof routeId)
      console.log('RouteController: Options:', options)
      
      const {
        includeGPS = true,
        includeEmergencyServices = true,
        includeWeather = true,
        includeTraffic = true,
        includeAccidentAreas = true,
        includeRoadConditions = true,
        includeSharpTurns = true,
        includeBlindSpots = true,
        includeNetworkCoverage = true,
        filters = {}
      } = options

      const promises = []
      const dataKeys = []

      // Basic route info
      promises.push(this.getRouteById(routeId))
      dataKeys.push('route')

      // GPS data
      if (includeGPS) {
        promises.push(this.getGPSPoints(routeId))
        dataKeys.push('gpsPoints')
      }

      // Safety and hazard data
      if (includeEmergencyServices) {
        promises.push(this.getEmergencyServices(routeId, filters.emergencyServices))
        dataKeys.push('emergencyServices')
      }

      if (includeAccidentAreas) {
        promises.push(this.getAccidentAreas(routeId, filters.accidentAreas))
        dataKeys.push('accidentAreas')
      }

      if (includeSharpTurns) {
        promises.push(this.getSharpTurns(routeId, filters.sharpTurns))
        dataKeys.push('sharpTurns')
      }

      if (includeBlindSpots) {
        promises.push(this.getBlindSpots(routeId, filters.blindSpots))
        dataKeys.push('blindSpots')
      }

      // Environmental data
      if (includeWeather) {
        promises.push(this.getWeatherData(routeId, filters.weather))
        dataKeys.push('weatherData')
      }

      if (includeTraffic) {
        promises.push(this.getTrafficData(routeId, filters.traffic))
        dataKeys.push('trafficData')
      }

      if (includeRoadConditions) {
        promises.push(this.getRoadConditions(routeId, filters.roadConditions))
        dataKeys.push('roadConditions')
      }

      // Network data
      if (includeNetworkCoverage) {
        promises.push(this.getNetworkCoverage(routeId, filters.networkCoverage))
        dataKeys.push('networkCoverage')
      }

      // Execute all promises in parallel
      const results = await Promise.allSettled(promises)
      
      // Process results
      const data = {}
      const errors = []

      console.log('RouteController: Promise results:', results.map((r, i) => ({
        key: dataKeys[i],
        status: r.status,
        success: r.status === 'fulfilled' ? r.value?.success : false,
        dataLength: r.status === 'fulfilled' && r.value ? (Array.isArray(r.value) ? r.value.length : 'object') : 'no data'
      })))

      results.forEach((result, index) => {
        const key = dataKeys[index]
        if (result.status === 'fulfilled') {
          data[key] = result.value
          console.log(`RouteController: ${key} data:`, result.value)
        } else {
          console.error(`RouteController: ${key} failed:`, result.reason)
          errors.push({ key, error: result.reason })
          data[key] = null
        }
      })

      return {
        success: true,
        data,
        errors: errors.length > 0 ? errors : null,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw this.handleError(`Failed to fetch comprehensive data for route ${routeId}`, error)
    }
  }

  // ==================== ANALYSIS AND PROCESSING ====================

  /**
   * Analyze route visibility (sharp turns and blind spots)
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Visibility analysis result
   */
  async analyzeVisibility(routeId) {
    try {
      const response = await api.post(`/api/visibility/routes/${routeId}/analyze-sharp-turns`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to analyze visibility for route ${routeId}`, error)
    }
  }

  /**
   * Analyze network coverage for the route
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Network analysis result
   */
  async analyzeNetworkCoverage(routeId) {
    try {
      const response = await api.post(`/api/network-coverage/routes/${routeId}/analyze`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to analyze network coverage for route ${routeId}`, error)
    }
  }

  /**
   * Analyze enhanced road conditions
   * @param {string} routeId - Route ID
   * @param {boolean} forceRefresh - Force refresh of analysis
   * @returns {Promise<Object>} Road conditions analysis result
   */
  async analyzeRoadConditions(routeId, forceRefresh = false) {
    try {
      const response = await api.post(`/api/enhanced-road-conditions/routes/${routeId}/analyze`, { forceRefresh })
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to analyze road conditions for route ${routeId}`, error)
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Handle and format errors consistently
   * @param {string} message - Error message
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleError(message, error) {
    console.error(`RouteController Error: ${message}`, error)
    
    const formattedError = new Error(message)
    formattedError.originalError = error
    formattedError.status = error.response?.status
    formattedError.data = error.response?.data
    
    return formattedError
  }

  /**
   * Process API response to ensure consistent array format
   * @param {*} data - API response data
   * @returns {Array} Processed data as array
   */
  processToArray(data) {
    if (!data) return []
    if (Array.isArray(data)) return data
    
    // Try to extract array from common response patterns
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.results && Array.isArray(data.results)) return data.results
    if (data.items && Array.isArray(data.items)) return data.items
    
    // If it's an object, wrap it in an array
    if (typeof data === 'object') return [data]
    
    return []
  }
}

// Export singleton instance
export const routeController = new RouteController()

// Export class for custom instances if needed
export default RouteController