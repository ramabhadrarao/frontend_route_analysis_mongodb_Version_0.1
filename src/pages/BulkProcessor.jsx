import React, { useState, useEffect, useRef } from 'react'
import { Download, FileText, Play, RefreshCw, Eye, Zap, Activity, AlertTriangle, CheckCircle, X, Pause } from 'lucide-react'
import { apiService } from '../services/apiService'
import { generateCSVTemplate } from '../utils/helpers'
import { DATA_COLLECTION_OPTIONS } from '../utils/constants'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import Toggle from '../components/UI/Toggle'
import Select from '../components/UI/Select'
import FileUpload from '../components/BulkProcessor/FileUpload'
import ProcessingOptions from '../components/BulkProcessor/ProcessingOptions'
import ProcessingProgress from '../components/BulkProcessor/ProcessingProgress'
import ResultsViewer from '../components/BulkProcessor/ResultsViewer'
import toast from 'react-hot-toast'

const BulkProcessor = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [processingId, setProcessingId] = useState(null) // Track processing session
  const [options, setOptions] = useState({
    mode: 'enhancedWithVisibility',
    concurrentRoutes: 2,
    backgroundProcessing: false, // Change default to false for better tracking
    dataCollectionMode: 'comprehensive',
    skipExistingRoutes: true,
    
    // Original enhanced options
    [DATA_COLLECTION_OPTIONS.SHARP_TURNS]: true,
    [DATA_COLLECTION_OPTIONS.BLIND_SPOTS]: true,
    [DATA_COLLECTION_OPTIONS.NETWORK_COVERAGE]: true,
    [DATA_COLLECTION_OPTIONS.ROAD_CONDITIONS]: true,
    [DATA_COLLECTION_OPTIONS.ACCIDENT_DATA]: true,
    [DATA_COLLECTION_OPTIONS.SEASONAL_WEATHER]: false,
    [DATA_COLLECTION_OPTIONS.EMERGENCY_SERVICES]: true,
    [DATA_COLLECTION_OPTIONS.TRAFFIC_DATA]: true,
    
    // Automatic Visibility Analysis Options
    enableAutomaticVisibilityAnalysis: true,
    visibilityAnalysisMode: 'comprehensive',
    visibilityAnalysisTimeout: 180000,
    continueOnVisibilityFailure: true,
    downloadImages: false,
    generateReports: false
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
        // Only restore if it's recent (within 24 hours)
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
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
      
      // Start polling immediately
      startProgressPolling()
      
      toast.info('Resuming bulk processing status tracking...')
    }
  }

  // Start progress polling
  const startProgressPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    console.log('Starting progress polling...')
    
    pollIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        clearInterval(pollIntervalRef.current)
        return
      }

      try {
        await pollProgress()
      } catch (error) {
        console.error('Progress polling error:', error)
        // Don't stop polling on single error, just log it
      }
    }, 2000) // Poll every 2 seconds
  }

  // Stop progress polling
  const stopProgressPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  // Enhanced progress polling with better error handling
  const pollProgress = async () => {
    try {
      console.log('Polling progress from API...')
      const response = await apiService.bulkProcessor.getStatus()
      
      console.log('Progress poll response:', response)
      
      if (!mountedRef.current) return

      // Update progress state
      const newProgress = {
        status: response.status || 'processing',
        currentRoute: response.currentRoute || 'Processing...',
        totalRoutes: response.totalRoutes || 0,
        completedRoutes: response.completedRoutes || 0,
        failedRoutes: response.failedRoutes || 0,
        estimatedTimeRemaining: response.estimatedTimeRemaining || 'Calculating...',
        
        // Enhanced progress data
        visibilityAnalysis: response.visibilityAnalysis || {
          attempted: 0,
          successful: 0,
          failed: 0,
          currentRoute: null,
          totalSharpTurns: 0,
          totalBlindSpots: 0,
          criticalTurns: 0,
          criticalBlindSpots: 0
        },
        
        enhancedDataCollection: response.enhancedDataCollection || {
          attempted: 0,
          successful: 0,
          failed: 0,
          sharpTurnsCollected: 0,
          blindSpotsCollected: 0,
          networkCoverageAnalyzed: 0,
          roadConditionsAnalyzed: 0,
          accidentDataCollected: 0,
          seasonalWeatherCollected: 0,
          totalRecordsCreated: 0,
          collectionBreakdown: {}
        },
        
        // Processing details
        processingMode: response.processingMode || options.mode,
        dataCollectionMode: response.dataCollectionMode || options.dataCollectionMode,
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
        toast.error('Server error while checking progress. Retrying...')
      } else {
        // Other errors, show message but continue polling
        console.warn('Progress check failed, will retry:', error.message)
      }
    }
  }

  // Handle processing completion
  const handleProcessingComplete = (response) => {
    setProcessing(false)
    stopProgressPolling()
    clearProcessingState()

    if (response && response.results) {
      setResults(response.results)
      
      // Show completion message with stats
      const stats = response.results
      if (stats.enhancedDataCollectionStats) {
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
    
    toast.info('Processing was cancelled')
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setResults(null)
    // Clear any previous processing state when new file is selected
    clearProcessingState()
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
    
    // Add all parameters as expected by the backend API
    formData.append('dataFolderPath', './data')
    formData.append('terrainType', 'mixed')
    formData.append('dataCollectionMode', options.dataCollectionMode || 'comprehensive')
    formData.append('maxConcurrentRoutes', options.concurrentRoutes.toString())
    formData.append('skipExistingRoutes', 'true')
    formData.append('backgroundProcessing', options.backgroundProcessing.toString())
    
    // Original enhanced options
    formData.append('includeSharpTurns', options[DATA_COLLECTION_OPTIONS.SHARP_TURNS].toString())
    formData.append('includeBlindSpots', options[DATA_COLLECTION_OPTIONS.BLIND_SPOTS].toString())
    formData.append('includeNetworkCoverage', options[DATA_COLLECTION_OPTIONS.NETWORK_COVERAGE].toString())
    formData.append('includeEnhancedRoadConditions', options[DATA_COLLECTION_OPTIONS.ROAD_CONDITIONS].toString())
    formData.append('includeAccidentData', options[DATA_COLLECTION_OPTIONS.ACCIDENT_DATA].toString())
    formData.append('includeSeasonalWeather', options[DATA_COLLECTION_OPTIONS.SEASONAL_WEATHER].toString())
    formData.append('downloadImages', options.downloadImages.toString())
    formData.append('generateReports', options.generateReports.toString())
    
    // Automatic Visibility Analysis Parameters
    formData.append('enableAutomaticVisibilityAnalysis', options.enableAutomaticVisibilityAnalysis.toString())
    formData.append('visibilityAnalysisTimeout', options.visibilityAnalysisTimeout.toString())
    formData.append('continueOnVisibilityFailure', options.continueOnVisibilityFailure.toString())
    formData.append('visibilityAnalysisMode', options.visibilityAnalysisMode)

    try {
      setProcessing(true)
      setResults(null)
      
      // Generate processing ID for tracking
      const newProcessingId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setProcessingId(newProcessingId)
      
      // Initial progress state
      const initialProgress = {
        status: 'starting',
        currentRoute: 'Initializing enhanced processing with visibility analysis...',
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
        processingMode: options.mode,
        dataCollectionMode: options.dataCollectionMode,
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

      console.log('Starting enhanced processing with ID:', newProcessingId)

      // Use the enhanced endpoint with visibility analysis
      const response = await apiService.bulkProcessor.processCSVEnhanced(formData)
      console.log('Processing start response:', response)

      if (response.success) {
        // Start polling for progress immediately
        startProgressPolling()
        
        const message = options.enableAutomaticVisibilityAnalysis 
          ? 'Enhanced processing with automatic visibility analysis started!'
          : 'Enhanced processing started successfully!'
        
        toast.success(message)
        
        // If background processing is disabled, the response might contain immediate results
        if (!options.backgroundProcessing && response.data) {
          // Handle immediate completion for foreground processing
          setTimeout(() => {
            handleProcessingComplete({ results: response.data })
          }, 1000)
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
        toast.info('Stopped tracking processing progress')
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
      
      toast.info('Processing tracking stopped')
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
        visibilityAnalyzed: route.visibilityAnalysisSuccessful || false
      })) || []

      if (csvData.length > 0) {
        const headers = Object.keys(csvData[0]).join(',')
        const rows = csvData.map(row => Object.values(row).join(','))
        const csv = [headers, ...rows].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `processing_results_with_visibility_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Results with visibility analysis downloaded!')
      } else {
        toast.error('No results available to download')
      }
    }
  }

  const handleViewDetails = (routeId) => {
    window.open(`/routes/${routeId}`, '_blank')
  }

  // Processing mode options
  const processingModes = [
    { 
      value: 'basic', 
      label: 'Basic Processing',
      description: 'Standard route processing with basic data collection',
      estimatedTime: '1-2 min per route',
      features: ['GPS Analysis', 'Basic Risk Assessment']
    },
    { 
      value: 'enhanced', 
      label: 'Enhanced Processing',
      description: 'Comprehensive data collection without visibility analysis',
      estimatedTime: '2-3 min per route',
      features: ['All Basic Features', 'Emergency Services', 'Weather Data', 'Traffic Analysis', 'Road Conditions']
    },
    { 
      value: 'enhancedWithVisibility', 
      label: 'Enhanced + Automatic Visibility',
      description: 'Enhanced processing with automatic sharp turn and blind spot analysis',
      estimatedTime: '3-4 min per route',
      features: ['All Enhanced Features', 'Automatic Sharp Turn Detection', 'Blind Spot Analysis', 'Critical Risk Identification'],
      recommended: true
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Bulk Route Processor</h1>
          <p className="text-gray-600">
            Upload and process multiple routes with comprehensive risk analysis and real-time progress tracking
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
                  Live Processing Active
                </span>
              </div>
              {progress && (
                <Badge variant="primary" className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>{progress.completedRoutes}/{progress.totalRoutes}</span>
                </Badge>
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
                Stop Tracking
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Processing Mode Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {processingModes.map((mode) => (
            <div
              key={mode.value}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                options.mode === mode.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !processing && setOptions(prev => ({ ...prev, mode: mode.value }))}
            >
              {mode.recommended && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="primary" className="text-xs">Recommended</Badge>
                </div>
              )}
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-4 h-4 rounded-full ${
                  options.mode === mode.value ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <h4 className="font-medium text-gray-900">{mode.label}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">{mode.description}</p>
              <p className="text-xs text-gray-500 mb-2">⏱️ {mode.estimatedTime}</p>
              <div className="space-y-1">
                {mode.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload & Options */}
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

          {/* Enhanced Processing Options */}
          <ProcessingOptions
            options={options}
            onUpdateOptions={setOptions}
            disabled={processing}
          />

          {/* Start Processing Button */}
          <Card className="p-6">
            {!processing ? (
              <Button
                variant="primary"
                size="lg"
                icon={options.enableAutomaticVisibilityAnalysis ? Eye : Play}
                onClick={handleStartProcessing}
                disabled={!selectedFile}
                className="w-full"
              >
                {options.enableAutomaticVisibilityAnalysis
                  ? 'Start Enhanced Processing + Visibility Analysis'
                  : 'Start Enhanced Processing'
                }
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  icon={Pause}
                  onClick={handleStopProcessing}
                  className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  Stop Processing
                </Button>
                <p className="text-center text-sm text-gray-600">
                  Processing will continue even if you close this page
                </p>
              </div>
            )}
            
            {options.enableAutomaticVisibilityAnalysis && !processing && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  Estimated time: {selectedFile ? Math.ceil(((selectedFile.size || 0) / 1024 / 10) * 4) : 0} minutes
                  <span className="text-blue-600 ml-1">(includes visibility analysis)</span>
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
                {options.enableAutomaticVisibilityAnalysis ? (
                  <Eye className="mx-auto h-12 w-12 text-blue-400" />
                ) : (
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {options.enableAutomaticVisibilityAnalysis 
                  ? 'Ready for Enhanced Processing with Real-time Tracking'
                  : 'Ready to Process'
                }
              </h3>
              <p className="text-gray-500">
                {options.enableAutomaticVisibilityAnalysis
                  ? 'Upload a CSV file and start processing. Progress will be tracked in real-time and persisted across page refreshes.'
                  : 'Upload a CSV file and configure your processing options to get started'
                }
              </p>
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
              Enhanced Bulk Processor with Real-time Progress Tracking
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {options.enableAutomaticVisibilityAnalysis && (
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Auto-Visibility</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Real-time Tracking</span>
            </div>
            <Badge variant="success" size="sm">
              API Connected
            </Badge>
          </div>
        </div>
        {processing && (
          <div className="mt-2 text-xs text-green-700">
            Progress persisted - you can safely refresh the page or navigate away
          </div>
        )}
      </Card>
    </div>
  )
}

export default BulkProcessor