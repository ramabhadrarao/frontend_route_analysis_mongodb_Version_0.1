import React, { useState, useEffect, useRef } from 'react'
import { Download, Eye, RefreshCw, Activity, CheckCircle, X, Pause, Upload, BarChart3, AlertCircle, Zap, Database } from 'lucide-react'
import { apiService } from '../services/apiService'
import { generateCSVTemplate } from '../utils/helpers'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import Select from '../components/UI/Select'
import FileUpload from '../components/BulkProcessor/FileUpload'
import ProcessingProgress from '../components/BulkProcessor/ProcessingProgress'
import ResultsViewer from '../components/BulkProcessor/ResultsViewer'
import toast from 'react-hot-toast'

const BulkProcessor = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [options, setOptions] = useState({
    concurrentRoutes: 10, // Changed from 2 to 10 for optimization
    batchSize: 25, // New option for batch processing
    visibilityAnalysisMode: 'comprehensive'
  })

  // Refs for managing polling
  const pollIntervalRef = useRef(null)
  const mountedRef = useRef(true)

  // Check for existing processing on component mount
  useEffect(() => {
    checkExistingProcessing()
    
    return () => {
      mountedRef.current = false
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Save processing state to localStorage
  const saveProcessingState = (state) => {
    localStorage.setItem('bulkProcessingState', JSON.stringify({
      ...state,
      timestamp: Date.now()
    }))
  }

  // Load processing state from localStorage
  const loadProcessingState = () => {
    try {
      const saved = localStorage.getItem('bulkProcessingState')
      if (saved) {
        const state = JSON.parse(saved)
        // Only restore if it's recent (within 72 hours for large batches)
        if (Date.now() - state.timestamp < 72 * 60 * 60 * 1000) {
          return state
        }
      }
    } catch (error) {
      console.error('Error loading processing state:', error)
    }
    return null
  }

  // Clear processing state
  const clearProcessingState = () => {
    localStorage.removeItem('bulkProcessingState')
  }

  // Check for existing processing on page load
  const checkExistingProcessing = async () => {
    const savedState = loadProcessingState()
    
    if (savedState && savedState.processing) {
      console.log('Found existing processing state, checking status...')
      setProcessing(true)
      setProgress(savedState.progress || null)
      setProcessingId(savedState.processingId || null)
      setOptions(savedState.options || options)
      
      // Start polling immediately
      startProgressPolling()
      
      toast.success('Resuming bulk processing status tracking...')
    }
  }

  // Start progress polling
  const startProgressPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    console.log('Starting progress polling...')
    
    // Initial poll immediately
    pollProgress()
    
    pollIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        clearInterval(pollIntervalRef.current)
        return
      }

      try {
        await pollProgress()
      } catch (error) {
        console.error('Progress polling error:', error)
      }
    }, 30000) // Poll every 30 seconds for large batches
  }

  // Stop progress polling
  const stopProgressPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  // Enhanced progress polling
  // Enhanced progress polling
  const pollProgress = async () => {
    try {
      console.log('Polling progress from API...')
      const response = await apiService.bulkProcessor.getStatus()
      
      console.log('Progress poll response:', response)
      
      if (!mountedRef.current) return

      // Check if we got a 404 or "no processing" response
      if (response.message === 'No active processing found' || 
          (response.status === 'completed' && response.totalRoutes === 0)) {
        console.log('No active processing found, clearing state')
        handleProcessingComplete(null)
        return
      }

      // Update progress state
      const newProgress = {
        status: response.status || 'processing',
        currentRoute: response.currentRoute || 'Processing...',
        totalRoutes: response.totalRoutes || 0,
        completedRoutes: response.completedRoutes || 0,
        failedRoutes: response.failedRoutes || 0,
        estimatedTimeRemaining: response.estimatedTimeRemaining || 'Calculating...',
        
        // Enhanced data collection progress
        enhancedDataCollection: response.enhancedDataCollection || {
          attempted: 0,
          successful: 0,
          failed: 0,
          totalRecordsCreated: 0,
          collectionBreakdown: {}
        },
        
        // Visibility analysis progress  
        visibilityAnalysis: response.visibilityAnalysis || {
          attempted: 0,
          successful: 0,
          failed: 0,
          totalSharpTurns: 0,
          totalBlindSpots: 0,
          criticalTurns: 0,
          criticalBlindSpots: 0
        },
        
        // Performance metrics
        performanceMetrics: response.performanceMetrics || {
          routesPerMinute: 0,
          elapsedHours: 0,
          successRate: 0
        },
        
        // Processing metadata
        processingMode: response.processingMode,
        dataCollectionMode: response.dataCollectionMode,
        backgroundProcessing: response.backgroundProcessing,
        currentBatch: response.currentBatch,
        totalBatches: response.totalBatches,
        
        timestamp: new Date().toISOString()
      }

      setProgress(newProgress)

      // Save state for persistence
      saveProcessingState({
        processing: true,
        progress: newProgress,
        processingId: processingId,
        options: options
      })

      // Check if processing is complete
      if (response.status === 'completed') {
        console.log('Processing completed!')
        handleProcessingComplete(response)
      } else if (response.status === 'failed') {
        console.log('Processing failed!')
        handleProcessingFailed(response)
      } else if (response.status === 'cancelled') {
        console.log('Processing cancelled!')
        handleProcessingCancelled(response)
      }

    } catch (error) {
      console.error('Progress polling failed:', error)
      
      // Handle different types of errors
      if (error.response?.status === 404) {
        // No active processing found
        console.log('No active processing found, stopping polling')
        handleProcessingComplete(null)
      } else if (error.response?.status >= 500) {
        // Server error, continue polling but show warning
        toast.error('Server error while checking progress. Retrying in 30 seconds...')
      } else {
        // Other errors, show message but continue polling
        console.warn('Progress check failed, will retry:', error.message)
      }
    }
  }
  // Handle processing completion
 // Handle processing completion
  const handleProcessingComplete = (response) => {
    setProcessing(false)
    stopProgressPolling()
    clearProcessingState()

    // Clear progress state to prevent showing stale data
    setProgress(null)

    if (response && response.results) {
      setResults(response.results)
      
      // Show completion message with stats
      const stats = response.results.summary || response.results
      if (stats.totalProcessingTime) {
        toast.success(
          `Processing completed in ${stats.totalProcessingTime}! ${stats.successful || 0} routes processed successfully.`
        )
      } else if (stats.enhancedDataCollectionStats) {
        toast.success(
          `Processing completed! ${stats.successful || 0} routes processed with ${stats.enhancedDataCollectionStats.totalRecordsCreated || 0} data records created.`
        )
      } else {
        toast.success(`Processing completed! ${stats.successful || 0} routes processed successfully.`)
      }
    } else {
      toast.success('Processing completed successfully!')
    }
  }

  // Handle processing failure
  const handleProcessingFailed = (response) => {
    setProcessing(false)
    stopProgressPolling()
    clearProcessingState()
    
    const errorMessage = response?.error || response?.message || 'Processing failed'
    toast.error(`Processing failed: ${errorMessage}`)
  }

  // Handle processing cancellation
  const handleProcessingCancelled = (response) => {
    setProcessing(false)
    stopProgressPolling()
    clearProcessingState()
    
    toast('Processing was cancelled', { icon: 'ℹ️' })
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setResults(null)
    // Clear any previous processing state when new file is selected
    clearProcessingState()
    
    // Check file size and show warning for large files
    const rowEstimate = Math.round(file.size / 100) // Rough estimate
    if (rowEstimate > 1000) {
      toast(`Large file detected (~${rowEstimate} routes). Processing will run in background.`, { icon: 'ℹ️' })
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleStartProcessing = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first')
      return
    }

    const formData = new FormData()
    formData.append('routesCsvFile', selectedFile)
    
    // Enhanced + Automatic Visibility processing with optimized options
    formData.append('dataFolderPath', './data')
    formData.append('terrainType', 'mixed')
    formData.append('dataCollectionMode', 'comprehensive')
    formData.append('maxConcurrentRoutes', options.concurrentRoutes.toString())
    formData.append('batchSize', (options.batchSize || 25).toString()) // Add batch size
    formData.append('skipExistingRoutes', 'true')
    formData.append('backgroundProcessing', 'true') // Always use background processing
    
    // Enhanced data collection options (all enabled for Enhanced + Visibility)
    formData.append('includeSharpTurns', 'true')
    formData.append('includeBlindSpots', 'true')
    formData.append('includeNetworkCoverage', 'true')
    formData.append('includeEnhancedRoadConditions', 'true')
    formData.append('includeAccidentData', 'true')
    formData.append('includeSeasonalWeather', 'true') // Changed from 'false' to 'true'
    formData.append('downloadImages', 'false')
    formData.append('generateReports', 'false')
    
    // Automatic Visibility Analysis Parameters (enabled by default)
    formData.append('enableAutomaticVisibilityAnalysis', 'true')
    formData.append('visibilityAnalysisTimeout', '120000') // Reduced from 180000 to match backend
    formData.append('continueOnVisibilityFailure', 'true')
    formData.append('visibilityAnalysisMode', options.visibilityAnalysisMode || 'comprehensive')

    try {
      setProcessing(true)
      setResults(null)
      
      // Generate processing ID for tracking
      const newProcessingId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setProcessingId(newProcessingId)
      
      // Initial progress state
      const initialProgress = {
        status: 'starting',
        currentRoute: 'Initializing optimized processing for large batch...',
        totalRoutes: 0,
        completedRoutes: 0,
        failedRoutes: 0,
        estimatedTimeRemaining: 'Calculating...',
        visibilityAnalysis: {
          attempted: 0,
          successful: 0,
          failed: 0,
          currentRoute: null
        },
        enhancedDataCollection: {
          attempted: 0,
          successful: 0,
          failed: 0,
          totalRecordsCreated: 0
        },
        performanceMetrics: {
          routesPerMinute: 0,
          elapsedHours: 0,
          successRate: 0
        },
        timestamp: new Date().toISOString()
      }
      
      setProgress(initialProgress)
      
      // Save initial state
      saveProcessingState({
        processing: true,
        progress: initialProgress,
        processingId: newProcessingId,
        options: options
      })

      console.log('Starting optimized processing with ID:', newProcessingId)
      console.log('Configuration:', {
        concurrentRoutes: options.concurrentRoutes,
        batchSize: options.batchSize || 25,
        visibilityAnalysisMode: options.visibilityAnalysisMode
      })

      // Use the enhanced endpoint with visibility analysis
      const response = await apiService.bulkProcessor.processCSVEnhanced(formData)
      console.log('Processing start response:', response)

      if (response.success) {
        // Start polling for progress immediately
        startProgressPolling()
        
        toast.success('Optimized processing started for large batch!')
        
        // Show estimated time if available
        if (response.data?.estimatedCompletion) {
          toast(`Estimated completion: ${response.data.estimatedCompletion}`, {
            icon: 'ℹ️',
            duration: 10000
          })
        }
      } else {
        throw new Error(response.message || 'Processing failed to start')
      }
    } catch (error) {
      console.error('Processing start error:', error)
      setProcessing(false)
      setProgress(null)
      clearProcessingState()
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start processing'
      toast.error(errorMessage)
    }
  }

  const handleStopProcessing = async () => {
    try {
      // Stop polling
      stopProgressPolling()
      
      // Try to cancel processing on backend if endpoint exists
      try {
        await apiService.bulkProcessor.cancelProcessing?.(processingId)
        toast.success('Processing cancelled successfully')
      } catch (cancelError) {
        console.log('Cancel endpoint not available, just stopping local tracking')
        toast('Cancel endpoint not available, just stopping local tracking', { icon: 'ℹ️' })
      }
      
      // Reset local state
      setProcessing(false)
      setProgress(null)
      setProcessingId(null)
      clearProcessingState()
      
    } catch (error) {
      console.error('Error stopping processing:', error)
      
      // Force reset even if cancel fails
      stopProgressPolling()
      setProcessing(false)
      setProgress(null)
      setProcessingId(null)
      clearProcessingState()
      
      toast('Processing tracking stopped', { icon: 'ℹ️' })
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate()
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'route_template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Template downloaded successfully!')
  }

  const handleDownloadResults = () => {
    if (results) {
      const csvData = results.routes?.map(route => ({
        routeName: route.routeName,
        totalDistance: route.totalDistance,
        riskScore: route.riskScore,
        riskLevel: route.riskLevel,
        status: route.status,
        sharpTurns: route.visibilityData?.sharpTurns || 0,
        blindSpots: route.visibilityData?.blindSpots || 0,
        criticalTurns: route.visibilityData?.criticalTurns || 0,
        criticalBlindSpots: route.visibilityData?.criticalBlindSpots || 0,
        visibilityAnalyzed: route.visibilityAnalysisSuccessful || false,
        enhancedDataPoints: route.enhancedDataCollected || 0
      })) || []

      if (csvData.length > 0) {
        const headers = Object.keys(csvData[0]).join(',')
        const rows = csvData.map(row => Object.values(row).join(','))
        const csv = [headers, ...rows].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `processing_results_optimized_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Results with comprehensive data downloaded!')
      } else {
        toast.error('No results available to download')
      }
    }
  }

  const handleViewDetails = (routeId) => {
    window.open(`/routes/${routeId}`, '_blank')
  }

  const concurrentOptions = [
    { value: 1, label: '1 Route (Safest)' },
    { value: 2, label: '2 Routes (Conservative)' },
    { value: 3, label: '3 Routes' },
    { value: 4, label: '4 Routes' },
    { value: 5, label: '5 Routes' },
    { value: 10, label: '10 Routes (Optimized for 5800)' }
  ]

  const batchSizeOptions = [
    { value: 10, label: '10 Routes per Batch' },
    { value: 25, label: '25 Routes per Batch (Optimized)' },
    { value: 50, label: '50 Routes per Batch (Maximum)' }
  ]

  // Calculate estimated processing metrics
  const getEstimatedMetrics = () => {
    if (!selectedFile) return null
    
    const fileSizeMB = selectedFile.size / (1024 * 1024)
    const estimatedRoutes = Math.round(fileSizeMB * 100) // Rough estimate
    const routesPerHour = options.concurrentRoutes * 20 // Approximate based on config
    const estimatedHours = Math.round(estimatedRoutes / routesPerHour)
    
    return {
      estimatedRoutes,
      estimatedHours,
      estimatedDays: Math.round(estimatedHours / 24 * 10) / 10,
      routesPerHour
    }
  }

  const estimatedMetrics = getEstimatedMetrics()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Bulk Route Processor</h1>
          <p className="text-gray-600">
            Optimized for large-scale processing with comprehensive data collection and automatic visibility analysis
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>
          {processing && (
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => {
                stopProgressPolling()
                startProgressPolling()
              }}
            >
              Refresh Status
            </Button>
          )}
        </div>
      </div>

      {/* Processing Status Indicator */}
      {processing && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-800 font-medium">
                  Optimized Processing Active
                </span>
              </div>
              {progress && (
                <>
                  <Badge variant="primary" className="flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>{progress.completedRoutes}/{progress.totalRoutes}</span>
                  </Badge>
                  {progress.currentBatch && progress.totalBatches && (
                    <Badge variant="info" size="sm">
                      Batch {progress.currentBatch}/{progress.totalBatches}
                    </Badge>
                  )}
                  {progress.performanceMetrics?.routesPerMinute > 0 && (
                    <Badge variant="success" size="sm">
                      {progress.performanceMetrics.routesPerMinute.toFixed(1)} routes/min
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-700">
                Session ID: {processingId?.slice(-8) || 'N/A'}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={X}
                onClick={handleStopProcessing}
                className="text-red-600 hover:text-red-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Large Batch Warning */}
      {estimatedMetrics && estimatedMetrics.estimatedRoutes > 1000 && !processing && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900">Large Batch Detected</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Estimated {estimatedMetrics.estimatedRoutes.toLocaleString()} routes will take approximately {estimatedMetrics.estimatedDays} days to process.
                Processing will run in the background with checkpoints saved every 100 routes.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced + Automatic Visibility Processing Mode (Fixed) */}
      <Card className="p-6">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-4">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Eye className="w-8 h-8" />
              <Activity className="w-8 h-8" />
              <BarChart3 className="w-8 h-8" />
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Optimized Processing for Large Batches</h3>
            <p className="text-blue-100">
              Enhanced data collection with automatic visibility analysis, optimized for 5800+ routes
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="font-medium text-green-800">Sharp Turns Analysis</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="font-medium text-green-800">Blind Spots Detection</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="font-medium text-green-800">Enhanced Road Conditions</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="font-medium text-green-800">All Weather Data</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload & Configuration */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onRemoveFile={handleRemoveFile}
              disabled={processing}
            />
          </Card>

          {/* Optimized Configuration */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Configuration</h3>
            <div className="space-y-4">
              <div>
                <Select
                  label="Concurrent Routes (Processing Speed)"
                  options={concurrentOptions}
                  value={options.concurrentRoutes}
                  onChange={(e) => setOptions(prev => ({ ...prev, concurrentRoutes: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  10 routes recommended for 5800+ route batches
                </p>
              </div>

              <div>
                <Select
                  label="Batch Size"
                  options={batchSizeOptions}
                  value={options.batchSize || 25}
                  onChange={(e) => setOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  25 routes per batch is optimal for memory management
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Optimized for Large Batches:</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Comprehensive data collection from all available APIs</li>
                  <li>• Automatic sharp turn and blind spot detection</li>
                  <li>• Network coverage and road condition analysis</li>
                  <li>• Emergency services and accident data collection</li>
                  <li>• Real-time progress tracking with live statistics</li>
                  <li>• Optimized for 5800 routes: 10 concurrent, 25 per batch</li>
                  <li>• Estimated time: 48-72 hours for complete processing</li>
                  <li>• Progress saved every 100 routes for resume capability</li>
                  <li>• Memory management with garbage collection</li>
                  <li>• Automatic retry on API failures</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Start Processing Button */}
          <Card className="p-6">
            {!processing ? (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  icon={Upload}
                  onClick={handleStartProcessing}
                  disabled={!selectedFile}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Start Optimized Processing
                </Button>
                {estimatedMetrics && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Estimated Routes</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ~{estimatedMetrics.estimatedRoutes.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Processing Time</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ~{estimatedMetrics.estimatedDays} days
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  icon={Pause}
                  onClick={handleStopProcessing}
                  className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  Cancel Processing
                </Button>
                <p className="text-center text-sm text-gray-600">
                  Processing will continue in background even if you close this page
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Progress & Results */}
        <div className="space-y-6">
          {progress && (
            <ProcessingProgress
              progress={progress}
              onStop={handleStopProcessing}
              processingId={processingId}
            />
          )}

          {results && (
            <ResultsViewer
              results={results}
              onDownload={handleDownloadResults}
              onViewDetails={handleViewDetails}
            />
          )}

          {!progress && !results && (
            <Card className="p-8 text-center">
              <div className="mb-4">
                <Database className="mx-auto h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready for Large-Scale Processing
              </h3>
              <p className="text-gray-500 mb-4">
                Upload a CSV file to start optimized processing with comprehensive data collection and automatic visibility analysis.
                Progress will be tracked in real-time and persisted across page refreshes.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">System Recommendations:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure stable internet connection</li>
                  <li>• Keep browser tab open for monitoring</li>
                  <li>• Processing continues if page is closed</li>
                  <li>• Check back every few hours for progress</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Status Footer */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-green-800 font-medium">
              Optimized Bulk Processor with Automatic Visibility Analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">Auto-Visibility</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Real-time Tracking</span>
            </div>
            <div className="flex items-center space-x-1">
              <Database className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">Checkpoint Saves</span>
            </div>
            <Badge variant="success" size="sm">
              API Connected
            </Badge>
          </div>
        </div>
        {processing && (
          <div className="mt-2 text-xs text-green-700">
            Progress persisted - safe to refresh page or navigate away | Updates every 30 seconds
          </div>
        )}
      </Card>
    </div>
  )
}

export default BulkProcessor