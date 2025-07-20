import { api } from './authService'

/**
 * Enhanced Route Service with Statistics Integration
 * Uses the new /api/route-data/:routeId/getalldata endpoint for comprehensive route statistics
 */
export class EnhancedRouteService {
  constructor() {
    this.baseUrl = '/api/routes'
    this.routeDataUrl = '/api/route-data'
  }

  // ==================== ROUTE OPERATIONS WITH STATISTICS ====================

  /**
   * Get all routes with enhanced statistics
   */
  async getRoutesWithStatistics(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      riskLevel = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeStatistics = true
    } = options

    try {
      console.log('EnhancedRouteService: Getting routes with statistics from API...')
      
      const params = {
        page,
        limit,
        search,
        riskLevel,
        sortBy,
        sortOrder
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`${this.baseUrl}?${queryString}`)
      
      console.log('EnhancedRouteService: Routes API response:', response.data)
      
      // Process the API response
      let routesData = []
      let totalRoutes = 0
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          routesData = response.data
          totalRoutes = response.data.length
        } else if (response.data.routes && Array.isArray(response.data.routes)) {
          routesData = response.data.routes
          totalRoutes = response.data.pagination?.totalRoutes || response.data.routes.length
        } else if (response.data.data && Array.isArray(response.data.data)) {
          routesData = response.data.data
          totalRoutes = response.data.data.length
        } else if (response.data.data && response.data.data.routes && Array.isArray(response.data.data.routes)) {
          routesData = response.data.data.routes
          totalRoutes = response.data.data.pagination?.totalRoutes || response.data.data.routes.length
        } else {
          routesData = [response.data]
          totalRoutes = 1
        }
      }

      // If statistics are requested, fetch for each route
      if (includeStatistics && routesData.length > 0) {
        console.log('EnhancedRouteService: Fetching statistics for', routesData.length, 'routes...')
        
        // Fetch statistics for all routes in parallel (limit concurrent requests)
        const batchSize = 5 // Process 5 routes at a time
        const routesWithStats = []
        
        for (let i = 0; i < routesData.length; i += batchSize) {
          const batch = routesData.slice(i, i + batchSize)
          
          const batchPromises = batch.map(async (route) => {
            try {
              const stats = await this.getRouteStatistics(route._id || route.routeId)
              return {
                ...route,
                statistics: stats,
                hasStatistics: true
              }
            } catch (error) {
              console.warn(`Failed to get statistics for route ${route._id}:`, error.message)
              return {
                ...route,
                statistics: this.getEmptyStatistics(),
                hasStatistics: false,
                statisticsError: error.message
              }
            }
          })

          const batchResults = await Promise.allSettled(batchPromises)
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              routesWithStats.push(result.value)
            } else {
              console.error('Batch processing error:', result.reason)
              // Add route without statistics
              const originalRoute = batch[index]
              routesWithStats.push({
                ...originalRoute,
                statistics: this.getEmptyStatistics(),
                hasStatistics: false,
                statisticsError: result.reason?.message || 'Unknown error'
              })
            }
          })
        }
        
        routesData = routesWithStats
      }

      const processedResult = {
        success: true,
        data: {
          routes: routesData,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalRoutes: totalRoutes,
            totalPages: Math.ceil(totalRoutes / limit)
          },
          statisticsIncluded: includeStatistics
        }
      }

      console.log('EnhancedRouteService: Processed result:', {
        totalRoutes: processedResult.data.routes.length,
        withStatistics: processedResult.data.routes.filter(r => r.hasStatistics).length,
        pagination: processedResult.data.pagination
      })

      return processedResult
    } catch (error) {
      console.error('EnhancedRouteService: Failed to get routes with statistics:', error)
      throw this.handleServiceError('Failed to get routes with statistics from API', error)
    }
  }

  /**
   * Get comprehensive route statistics using the new endpoint
   */
  async getRouteStatistics(routeId) {
    try {
      console.log('EnhancedRouteService: Fetching comprehensive statistics for route:', routeId)
      
      const response = await api.get(`${this.routeDataUrl}/${routeId}/getalldata`)
      
      console.log('EnhancedRouteService: Statistics API response structure:', {
        success: response.data?.success,
        hasRouteInfo: !!response.data?.routeInfo,
        hasStatistics: !!response.data?.statistics,
        hasDetailedData: !!response.data?.detailedData,
        executionTime: response.data?.executionTime
      })

      if (!response.data || !response.data.success) {
        throw new Error('Invalid statistics response from API')
      }

      // Transform the API response to our expected format
      const apiData = response.data
      
      const statistics = {
        // Route basic info
        route: {
          id: apiData.routeInfo?.routeId || routeId,
          name: apiData.routeInfo?.routeName || 'Unknown Route',
          fromName: apiData.routeInfo?.fromName || 'Unknown Origin',
          toName: apiData.routeInfo?.toName || 'Unknown Destination',
          totalDistance: apiData.routeInfo?.totalDistance || 0,
          terrain: apiData.routeInfo?.terrain || 'mixed',
          riskLevel: apiData.routeInfo?.riskLevel || 'UNKNOWN',
          gpsPoints: apiData.routeInfo?.gpsPoints || 0,
          liveMapLink: apiData.routeInfo?.liveMapLink
        },

        // Data availability counts
        dataAvailability: {
          weatherConditions: apiData.statistics?.dataDistribution?.weatherConditions || 0,
          trafficData: apiData.statistics?.dataDistribution?.trafficData || 0,
          sharpTurns: apiData.statistics?.dataDistribution?.sharpTurns || 0,
          roadConditions: apiData.statistics?.dataDistribution?.roadConditions || 0,
          networkCoverage: apiData.statistics?.dataDistribution?.networkCoverage || 0,
          emergencyServices: apiData.statistics?.dataDistribution?.emergencyServices || 0,
          blindSpots: apiData.statistics?.dataDistribution?.blindSpots || 0,
          accidentProneAreas: apiData.statistics?.dataDistribution?.accidentProneAreas || 0
        },

        // Risk factors and critical points
        riskFactors: {
          sharpTurnsCount: apiData.statistics?.dataDistribution?.sharpTurns || 0,
          blindSpotsCount: apiData.statistics?.dataDistribution?.blindSpots || 0,
          accidentAreasCount: apiData.statistics?.dataDistribution?.accidentProneAreas || 0,
          networkDeadZones: apiData.statistics?.criticalPoints?.networkDeadZones || 0,
          criticalSharpTurns: apiData.statistics?.criticalPoints?.sharpTurns || 0,
          criticalBlindSpots: apiData.statistics?.criticalPoints?.blindSpots || 0,
          criticalAccidentAreas: apiData.statistics?.criticalPoints?.accidentAreas || 0
        },

        // Average risk scores
        riskScores: {
          weather: apiData.statistics?.averageRiskScores?.weather || 0,
          traffic: apiData.statistics?.averageRiskScores?.traffic || 0,
          sharpTurns: apiData.statistics?.averageRiskScores?.sharpTurns || 0,
          roadConditions: apiData.statistics?.averageRiskScores?.roadConditions || 0,
          blindSpots: apiData.statistics?.averageRiskScores?.blindSpots || 0,
          accidentAreas: apiData.statistics?.averageRiskScores?.accidentAreas || 0
        },

        // Overall statistics
        totals: {
          totalDataPoints: apiData.statistics?.totalDataPoints || 0,
          criticalPoints: Object.values(apiData.statistics?.criticalPoints || {}).reduce((sum, count) => sum + count, 0),
          dataCollectionsWithData: Object.values(apiData.statistics?.dataDistribution || {}).filter(count => count > 0).length,
          totalCollections: 8
        },

        // Performance and quality metrics
        performance: {
          executionTime: apiData.executionTime || 'N/A',
          dataCompleteness: apiData.dataQuality?.completeness || 0,
          collectionsWithData: apiData.dataQuality?.collectionsWithData || 0,
          totalCollections: apiData.dataQuality?.totalCollections || 8
        },

        // API metadata
        metadata: {
          timestamp: apiData.performanceMetrics?.timestamp || new Date().toISOString(),
          source: 'route-data-api',
          version: 'v1.0',
          dataPointsReturned: apiData.performanceMetrics?.dataPointsReturned || 0
        }
      }

      console.log('EnhancedRouteService: Processed statistics:', {
        routeId: statistics.route.id,
        totalDataPoints: statistics.totals.totalDataPoints,
        criticalPoints: statistics.totals.criticalPoints,
        dataCompleteness: statistics.performance.dataCompleteness
      })

      return statistics

    } catch (error) {
      console.error('EnhancedRouteService: Failed to get route statistics:', error)
      throw this.handleServiceError(`Failed to get route statistics for ${routeId}`, error)
    }
  }

  /**
   * Get detailed route information with comprehensive statistics
   */
  async getRouteDetailsWithStatistics(routeId) {
    try {
      console.log('EnhancedRouteService: Getting detailed route info with statistics for:', routeId)
      
      // Get both basic route info and comprehensive statistics
      const [routeResponse, statisticsResponse] = await Promise.allSettled([
        api.get(`${this.baseUrl}/${routeId}`),
        api.get(`${this.routeDataUrl}/${routeId}/getalldata`)
      ])

      let routeData = null
      let statistics = null

      // Process route response
      if (routeResponse.status === 'fulfilled') {
        routeData = routeResponse.value.data
        console.log('EnhancedRouteService: Route data loaded successfully')
      } else {
        console.error('EnhancedRouteService: Route data failed:', routeResponse.reason)
        throw new Error(`Failed to load route data: ${routeResponse.reason.message}`)
      }

      // Process statistics response
      if (statisticsResponse.status === 'fulfilled') {
        const statsData = statisticsResponse.value.data
        if (statsData && statsData.success) {
          statistics = await this.getRouteStatistics(routeId) // Use our transformer
          console.log('EnhancedRouteService: Statistics loaded successfully')
        } else {
          console.warn('EnhancedRouteService: Statistics API returned unsuccessful response')
          statistics = this.getEmptyStatistics()
        }
      } else {
        console.warn('EnhancedRouteService: Statistics failed:', statisticsResponse.reason)
        statistics = this.getEmptyStatistics()
      }

      const result = {
        success: true,
        data: {
          route: routeData,
          statistics: statistics,
          hasStatistics: !!statistics && statistics.totals.totalDataPoints > 0
        },
        timestamp: new Date().toISOString(),
        source: 'enhanced-route-service'
      }

      console.log('EnhancedRouteService: Final route details result:', {
        routeExists: !!result.data.route,
        hasStatistics: result.data.hasStatistics,
        totalDataPoints: result.data.statistics?.totals?.totalDataPoints || 0
      })

      return result

    } catch (error) {
      console.error('EnhancedRouteService: Failed to get route details with statistics:', error)
      throw this.handleServiceError(`Failed to get route details with statistics for ${routeId}`, error)
    }
  }

  /**
   * Get route summary statistics for multiple routes
   */
  async getRoutesSummaryStatistics(routeIds) {
    try {
      console.log('EnhancedRouteService: Getting summary statistics for', routeIds.length, 'routes')
      
      const summaryStats = {
        totalRoutes: routeIds.length,
        routesWithData: 0,
        totalDataPoints: 0,
        totalCriticalPoints: 0,
        averageDataCompleteness: 0,
        dataBreakdown: {
          weatherConditions: 0,
          trafficData: 0,
          sharpTurns: 0,
          roadConditions: 0,
          networkCoverage: 0,
          emergencyServices: 0,
          blindSpots: 0,
          accidentProneAreas: 0
        },
        riskBreakdown: {
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0,
          criticalRisk: 0
        }
      }

      // Process routes in batches
      const batchSize = 5
      for (let i = 0; i < routeIds.length; i += batchSize) {
        const batch = routeIds.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (routeId) => {
          try {
            return await this.getRouteStatistics(routeId)
          } catch (error) {
            console.warn(`Failed to get statistics for route ${routeId}:`, error.message)
            return null
          }
        })

        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const stats = result.value
            
            summaryStats.routesWithData++
            summaryStats.totalDataPoints += stats.totals.totalDataPoints
            summaryStats.totalCriticalPoints += stats.totals.criticalPoints
            summaryStats.averageDataCompleteness += stats.performance.dataCompleteness

            // Aggregate data breakdown
            Object.keys(summaryStats.dataBreakdown).forEach(key => {
              summaryStats.dataBreakdown[key] += stats.dataAvailability[key] || 0
            })

            // Aggregate risk breakdown
            const riskLevel = stats.route.riskLevel?.toLowerCase() || 'unknown'
            if (riskLevel.includes('low')) summaryStats.riskBreakdown.lowRisk++
            else if (riskLevel.includes('medium')) summaryStats.riskBreakdown.mediumRisk++
            else if (riskLevel.includes('high')) summaryStats.riskBreakdown.highRisk++
            else if (riskLevel.includes('critical')) summaryStats.riskBreakdown.criticalRisk++
          }
        })
      }

      // Calculate averages
      if (summaryStats.routesWithData > 0) {
        summaryStats.averageDataCompleteness = Math.round(summaryStats.averageDataCompleteness / summaryStats.routesWithData)
        summaryStats.averageDataPointsPerRoute = Math.round(summaryStats.totalDataPoints / summaryStats.routesWithData)
      }

      console.log('EnhancedRouteService: Summary statistics calculated:', {
        totalRoutes: summaryStats.totalRoutes,
        routesWithData: summaryStats.routesWithData,
        totalDataPoints: summaryStats.totalDataPoints,
        averageDataCompleteness: summaryStats.averageDataCompleteness
      })

      return summaryStats

    } catch (error) {
      console.error('EnhancedRouteService: Failed to get summary statistics:', error)
      throw this.handleServiceError('Failed to get routes summary statistics', error)
    }
  }

  /**
   * Check if route has comprehensive data
   */
  async checkRouteDataAvailability(routeId) {
    try {
      const statistics = await this.getRouteStatistics(routeId)
      
      const availability = {
        hasData: statistics.totals.totalDataPoints > 0,
        dataCompleteness: statistics.performance.dataCompleteness,
        collectionsWithData: statistics.performance.collectionsWithData,
        totalCollections: statistics.performance.totalCollections,
        hasCriticalData: statistics.totals.criticalPoints > 0,
        enhancedDataAvailable: {
          sharpTurns: statistics.dataAvailability.sharpTurns > 0,
          blindSpots: statistics.dataAvailability.blindSpots > 0,
          networkCoverage: statistics.dataAvailability.networkCoverage > 0,
          roadConditions: statistics.dataAvailability.roadConditions > 0,
          accidentAreas: statistics.dataAvailability.accidentProneAreas > 0
        }
      }

      return availability

    } catch (error) {
      console.error('EnhancedRouteService: Failed to check route data availability:', error)
      return {
        hasData: false,
        dataCompleteness: 0,
        collectionsWithData: 0,
        totalCollections: 0,
        hasCriticalData: false,
        enhancedDataAvailable: {
          sharpTurns: false,
          blindSpots: false,
          networkCoverage: false,
          roadConditions: false,
          accidentAreas: false
        },
        error: error.message
      }
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get empty statistics structure
   */
  getEmptyStatistics() {
    return {
      route: {
        id: null,
        name: 'Unknown Route',
        fromName: 'Unknown Origin',
        toName: 'Unknown Destination',
        totalDistance: 0,
        terrain: 'unknown',
        riskLevel: 'UNKNOWN',
        gpsPoints: 0,
        liveMapLink: null
      },
      dataAvailability: {
        weatherConditions: 0,
        trafficData: 0,
        sharpTurns: 0,
        roadConditions: 0,
        networkCoverage: 0,
        emergencyServices: 0,
        blindSpots: 0,
        accidentProneAreas: 0
      },
      riskFactors: {
        sharpTurnsCount: 0,
        blindSpotsCount: 0,
        accidentAreasCount: 0,
        networkDeadZones: 0,
        criticalSharpTurns: 0,
        criticalBlindSpots: 0,
        criticalAccidentAreas: 0
      },
      riskScores: {
        weather: 0,
        traffic: 0,
        sharpTurns: 0,
        roadConditions: 0,
        blindSpots: 0,
        accidentAreas: 0
      },
      totals: {
        totalDataPoints: 0,
        criticalPoints: 0,
        dataCollectionsWithData: 0,
        totalCollections: 8
      },
      performance: {
        executionTime: 'N/A',
        dataCompleteness: 0,
        collectionsWithData: 0,
        totalCollections: 8
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'empty-statistics',
        version: 'v1.0',
        dataPointsReturned: 0
      }
    }
  }

  /**
   * Format statistics for display
   */
  formatStatisticsForDisplay(statistics) {
    if (!statistics) return null

    return {
      ...statistics,
      formattedTotals: {
        totalDataPoints: statistics.totals.totalDataPoints.toLocaleString(),
        criticalPoints: statistics.totals.criticalPoints.toLocaleString(),
        dataCompleteness: `${statistics.performance.dataCompleteness}%`,
        collectionsWithData: `${statistics.performance.collectionsWithData}/${statistics.performance.totalCollections}`
      },
      summary: {
        hasEnhancedData: statistics.totals.totalDataPoints > 50,
        hasVisibilityData: (statistics.dataAvailability.sharpTurns + statistics.dataAvailability.blindSpots) > 0,
        hasCriticalIssues: statistics.totals.criticalPoints > 0,
        dataQuality: statistics.performance.dataCompleteness >= 80 ? 'excellent' : 
                    statistics.performance.dataCompleteness >= 60 ? 'good' : 
                    statistics.performance.dataCompleteness >= 40 ? 'fair' : 'poor'
      }
    }
  }

  /**
   * Handle service-level errors
   */
  handleServiceError(message, error) {
    console.error(`EnhancedRouteService Error: ${message}`, {
      originalError: error.message,
      stack: error.stack,
      service: 'EnhancedRouteService',
      timestamp: new Date().toISOString(),
      isAPIError: error.isAPIError || false,
      apiStatus: error.status
    })
    
    const serviceError = new Error(message)
    serviceError.originalError = error
    serviceError.service = 'EnhancedRouteService'
    serviceError.timestamp = new Date().toISOString()
    serviceError.isAPIError = error.isAPIError || false
    
    return serviceError
  }
}

// Export singleton instance
export const enhancedRouteService = new EnhancedRouteService()

// Export class for custom instances if needed
export default EnhancedRouteService