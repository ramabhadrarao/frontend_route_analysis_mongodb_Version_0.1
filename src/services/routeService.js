import { routeController } from './routeController'
import { apiService } from './apiService'

/**
 * Route Service - High-level route management and business logic
 * Provides abstracted methods for route operations and data management
 */
export class RouteService {
  constructor() {
    this.controller = routeController
  }

  // ==================== ROUTE MANAGEMENT ====================

  /**
   * Get routes with enhanced filtering and search capabilities
   * @param {Object} options - Search and filter options
   * @returns {Promise<Object>} Enhanced routes data
   */
  async getRoutes(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      riskLevel = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeStats = true
    } = options

    try {
      const params = {
        page,
        limit,
        search,
        riskLevel,
        sortBy,
        sortOrder
      }

      const result = await this.controller.getAllRoutes(params)
      
      // Ensure the result has the expected structure for the frontend
      const formattedResult = {
        success: true,
        data: result
      }
      
      if (includeStats && result.routes) {
        // Enhance routes with additional statistics
        formattedResult.data.routes = await this.enhanceRoutesWithStats(result.routes)
      }

      return formattedResult
    } catch (error) {
      throw this.handleServiceError('Failed to get routes', error)
    }
  }

  /**
   * Get detailed route information with all related data
   * @param {string} routeId - Route ID
   * @param {Object} options - Data inclusion options
   * @returns {Promise<Object>} Complete route data
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
      includeRiskAnalysis: true,
      ...options
    }

    try {
      console.log('RouteService: Getting route details for ID:', routeId)
      console.log('RouteService: Options:', defaultOptions)
      console.log('RouteService: ID type and value:', typeof routeId, routeId)
      
      // Get comprehensive route data using the controller
      const result = await this.controller.getAllRouteData(routeId, defaultOptions)
      
      console.log('RouteService: Controller result:', result)
      console.log('RouteService: Result success:', result?.success)
      console.log('RouteService: Result data keys:', result?.data ? Object.keys(result.data) : 'no data')
      
      if (!result.success) {
        console.error('RouteService: Controller returned error:', result.message)
        throw new Error(result.message || 'Failed to fetch route data')
      }
      
      if (defaultOptions.includeRiskAnalysis && result.data.route) {
        // Add risk analysis
        result.data.riskAnalysis = await this.calculateRouteRisk(routeId)
      }

      return result
    } catch (error) {
      throw this.handleServiceError(`Failed to get route details for ${routeId}`, error)
    }
  }

  /**
   * Create a new route with validation
   * @param {Object} routeData - Route information
   * @returns {Promise<Object>} Created route
   */
  async createRoute(routeData) {
    try {
      // Validate required fields
      this.validateRouteData(routeData)
      
      const result = await this.controller.createRoute(routeData)
      
      // Optionally trigger initial data collection
      if (routeData.autoCollectData) {
        this.collectRouteDataAsync(result.route._id || result.route.routeId)
      }
      
      return result
    } catch (error) {
      throw this.handleServiceError('Failed to create route', error)
    }
  }

  /**
   * Update route with validation and change tracking
   * @param {string} routeId - Route ID
   * @param {Object} updateData - Updated route data
   * @returns {Promise<Object>} Updated route
   */
  async updateRoute(routeId, updateData) {
    try {
      // Get current route for comparison
      const currentRoute = await this.controller.getRouteById(routeId)
      
      // Validate update data
      this.validateRouteUpdateData(updateData)
      
      const result = await this.controller.updateRoute(routeId, updateData)
      
      // Check if route path changed and trigger re-analysis if needed
      if (this.hasRoutePathChanged(currentRoute, updateData)) {
        this.reanalyzeRouteAsync(routeId)
      }
      
      return result
    } catch (error) {
      throw this.handleServiceError(`Failed to update route ${routeId}`, error)
    }
  }

  /**
   * Delete route with cleanup
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRoute(routeId) {
    try {
      const result = await this.controller.deleteRoute(routeId)
      
      // Optionally clean up related data
      // Note: Backend should handle this, but we can add frontend cleanup if needed
      
      return result
    } catch (error) {
      throw this.handleServiceError(`Failed to delete route ${routeId}`, error)
    }
  }

  // ==================== DATA COLLECTION AND ANALYSIS ====================

  /**
   * Collect all data for a route with progress tracking
   * @param {string} routeId - Route ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Collection result
   */
  async collectRouteData(routeId, onProgress = null) {
    try {
      if (onProgress) onProgress({ stage: 'starting', progress: 0 })
      
      const result = await this.controller.collectAllRouteData(routeId)
      
      if (onProgress) onProgress({ stage: 'completed', progress: 100 })
      
      return result
    } catch (error) {
      if (onProgress) onProgress({ stage: 'error', progress: 0, error })
      throw this.handleServiceError(`Failed to collect data for route ${routeId}`, error)
    }
  }

  /**
   * Perform comprehensive route analysis
   * @param {string} routeId - Route ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeRoute(routeId, options = {}) {
    const {
      includeVisibility = true,
      includeNetworkCoverage = true,
      includeRoadConditions = true,
      forceRefresh = false
    } = options

    try {
      const analyses = []
      
      if (includeVisibility) {
        analyses.push(this.controller.analyzeVisibility(routeId))
      }
      
      if (includeNetworkCoverage) {
        analyses.push(this.controller.analyzeNetworkCoverage(routeId))
      }
      
      if (includeRoadConditions) {
        analyses.push(this.controller.analyzeRoadConditions(routeId, forceRefresh))
      }
      
      const results = await Promise.allSettled(analyses)
      
      return {
        success: true,
        analyses: {
          visibility: includeVisibility ? results[0] : null,
          networkCoverage: includeNetworkCoverage ? results[includeVisibility ? 1 : 0] : null,
          roadConditions: includeRoadConditions ? results[analyses.length - 1] : null
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw this.handleServiceError(`Failed to analyze route ${routeId}`, error)
    }
  }

  // ==================== RISK ASSESSMENT ====================

  /**
   * Calculate comprehensive risk score for a route
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Risk assessment
   */
  async calculateRouteRisk(routeId) {
    try {
      return await apiService.risk.calculateRisk(routeId)
    } catch (error) {
      throw this.handleServiceError(`Failed to calculate risk for route ${routeId}`, error)
    }
  }

  /**
   * Get risk history for a route
   * @param {string} routeId - Route ID
   * @returns {Promise<Array>} Risk history
   */
  async getRouteRiskHistory(routeId) {
    try {
      return await apiService.risk.getRiskHistory(routeId)
    } catch (error) {
      throw this.handleServiceError(`Failed to get risk history for route ${routeId}`, error)
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Process multiple routes from CSV
   * @param {FormData} formData - CSV file data
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
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
      throw this.handleServiceError('Failed to process bulk routes', error)
    }
  }

  /**
   * Enhance existing routes with additional data
   * @param {Array} routeIds - Array of route IDs
   * @param {Object} options - Enhancement options
   * @returns {Promise<Object>} Enhancement result
   */
  async enhanceExistingRoutes(routeIds, options = {}) {
    try {
      return await apiService.bulkProcessor.enhanceExistingRoutes(routeIds, options)
    } catch (error) {
      throw this.handleServiceError('Failed to enhance existing routes', error)
    }
  }

  // ==================== FILTERING AND SEARCH ====================

  /**
   * Get filtered emergency services for a route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered emergency services
   */
  async getFilteredEmergencyServices(routeId, filters = {}) {
    try {
      const data = await this.controller.getEmergencyServices(routeId, filters)
      return this.controller.processToArray(data)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered emergency services for route ${routeId}`, error)
    }
  }

  /**
   * Get filtered weather data for a route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered weather data
   */
  async getFilteredWeatherData(routeId, filters = {}) {
    try {
      const data = await this.controller.getWeatherData(routeId, filters)
      return this.controller.processToArray(data)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered weather data for route ${routeId}`, error)
    }
  }

  /**
   * Get filtered traffic data for a route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered traffic data
   */
  async getFilteredTrafficData(routeId, filters = {}) {
    try {
      const data = await this.controller.getTrafficData(routeId, filters)
      return this.controller.processToArray(data)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered traffic data for route ${routeId}`, error)
    }
  }

  /**
   * Get filtered road conditions for a route
   * @param {string} routeId - Route ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered road conditions
   */
  async getFilteredRoadConditions(routeId, filters = {}) {
    try {
      const data = await this.controller.getRoadConditions(routeId, filters)
      return this.controller.processToArray(data)
    } catch (error) {
      throw this.handleServiceError(`Failed to get filtered road conditions for route ${routeId}`, error)
    }
  }

  // ==================== UTILITY AND HELPER METHODS ====================

  /**
   * Enhance routes with additional statistics
   * @param {Array} routes - Routes array
   * @returns {Promise<Array>} Enhanced routes
   */
  async enhanceRoutesWithStats(routes) {
    try {
      const enhancedRoutes = await Promise.all(
        routes.map(async (route) => {
          try {
            const riskData = await this.calculateRouteRisk(route._id || route.routeId)
            return {
              ...route,
              riskScore: riskData.riskScore,
              riskLevel: riskData.riskLevel,
              lastAnalyzed: riskData.lastAnalyzed
            }
          } catch (error) {
            // If risk calculation fails, return route without enhancement
            return route
          }
        })
      )
      
      return enhancedRoutes
    } catch (error) {
      // If enhancement fails, return original routes
      console.warn('Failed to enhance routes with stats:', error)
      return routes
    }
  }

  /**
   * Validate route data before creation
   * @param {Object} routeData - Route data to validate
   * @throws {Error} Validation error
   */
  validateRouteData(routeData) {
    const required = ['routeName', 'fromName', 'toName']
    const missing = required.filter(field => !routeData[field])
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
  }

  /**
   * Validate route update data
   * @param {Object} updateData - Update data to validate
   * @throws {Error} Validation error
   */
  validateRouteUpdateData(updateData) {
    // Add specific validation rules for updates
    if (updateData.routeName && updateData.routeName.trim().length === 0) {
      throw new Error('Route name cannot be empty')
    }
  }

  /**
   * Check if route path has changed significantly
   * @param {Object} currentRoute - Current route data
   * @param {Object} updateData - Update data
   * @returns {boolean} True if path changed
   */
  hasRoutePathChanged(currentRoute, updateData) {
    const pathFields = ['fromName', 'toName', 'fromAddress', 'toAddress', 'gpsPoints']
    return pathFields.some(field => 
      updateData[field] && updateData[field] !== currentRoute[field]
    )
  }

  /**
   * Trigger asynchronous data collection for a route
   * @param {string} routeId - Route ID
   */
  async collectRouteDataAsync(routeId) {
    try {
      // Fire and forget - don't wait for completion
      this.controller.collectAllRouteData(routeId)
        .catch(error => console.warn(`Async data collection failed for route ${routeId}:`, error))
    } catch (error) {
      console.warn(`Failed to start async data collection for route ${routeId}:`, error)
    }
  }

  /**
   * Trigger asynchronous route re-analysis
   * @param {string} routeId - Route ID
   */
  async reanalyzeRouteAsync(routeId) {
    try {
      // Fire and forget - don't wait for completion
      this.analyzeRoute(routeId, { forceRefresh: true })
        .catch(error => console.warn(`Async re-analysis failed for route ${routeId}:`, error))
    } catch (error) {
      console.warn(`Failed to start async re-analysis for route ${routeId}:`, error)
    }
  }

  /**
   * Handle service-level errors
   * @param {string} message - Error message
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleServiceError(message, error) {
    console.error(`RouteService Error: ${message}`, error)
    
    const serviceError = new Error(message)
    serviceError.originalError = error
    serviceError.service = 'RouteService'
    serviceError.timestamp = new Date().toISOString()
    
    return serviceError
  }
}

// Export singleton instance
export const routeService = new RouteService()

// Export class for custom instances if needed
export default RouteService