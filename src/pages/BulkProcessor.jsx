import React, { useState, useEffect, useRef } from 'react'
import { Download, Eye, RefreshCw, Activity, CheckCircle, X, Pause, Upload, BarChart3 } from 'lucide-react'
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
    concurrentRoutes: 2
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

  // Enhanced progress polling
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
    
    // Enhanced + Automatic Visibility processing with minimal options
    formData.append('dataFolderPath', './data')
    formData.append('terrainType', 'mixed')
    formData.append('dataCollectionMode', 'comprehensive')
    formData.append('maxConcurrentRoutes', options.concurrentRoutes.toString())
    formData.append('skipExistingRoutes', 'true')
    formData.append('backgroundProcessing', 'true') // Always use background processing
    
    // Enhanced data collection options (all enabled for Enhanced + Visibility)
    formData.append('includeSharpTurns', 'true')
    formData.append('includeBlindSpots', 'true')
    formData.append('includeNetworkCoverage', 'true')
    formData.append('includeEnhancedRoadConditions', 'true')
    formData.append('includeAccidentData', 'true')
    formData.append('includeSeasonalWeather', 'false')
    formData.append('downloadImages', 'false')
    formData.append('generateReports', 'false')
    
    // Automatic Visibility Analysis Parameters (enabled by default)
    formData.append('enableAutomaticVisibilityAnalysis', 'true')
    formData.append('visibilityAnalysisTimeout', '180000')
    formData.append('continueOnVisibilityFailure', 'true')
    formData.append('visibilityAnalysisMode', 'comprehensive')

    try {
      setProcessing(true)
      setResults(null)
      
      // Generate processing ID for tracking
      const newProcessingId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setProcessingId(newProcessingId)
      
      // Initial progress state
      const initialProgress = {
        status: 'starting',
        currentRoute: 'Initializing Enhanced + Automatic Visibility processing...',
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

      console.log('Starting Enhanced + Automatic Visibility processing with ID:', newProcessingId)

      // Use the enhanced endpoint with visibility analysis
      const response = await apiService.bulkProcessor.processCSVEnhanced(formData)
      console.log('Processing start response:', response)

      if (response.success) {
        // Start polling for progress immediately
        startProgressPolling()
        
        toast.success('Enhanced processing with automatic visibility analysis started!')
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

  const concurrentOptions = [
    { value: 1, label: '1 Route (Safest)' },
    { value: 2, label: '2 Routes (Recommended)' },
    { value: 3, label: '3 Routes' },
    { value: 4, label: '4 Routes' },
    { value: 5, label: '5 Routes (Fastest)' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Bulk Route Processor</h1>
          <p className="text-gray-600">
            Process multiple routes with comprehensive data collection and automatic visibility analysis
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
                  Enhanced + Automatic Visibility Processing Active
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
                Cancel
              </Button>
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
            </div>
            <h3 className="text-xl font-bold mb-2">Enhanced + Automatic Visibility Analysis</h3>
            <p className="text-blue-100">
              Comprehensive data collection with automatic sharp turn and blind spot detection
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
              <p className="font-medium text-green-800">Complete Safety Data</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload & Simple Options */}
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

          {/* Simplified Options - Only Concurrent Routes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Speed</h3>
            <div className="space-y-4">
              <div>
                <Select
                  label="Concurrent Routes (Processing Speed)"
                  options={concurrentOptions}
                  value={options.concurrentRoutes}
                  onChange={(e) => setOptions(prev => ({ ...prev, concurrentRoutes: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Higher concurrency = faster processing (recommended: 2-3 routes)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Always Includes:</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Comprehensive data collection from all available APIs</li>
                  <li>• Automatic sharp turn and blind spot detection</li>
                  <li>• Network coverage and road condition analysis</li>
                  <li>• Emergency services and accident data collection</li>
                  <li>• Real-time progress tracking with live statistics</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Start Processing Button */}
          <Card className="p-6">
            {!processing ? (
              <Button
                variant="primary"
                size="lg"
                icon={Upload}
                onClick={handleStartProcessing}
                disabled={!selectedFile}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Enhanced Processing + Visibility Analysis
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
                  Cancel Processing
                </Button>
                <p className="text-center text-sm text-gray-600">
                  Processing will continue even if you close this page
                </p>
              </div>
            )}
            
            {!processing && selectedFile && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  Estimated time: {Math.ceil(((selectedFile.size || 0) / 1024 / 10) * 4)} minutes
                  <span className="text-blue-600 ml-1">(includes automatic visibility analysis)</span>
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
                <Eye className="mx-auto h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready for Enhanced Processing with Real-time Tracking
              </h3>
              <p className="text-gray-500">
                Upload a CSV file to start processing with comprehensive data collection and automatic visibility analysis. 
                Progress will be tracked in real-time and persisted across page refreshes.
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
              Enhanced Bulk Processor with Automatic Visibility Analysis
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