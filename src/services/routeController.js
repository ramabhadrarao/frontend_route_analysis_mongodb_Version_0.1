import { api } from './authService'

/**
 * Route Controller - REAL API ONLY VERSION
 * Handles all route-related API operations without any mock data fallbacks
 */
export class RouteController {
  constructor() {
    this.baseUrl = '/api/routes'
  }

  // ==================== BASIC ROUTE OPERATIONS ====================
  
  /**
   * Get all routes from real API only
   */
  async getAllRoutes(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`${this.baseUrl}?${queryString}`)
      
      console.log('RouteController: Real API getAllRoutes response:', response.data)
      
      // Return the actual API response without modification
      return response.data
    } catch (error) {
      console.error('RouteController: Real API getAllRoutes error:', error)
      throw this.handleError('Failed to fetch routes from API', error)
    }
  }

  /**
   * Get a single route by ID from real API only
   */
  async getRouteById(routeId) {
    try {
      console.log('RouteController: Fetching route from real API:', routeId)
      const response = await api.get(`${this.baseUrl}/${routeId}`)
      console.log('RouteController: Real API route response:', response.data)
      
      return response.data
    } catch (error) {
      console.error('RouteController: Real API route fetch error:', error)
      throw this.handleError(`Failed to fetch route ${routeId} from API`, error)
    }
  }

  // ==================== DATA FETCHING FROM REAL APIs ====================

  /**
   * Get GPS points from real API
   */
  async getGPSPoints(routeId) {
    try {
      console.log('RouteController: Fetching GPS points from real API:', routeId)
      const response = await api.get(`${this.baseUrl}/${routeId}/gps-points`)
      console.log('RouteController: Real API GPS points response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API GPS points error:', error.message)
      throw this.handleError(`Failed to fetch GPS points for route ${routeId}`, error)
    }
  }

  /**
   * Get emergency services from real API
   */
  async getEmergencyServices(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching emergency services from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/emergency-services?${queryString}` : 
        `${this.baseUrl}/${routeId}/emergency-services`
      
      const response = await api.get(url)
      console.log('RouteController: Real API emergency services response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API emergency services error:', error.message)
      throw this.handleError(`Failed to fetch emergency services for route ${routeId}`, error)
    }
  }

  /**
   * Get weather data from real API
   */
  async getWeatherData(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching weather data from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/weather-data?${queryString}` : 
        `${this.baseUrl}/${routeId}/weather-data`
      
      const response = await api.get(url)
      console.log('RouteController: Real API weather data response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API weather data error:', error.message)
      throw this.handleError(`Failed to fetch weather data for route ${routeId}`, error)
    }
  }

  /**
   * Get traffic data from real API
   */
  async getTrafficData(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching traffic data from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/traffic-data?${queryString}` : 
        `${this.baseUrl}/${routeId}/traffic-data`
      
      const response = await api.get(url)
      console.log('RouteController: Real API traffic data response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API traffic data error:', error.message)
      throw this.handleError(`Failed to fetch traffic data for route ${routeId}`, error)
    }
  }

  /**
   * Get accident areas from real API
   */
  async getAccidentAreas(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching accident areas from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/accident-areas?${queryString}` : 
        `${this.baseUrl}/${routeId}/accident-areas`
      
      const response = await api.get(url)
      console.log('RouteController: Real API accident areas response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API accident areas error:', error.message)
      throw this.handleError(`Failed to fetch accident areas for route ${routeId}`, error)
    }
  }

  /**
   * Get road conditions from real API
   */
  async getRoadConditions(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching road conditions from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `${this.baseUrl}/${routeId}/road-conditions?${queryString}` : 
        `${this.baseUrl}/${routeId}/road-conditions`
      
      const response = await api.get(url)
      console.log('RouteController: Real API road conditions response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API road conditions error:', error.message)
      throw this.handleError(`Failed to fetch road conditions for route ${routeId}`, error)
    }
  }

  /**
   * Get sharp turns from real API
   */
  async getSharpTurns(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching sharp turns from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `/api/visibility/routes/${routeId}/sharp-turns?${queryString}` : 
        `/api/visibility/routes/${routeId}/sharp-turns`
      
      const response = await api.get(url)
      console.log('RouteController: Real API sharp turns response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API sharp turns error:', error.message)
      throw this.handleError(`Failed to fetch sharp turns for route ${routeId}`, error)
    }
  }

  /**
   * Get blind spots from real API
   */
  async getBlindSpots(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching blind spots from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `/api/visibility/routes/${routeId}/blind-spots?${queryString}` : 
        `/api/visibility/routes/${routeId}/blind-spots`
      
      const response = await api.get(url)
      console.log('RouteController: Real API blind spots response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API blind spots error:', error.message)
      throw this.handleError(`Failed to fetch blind spots for route ${routeId}`, error)
    }
  }

  /**
   * Get network coverage from real API
   */
  async getNetworkCoverage(routeId, filters = {}) {
    try {
      console.log('RouteController: Fetching network coverage from real API:', routeId)
      const queryString = new URLSearchParams(filters).toString()
      const url = queryString ? 
        `/api/network-coverage/routes/${routeId}/overview?${queryString}` : 
        `/api/network-coverage/routes/${routeId}/overview`
      
      const response = await api.get(url)
      console.log('RouteController: Real API network coverage response:', response.data)
      return response.data
    } catch (error) {
      console.error('RouteController: Real API network coverage error:', error.message)
      throw this.handleError(`Failed to fetch network coverage for route ${routeId}`, error)
    }
  }

  // ==================== COMPREHENSIVE DATA FETCHING FROM REAL APIs ONLY ====================

  /**
   * Get all route-related data from real APIs only - NO FALLBACKS
   */
  async getAllRouteData(routeId, options = {}) {
    try {
      console.log('RouteController: Getting comprehensive route data from REAL APIs only for:', routeId)
      
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

      // Start with basic route info from real API
      console.log('RouteController: Fetching basic route info from real API...')
      const routeData = await this.getRouteById(routeId)
      
      if (!routeData) {
        throw new Error('Route not found in API')
      }

      // Prepare parallel data fetching from real APIs
      const dataPromises = []
      const dataKeys = []

      // Add data collection promises based on options
      if (includeGPS) {
        dataPromises.push(this.getGPSPoints(routeId))
        dataKeys.push('gpsPoints')
      }

      if (includeEmergencyServices) {
        dataPromises.push(this.getEmergencyServices(routeId, filters.emergencyServices))
        dataKeys.push('emergencyServices')
      }

      if (includeWeather) {
        dataPromises.push(this.getWeatherData(routeId, filters.weather))
        dataKeys.push('weatherData')
      }

      if (includeTraffic) {
        dataPromises.push(this.getTrafficData(routeId, filters.traffic))
        dataKeys.push('trafficData')
      }

      if (includeAccidentAreas) {
        dataPromises.push(this.getAccidentAreas(routeId, filters.accidentAreas))
        dataKeys.push('accidentAreas')
      }

      if (includeRoadConditions) {
        dataPromises.push(this.getRoadConditions(routeId, filters.roadConditions))
        dataKeys.push('roadConditions')
      }

      if (includeSharpTurns) {
        dataPromises.push(this.getSharpTurns(routeId, filters.sharpTurns))
        dataKeys.push('sharpTurns')
      }

      if (includeBlindSpots) {
        dataPromises.push(this.getBlindSpots(routeId, filters.blindSpots))
        dataKeys.push('blindSpots')
      }

      if (includeNetworkCoverage) {
        dataPromises.push(this.getNetworkCoverage(routeId, filters.networkCoverage))
        dataKeys.push('networkCoverage')
      }

      // Execute all real API promises
      console.log('RouteController: Executing', dataPromises.length, 'real API calls...')
      const results = await Promise.allSettled(dataPromises)
      
      // Process results from real APIs only
      const data = {
        route: routeData
      }
      const errors = []

      results.forEach((result, index) => {
        const key = dataKeys[index]
        
        if (result.status === 'fulfilled') {
          const responseData = result.value
          
          // Extract the actual data array from real API response
          data[key] = this.extractDataArray(responseData)
          console.log(`RouteController: ${key} from real API - Success:`, data[key].length, 'items')
        } else {
          console.error(`RouteController: ${key} real API call failed:`, result.reason.message)
          // NO FALLBACKS - let the error bubble up or set empty array
          data[key] = []
          errors.push({ key, error: result.reason.message })
        }
      })

      console.log('RouteController: Real API data collection completed:', {
        route: !!data.route,
        dataKeys: Object.keys(data).filter(k => k !== 'route'),
        errorCount: errors.length
      })

      return {
        success: true,
        data,
        errors: errors.length > 0 ? errors : null,
        timestamp: new Date().toISOString(),
        source: 'REAL_API_ONLY'
      }

    } catch (error) {
      console.error('RouteController: Real API comprehensive data fetch failed:', error)
      throw this.handleError(`Failed to fetch comprehensive data from real API for route ${routeId}`, error)
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract data array from real API response
   */
  extractDataArray(data) {
    if (!data) return []
    
    // If it's already an array
    if (Array.isArray(data)) return data
    
    // Try to extract array from real API response patterns
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.results && Array.isArray(data.results)) return data.results
    if (data.items && Array.isArray(data.items)) return data.items
    if (data.services && Array.isArray(data.services)) return data.services
    if (data.conditions && Array.isArray(data.conditions)) return data.conditions
    if (data.areas && Array.isArray(data.areas)) return data.areas
    if (data.turns && Array.isArray(data.turns)) return data.turns
    if (data.spots && Array.isArray(data.spots)) return data.spots
    if (data.points && Array.isArray(data.points)) return data.points
    if (data.coverage && Array.isArray(data.coverage)) return data.coverage
    
    // If it's a single object from API, wrap it in an array
    if (typeof data === 'object' && data !== null) {
      return [data]
    }
    
    return []
  }

  /**
   * Handle and format errors consistently
   */
  handleError(message, error) {
    console.error(`RouteController Error: ${message}`, {
      originalError: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    })
    
    const formattedError = new Error(message)
    formattedError.originalError = error
    formattedError.status = error.response?.status
    formattedError.data = error.response?.data
    formattedError.isAPIError = true
    
    return formattedError
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new route via real API
   */
  async createRoute(routeData) {
    try {
      const response = await api.post(this.baseUrl, routeData)
      return response.data
    } catch (error) {
      throw this.handleError('Failed to create route via API', error)
    }
  }

  /**
   * Update an existing route via real API
   */
  async updateRoute(routeId, routeData) {
    try {
      const response = await api.put(`${this.baseUrl}/${routeId}`, routeData)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to update route ${routeId} via API`, error)
    }
  }

  /**
   * Delete a route via real API
   */
  async deleteRoute(routeId) {
    try {
      const response = await api.delete(`${this.baseUrl}/${routeId}`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to delete route ${routeId} via API`, error)
    }
  }

  /**
   * Upload GPS route via real API
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
      throw this.handleError('Failed to upload GPS route via API', error)
    }
  }

  /**
   * Collect all data for a route via real API
   */
  async collectAllRouteData(routeId) {
    try {
      const response = await api.post(`${this.baseUrl}/${routeId}/collect-all-data`)
      return response.data
    } catch (error) {
      throw this.handleError(`Failed to collect all data for route ${routeId} via API`, error)
    }
  }
}

// Export singleton instance
export const routeController = new RouteController()

// Export class for custom instances if needed
export default RouteController