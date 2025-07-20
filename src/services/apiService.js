// Enhanced API Service with real-time status tracking and large batch optimization
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

  // Enhanced Bulk Processing APIs with Real-time Status and Optimization
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

    // Enhanced status polling with detailed progress tracking for large batches
   // Enhanced status polling with detailed progress tracking for large batches
    async getStatus() {
      try {
        const response = await api.get('/api/bulk-routes/status')
        console.log('API Status Response:', response.data)
        
        // Handle different response formats from your backend
        if (response.data.success !== false) {
          // Transform backend response to match frontend expectations
          return {
            status: response.data.status || 'processing',
            currentRoute: response.data.currentRoute || response.data.message || 'Processing...',
            totalRoutes: response.data.totalRoutes || response.data.data?.totalRoutes || 0,
            completedRoutes: response.data.completedRoutes || response.data.data?.successful?.length || 0,
            failedRoutes: response.data.failedRoutes || response.data.data?.failed?.length || 0,
            estimatedTimeRemaining: response.data.estimatedTimeRemaining || 'Calculating...',
            
            // Batch information for large scale processing
            currentBatch: response.data.currentBatch || null,
            totalBatches: response.data.totalBatches || null,
            
            // Enhanced data collection progress
            enhancedDataCollection: response.data.enhancedDataCollection || {
              attempted: 0,
              successful: 0,
              failed: 0,
              sharpTurnsCollected: response.data.enhancedDataCollection?.sharpTurnsCollected || 0,
              blindSpotsCollected: response.data.enhancedDataCollection?.blindSpotsCollected || 0,
              networkCoverageAnalyzed: response.data.enhancedDataCollection?.networkCoverageAnalyzed || 0,
              roadConditionsAnalyzed: response.data.enhancedDataCollection?.roadConditionsAnalyzed || 0,
              accidentDataCollected: response.data.enhancedDataCollection?.accidentDataCollected || 0,
              seasonalWeatherCollected: response.data.enhancedDataCollection?.seasonalWeatherCollected || 0,
              totalRecordsCreated: response.data.enhancedDataCollection?.totalRecordsCreated || 0,
              collectionBreakdown: response.data.enhancedDataCollection?.collectionBreakdown || {}
            },
            
            // Visibility analysis progress  
            visibilityAnalysis: response.data.visibilityAnalysis || {
              enabled: response.data.visibilityAnalysis?.enabled || false,
              attempted: response.data.visibilityAnalysis?.attempted || 0,
              successful: response.data.visibilityAnalysis?.successful || 0,
              failed: response.data.visibilityAnalysis?.failed || 0,
              skipped: response.data.visibilityAnalysis?.skipped || 0,
              currentRoute: response.data.visibilityAnalysis?.currentRoute || null,
              totalSharpTurns: response.data.visibilityAnalysis?.totalSharpTurns || 0,
              totalBlindSpots: response.data.visibilityAnalysis?.totalBlindSpots || 0,
              criticalTurns: response.data.visibilityAnalysis?.criticalTurns || 0,
              criticalBlindSpots: response.data.visibilityAnalysis?.criticalBlindSpots || 0,
              analysisMode: response.data.visibilityAnalysis?.analysisMode || 'comprehensive',
              averageAnalysisTime: response.data.visibilityAnalysis?.averageAnalysisTime || null,
              analysisBreakdown: response.data.visibilityAnalysis?.analysisBreakdown || {
                sharpTurnsSuccess: 0,
                sharpTurnsFailed: 0,
                blindSpotsSuccess: 0,
                blindSpotsFailed: 0
              }
            },
            
            // Processing metadata
            processingMode: response.data.processingMode || 'enhanced',
            dataCollectionMode: response.data.dataCollectionMode || 'comprehensive',
            backgroundProcessing: response.data.backgroundProcessing || false,
            
            // Performance metrics from backend
            performanceMetrics: response.data.performanceMetrics || {
              routesPerMinute: response.data.performanceMetrics?.routesPerMinute || 0,
              elapsedHours: response.data.performanceMetrics?.elapsedHours || 0,
              successRate: response.data.performanceMetrics?.successRate || 0,
              averageTimePerRoute: response.data.performanceMetrics?.averageTimePerRoute || null,
              estimatedHoursRemaining: response.data.performanceMetrics?.estimatedHoursRemaining || null
            },
            
            // Checkpoint and resume information
            lastCheckpoint: response.data.lastCheckpoint || null,
            checkpointInterval: response.data.checkpointInterval || 100,
            resumable: response.data.resumable || false,
            
            // Results if completed
            results: response.data.results || response.data.data || null,
            
            // API metadata
            startTime: response.data.startTime || null,
            lastUpdate: response.data.lastUpdate || new Date().toISOString()
          }
        } else {
          // No active processing or error
          throw new Error(response.data.message || 'No active processing found')
        }
      } catch (error) {
        console.error('Status polling error:', error)
        
        // Handle specific error cases
        if (error.response?.status === 404) {
          // No active processing - this means processing is complete or not found
          return {
            status: 'completed',
            message: 'No active processing found',
            completedRoutes: 0,
            totalRoutes: 0,
            failedRoutes: 0
          }
        } else if (error.response?.status >= 500) {
          // Server error
          throw new Error('Server error while checking status')
        } else {
          // Other errors
          throw error
        }
      }
    },

    // Real-time progress streaming (if supported by backend)
    async subscribeToProgress(callback) {
      // This would use WebSockets or Server-Sent Events if available
      // For now, we'll implement with polling optimized for large batches
      let intervalId
      let errorCount = 0
      const maxErrors = 3
      
      const poll = async () => {
        try {
          const status = await this.getStatus()
          callback(status)
          
          // Reset error count on successful poll
          errorCount = 0
          
          // Stop polling if processing is complete
          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            if (intervalId) {
              clearInterval(intervalId)
            }
          }
        } catch (error) {
          errorCount++
          callback({ error: error.message })
          
          // Stop polling on persistent errors
          if (error.message.includes('No active processing') || errorCount >= maxErrors) {
            if (intervalId) {
              clearInterval(intervalId)
            }
          }
        }
      }
      
      // Start immediate poll
      await poll()
      
      // Continue polling every 30 seconds for large batches
      intervalId = setInterval(poll, 30000)
      
      // Return unsubscribe function
      return () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
      }
    },

    // Cancel processing (if supported by backend)
    async cancelProcessing(processingId) {
      try {
        const response = await api.post('/api/bulk-routes/cancel', { processingId })
        return response.data
      } catch (error) {
        // If cancel endpoint doesn't exist, that's okay
        if (error.response?.status === 404) {
          console.log('Cancel endpoint not available')
          return { success: true, message: 'Cancel endpoint not available' }
        }
        throw error
      }
    },

    // Resume from checkpoint
    async resumeProcessing(checkpointFile, options = {}) {
      try {
        const response = await api.post('/api/bulk-routes/resume', {
          checkpointFile,
          ...options
        })
        return response.data
      } catch (error) {
        console.error('Resume processing error:', error)
        throw error
      }
    },

    // Get processing configuration for large batches
    async getConfiguration() {
      try {
        const response = await api.get('/api/bulk-routes/configuration')
        return response.data
      } catch (error) {
        console.error('Get configuration error:', error)
        // Return default configuration if endpoint doesn't exist
        return {
          success: true,
          data: {
            optimizedFor5800Routes: {
              maxConcurrentRoutes: 10,
              optimalBatchSize: 25,
              routeTimeout: 300000,
              visibilityTimeout: 120000,
              estimatedProcessingTime: '48-72 hours',
              recommendedSettings: {
                backgroundProcessing: true,
                dataCollectionMode: 'comprehensive',
                enableAutomaticVisibilityAnalysis: true,
                continueOnVisibilityFailure: true,
                skipExistingRoutes: true
              }
            }
          }
        }
      }
    },

    async getResults(filename) {
      const response = await api.get(`/api/bulk-routes/results/${filename}`)
      return response.data
    },

    // Background job status (alternative polling method)
    async getBackgroundStatus(jobId) {
      try {
        const response = await api.get(`/api/bulk-routes/background-status/${jobId}`)
        return response.data
      } catch (error) {
        if (error.response?.status === 404) {
          return { status: 'completed', message: 'Job not found or completed' }
        }
        throw error
      }
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
    },

    async generateBulkReport(processingId, options = {}) {
      const response = await api.post(`/api/pdf/bulk-processing/${processingId}/generate`, options, {
        responseType: 'blob'
      })
      return response
    }
  }
}