import { routeController } from './routeController'
import { apiService } from './apiService'

/**
 * Route Service - REAL API ONLY VERSION
 * Provides high-level route management using only real API data
 */
export class RouteService {
  constructor() {
    this.controller = routeController
  }

  // ==================== REAL API ROUTE MANAGEMENT ====================

  /**
   * Get routes from real API only - no mock data
   */
  async getRoutes(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      riskLevel = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeStats = false // Disabled to avoid unnecessary API calls
    } = options

    try {
      console.log('RouteService: Getting routes from REAL API with options:', options)
      
      const params = {
        page,
        limit,
        search,
        riskLevel,
        sortBy,
        sortOrder
      }

      const result = await this.controller.getAllRoutes(params)
      console.log('RouteService: Real API controller result:', result)
      
      // Process the real API result
      let processedResult = {
        success: true,
        data: {
          routes: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalRoutes: 0,
            totalPages: 0
          }
        }
      }

      if (result) {
        // Handle different real API response formats
        if (Array.isArray(result)) {
          // Direct array response from API
          processedResult.data.routes = result
          processedResult.data.pagination.totalRoutes = result.length
        } else if (result.routes && Array.isArray(result.routes)) {
          // Standard paginated response from API
          processedResult.data.routes = result.routes
          processedResult.data.pagination = {
            page: result.pagination?.page || page,
            limit: result.pagination?.limit || limit,
            totalRoutes: result.pagination?.totalRoutes || result.routes.length,
            totalPages: result.pagination?.totalPages || Math.ceil((result.pagination?.totalRoutes || result.routes.length) / limit)
          }
        } else if (result.data && Array.isArray(result.data)) {
          // Nested data response from API
          processedResult.data.routes = result.data
          processedResult.data.pagination.totalRoutes = result.data.length
        } else if (result.data && result.data.routes && Array.isArray(result.data.routes)) {
          // Double nested response from API
          processedResult.data.routes = result.data.routes
          processedResult.data.pagination = {
            page: result.data.pagination?.page || page,
            limit: result.data.pagination?.limit || limit,
            totalRoutes: result.data.pagination?.totalRoutes || result.data.routes.length,
            totalPages: result.data.pagination?.totalPages || Math.ceil((result.data.pagination?.totalRoutes || result.data.routes.length) / limit)
          }
        } else {
          // Single route or other format from API
          const routes = Array.isArray(result) ? result : [result]
          processedResult.data.routes = routes
          processedResult.data.pagination.totalRoutes = routes.length
        }
      }

      console.log('RouteService: Processed real API result:', {
        totalRoutes: processedResult.data.routes.length,
        pagination: processedResult.data.pagination
      })

      return processedResult
    } catch (error) {
      console.error('RouteService: Failed to get routes from real API:', error)
      throw this.handleServiceError('Failed to get routes from API', error)
    }
  }

  /**
   * Get detailed route information from real API only
   */
  async getRouteDetails(routeId, options = {}) {
    const defaultOptions = {
      includeGPS: true,
      includeEmergencyServices: true,
      includeWeather: true,
      includeTraffic: true,
      includeAccidentAreas: true,
      includeRoadConditions: true,
      includeSharpTurns: true,
      includeBlindSpots: true,
      includeNetworkCoverage: true,
      includeRiskAnalysis: false, // Disabled to avoid API issues
      ...options
    }

    try {
      console.log('RouteService: Getting route details from REAL API for ID:', routeId)
      console.log('RouteService: Options:', defaultOptions)
      
      // Validate route ID
      if (!routeId || routeId.trim() === '') {
        throw new Error('Route ID is required')
      }

      // Get comprehensive route data from real API only
      const result = await this.controller.getAllRouteData(routeId, defaultOptions)
      
      console.log('RouteService: Real API controller result success:', result?.success)
      console.log('RouteService: Available data keys from real API:', result?.data ? Object.keys(result.data) : 'no data')
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch route data from API')
      }

      // Validate that we have basic route information from API
      if (!result.data.route) {
        throw new Error('No route information found in API response')
      }

      // Process and validate data arrays from real API
      const processedData = {
        ...result.data,
        // Ensure all data arrays are properly formatted from API responses
        gpsPoints: this.processDataArray(result.data.gpsPoints),
        emergencyServices: this.processDataArray(result.data.emergencyServices),
        weatherData: this.processDataArray(result.data.weatherData),
        trafficData: this.processDataArray(result.data.trafficData),
        accidentAreas: this.processDataArray(result.data.accidentAreas),
        roadConditions: this.processDataArray(result.data.roadConditions),
        sharpTurns: this.processDataArray(result.data.sharpTurns),
        blindSpots: this.processDataArray(result.data.blindSpots),
        networkCoverage: this.processDataArray(result.data.networkCoverage)
      }

      // Calculate summary statistics from real API data
      const summary = this.calculateRouteSummary(processedData)

      const finalResult = {
        success: true,
        data: processedData,
        summary,
        errors: result.errors,
        timestamp: result.timestamp,
        source: 'REAL_API_ONLY'
      }

      console.log('RouteService: Final real API result summary:', {
        routeExists: !!finalResult.data.route,
        gpsPoints: finalResult.data.gpsPoints.length,
        emergencyServices: finalResult.data.emergencyServices.length,
        weatherData: finalResult.data.weatherData.length,
        trafficData: finalResult.data.trafficData.length,
        accidentAreas: finalResult.data.accidentAreas.length,
        roadConditions: finalResult.data.roadConditions.length,
        sharpTurns: finalResult.data.sharpTurns.length,
        blindSpots: finalResult.data.blindSpots.length,
        networkCoverage: finalResult.data.networkCoverage.length,
        errorCount: result.errors?.length || 0
      })

      return finalResult
    } catch (error) {
      console.error('RouteService: Failed to get route details from real API:', error)
      throw this.handleServiceError(`Failed to get route details from API for ${routeId}`, error)
    }
  }

  // ==================== DATA PROCESSING FROM REAL API ====================

  /**
   * Process data array from real API to ensure it's always an array
   */
  processDataArray(data) {
    if (!data) return []
    
    // If it's already an array from API, return as-is
    if (Array.isArray(data)) return data
    
    // If it's a real API response object with data property
    if (data.data && Array.isArray(data.data)) return data.data
    
    // If it's a single object from API, wrap in array
    if (typeof data === 'object' && data !== null) return [data]
    
    return []
  }

  /**
   * Calculate route summary statistics from real API data
   */
  calculateRouteSummary(data) {
    return {
      route: {
        id: data.route?._id || data.route?.routeId,
        name: data.route?.routeName,
        distance: data.route?.totalDistance,
        riskLevel: data.route?.riskLevel,
        riskScore: data.route?.riskScore || data.route?.riskScores?.totalWeightedScore
      },
      dataAvailability: {
        gpsPoints: data.gpsPoints.length,
        emergencyServices: data.emergencyServices.length,
        weatherData: data.weatherData.length,
        trafficData: data.trafficData.length,
        accidentAreas: data.accidentAreas.length,
        roadConditions: data.roadConditions.length,
        sharpTurns: data.sharpTurns.length,
        blindSpots: data.blindSpots.length,
        networkCoverage: data.networkCoverage.length
      },
      riskFactors: {
        sharpTurnsCount: data.sharpTurns.length,
        blindSpotsCount: data.blindSpots.length,
        accidentAreasCount: data.accidentAreas.length,
        networkDeadZones: data.networkCoverage.filter(nc => nc.isDeadZone).length,
        highRiskWeatherAreas: data.weatherData.filter(wd => wd.riskScore > 7).length,
        trafficCongestionAreas: data.trafficData.filter(td => 
          td.congestionLevel === 'heavy' || td.congestionLevel === 'severe').length
      }
    }
  }

  // ==================== ROUTE CRUD OPERATIONS VIA REAL API ====================

  /**
   * Create a new route via real API
   */
  async createRoute(routeData) {
    try {
      // Validate required fields
      this.validateRouteData(routeData)
      
      const result = await this.controller.createRoute(routeData)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      throw this.handleServiceError('Failed to create route via API', error)
    }
  }

  /**
   * Update route via real API
   */
  async updateRoute(routeId, updateData) {
    try {
      // Validate update data
      this.validateRouteUpdateData(updateData)
      
      const result = await this.controller.updateRoute(routeId, updateData)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      throw this.handleServiceError(`Failed to update route ${routeId} via API`, error)
    }
  }

  /**
   * Delete route via real API
   */
  async deleteRoute(routeId) {
    try {
      const result = await this.controller.deleteRoute(routeId)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      throw this.handleServiceError(`Failed to delete route ${routeId} via API`, error)
    }
  }

  // ==================== FILTERING AND SEARCH VIA REAL API ====================

  /**
   * Get filtered emergency services for a route from real API
   */
  async getFilteredEmergencyServices(routeId, filters = {}) {
    try {
      const result = await this.controller.getEmergencyServices(routeId, filters)
      return this.processDataArray(result)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered emergency services from API for route ${routeId}`, error)
    }
  }

  /**
   * Get filtered weather data for a route from real API
   */
  async getFilteredWeatherData(routeId, filters = {}) {
    try {
      const result = await this.controller.getWeatherData(routeId, filters)
      return this.processDataArray(result)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered weather data from API for route ${routeId}`, error)
    }
  }

  /**
   * Get filtered traffic data for a route from real API
   */
  async getFilteredTrafficData(routeId, filters = {}) {
    try {
      const result = await this.controller.getTrafficData(routeId, filters)
      return this.processDataArray(result)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered traffic data from API for route ${routeId}`, error)
    }
  }

  /**
   * Get filtered road conditions for a route from real API
   */
  async getFilteredRoadConditions(routeId, filters = {}) {
    try {
      const result = await this.controller.getRoadConditions(routeId, filters)
      return this.processDataArray(result)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered road conditions from API for route ${routeId}`, error)
    }
  }

  // ==================== BULK OPERATIONS VIA REAL API ====================

  /**
   * Process multiple routes from CSV via real API
   */
  async processBulkRoutes(formData, options = {}) {
    const { enhanced = false } = options
    
    try {
      if (enhanced) {
        return await apiService.bulkProcessor.processCSVEnhanced(formData)
      } else {
        return await apiService.bulkProcessor.processCSV(formData)
      }
    } catch (error) {
      throw this.handleServiceError('Failed to process bulk routes via API', error)
    }
  }

  /**
   * Generate report for a route via real API
   */
  async generateReport(routeId, format = 'pdf') {
    try {
      return await apiService.reports.generatePDF(routeId, { format })
    } catch (error) {
      throw this.handleServiceError(`Failed to generate report via API for route ${routeId}`, error)
    }
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validate route data before creation
   */
  validateRouteData(routeData) {
    const required = ['routeName', 'fromName', 'toName', 'fromCoordinates', 'toCoordinates']
    const missing = required.filter(field => {
      if (field === 'fromCoordinates' || field === 'toCoordinates') {
        const coords = routeData[field]
        return !coords || !coords.latitude || !coords.longitude
      }
      return !routeData[field]
    })
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }

    // Validate coordinates
    if (routeData.fromCoordinates) {
      this.validateCoordinates(routeData.fromCoordinates, 'from coordinates')
    }
    if (routeData.toCoordinates) {
      this.validateCoordinates(routeData.toCoordinates, 'to coordinates')
    }
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(coords, fieldName) {
    const { latitude, longitude } = coords
    
    if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude in ${fieldName}: ${latitude}`)
    }
    
    if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude in ${fieldName}: ${longitude}`)
    }
  }

  /**
   * Validate route update data
   */
  validateRouteUpdateData(updateData) {
    if (updateData.routeName && updateData.routeName.trim().length === 0) {
      throw new Error('Route name cannot be empty')
    }

    // Validate coordinates if provided
    if (updateData.fromCoordinates) {
      this.validateCoordinates(updateData.fromCoordinates, 'from coordinates')
    }
    if (updateData.toCoordinates) {
      this.validateCoordinates(updateData.toCoordinates, 'to coordinates')
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if route path has changed significantly
   */
  hasRoutePathChanged(currentRoute, updateData) {
    const pathFields = ['fromName', 'toName', 'fromAddress', 'toAddress', 'fromCoordinates', 'toCoordinates']
    return pathFields.some(field => {
      if (field === 'fromCoordinates' || field === 'toCoordinates') {
        const current = currentRoute[field]
        const updated = updateData[field]
        
        if (!current || !updated) return !!updated
        
        return Math.abs(current.latitude - updated.latitude) > 0.001 ||
               Math.abs(current.longitude - updated.longitude) > 0.001
      }
      
      return updateData[field] && updateData[field] !== currentRoute[field]
    })
  }

  /**
   * Format route data for display
   */
  formatRouteForDisplay(route) {
    return {
      ...route,
      formattedDistance: this.formatDistance(route.totalDistance),
      formattedDuration: this.formatDuration(route.estimatedDuration),
      riskLevel: route.riskLevel || this.calculateRiskLevelFromScore(route.riskScore || 0),
      processingStatus: this.getProcessingStatus(route),
      lastUpdated: route.updatedAt || route.createdAt
    }
  }

  /**
   * Calculate risk level from score
   */
  calculateRiskLevelFromScore(score) {
    if (score >= 8) return 'CRITICAL'
    if (score >= 6) return 'HIGH'
    if (score >= 4) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceKm) {
    if (!distanceKm || isNaN(distanceKm)) return '0 km'
    
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`
    }
    
    return `${distanceKm.toFixed(1)} km`
  }

  /**
   * Format duration for display
   */
  formatDuration(durationMinutes) {
    if (!durationMinutes || isNaN(durationMinutes)) return '0 min'
    
    if (durationMinutes < 60) {
      return `${Math.round(durationMinutes)} min`
    }
    
    const hours = Math.floor(durationMinutes / 60)
    const minutes = Math.round(durationMinutes % 60)
    return `${hours}h ${minutes}min`
  }

  /**
   * Get processing status from route data
   */
  getProcessingStatus(route) {
    if (!route.dataProcessingStatus) return 'pending'
    
    const statuses = Object.values(route.dataProcessingStatus)
    const completed = statuses.filter(status => status === true).length
    const total = statuses.length
    
    if (completed === total) return 'completed'
    if (completed > 0) return 'processing'
    return 'pending'
  }

  /**
   * Handle service-level errors
   */
  handleServiceError(message, error) {
    console.error(`RouteService Error: ${message}`, {
      originalError: error.message,
      stack: error.stack,
      service: 'RouteService',
      timestamp: new Date().toISOString(),
      isAPIError: error.isAPIError || false,
      apiStatus: error.status
    })
    
    const serviceError = new Error(message)
    serviceError.originalError = error
    serviceError.service = 'RouteService'
    serviceError.timestamp = new Date().toISOString()
    serviceError.isAPIError = error.isAPIError || false
    
    return serviceError
  }
}

// Export singleton instance
export const routeService = new RouteService()

// Export class for custom instances if needed
export default RouteService