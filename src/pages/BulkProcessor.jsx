import React, { useState } from 'react'
import { Download, FileText, Play, RefreshCw, Eye, Zap, Activity, AlertTriangle, CheckCircle } from 'lucide-react'
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
  const [options, setOptions] = useState({
    mode: 'enhancedWithVisibility', // New default mode
    concurrentRoutes: 2, // Reduced for visibility analysis
    backgroundProcessing: true,
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
    
    // NEW: Automatic Visibility Analysis Options
    enableAutomaticVisibilityAnalysis: true,
    visibilityAnalysisMode: 'comprehensive',
    visibilityAnalysisTimeout: 180000, // 3 minutes
    continueOnVisibilityFailure: true,
    downloadImages: false,
    generateReports: false
  })

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setResults(null)
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
    
    // Add all parameters as expected by the new backend API
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
    
    // NEW: Automatic Visibility Analysis Parameters
    formData.append('enableAutomaticVisibilityAnalysis', options.enableAutomaticVisibilityAnalysis.toString())
    formData.append('visibilityAnalysisTimeout', options.visibilityAnalysisTimeout.toString())
    formData.append('continueOnVisibilityFailure', options.continueOnVisibilityFailure.toString())
    formData.append('visibilityAnalysisMode', options.visibilityAnalysisMode)

    try {
      setProcessing(true)
      setProgress({
        status: 'processing',
        currentRoute: 'Initializing enhanced processing with visibility analysis...',
        totalRoutes: 0,
        completedRoutes: 0,
        failedRoutes: 0,
        estimatedTimeRemaining: 'Calculating... (includes visibility analysis)',
        // NEW: Visibility analysis progress tracking
        visibilityAnalysis: {
          attempted: 0,
          successful: 0,
          failed: 0,
          currentRoute: null
        }
      })

      // Use the enhanced endpoint with visibility analysis
      const response = await apiService.bulkProcessor.processCSVEnhanced(formData)

      if (response.success) {
        // Start polling for progress
        pollProgress()
        
        if (options.enableAutomaticVisibilityAnalysis) {
          toast.success('Enhanced processing with automatic visibility analysis started!')
        } else {
          toast.success('Enhanced processing started successfully!')
        }
      } else {
        throw new Error(response.message || 'Processing failed')
      }
    } catch (error) {
      console.error('Processing error:', error)
      toast.error(error.message || 'Failed to start processing')
      setProcessing(false)
      setProgress(null)
    }
  }

  const pollProgress = async () => {
    try {
      const response = await apiService.bulkProcessor.getStatus()
      
      // For background processing, we don't get real-time status
      if (options.backgroundProcessing) {
        setProcessing(false)
        setProgress(null)
        
        if (options.enableAutomaticVisibilityAnalysis) {
          toast.success('Background processing with visibility analysis started! Results will be saved when complete.')
        } else {
          toast.success('Background processing started! Results will be saved when complete.')
        }
        return
      }
      
      setProgress(response)

      if (response.status === 'completed') {
        setProcessing(false)
        setResults(response.results)
        
        // Show completion message with visibility analysis info
        if (response.results?.visibilityAnalysisResults) {
          const visResults = response.results.visibilityAnalysisResults
          toast.success(
            `Processing completed! Found ${visResults.totalSharpTurns} sharp turns and ${visResults.totalBlindSpots} blind spots.`
          )
        } else {
          toast.success('Processing completed successfully!')
        }
      } else if (response.status === 'failed') {
        setProcessing(false)
        toast.error('Processing failed')
      } else {
        // Continue polling for foreground processing
        setTimeout(pollProgress, 2000)
      }
    } catch (error) {
      console.error('Status poll error:', error)
      setTimeout(pollProgress, 5000) // Retry after 5 seconds
    }
  }

  const handleStopProcessing = () => {
    setProcessing(false)
    setProgress(null)
    toast.success('Processing stopped')
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
      const csvData = results.routes.map(route => ({
        routeName: route.routeName,
        totalDistance: route.totalDistance,
        riskScore: route.riskScore,
        riskLevel: route.riskLevel,
        status: route.status,
        // NEW: Add visibility analysis data to export
        sharpTurns: route.visibilityData?.sharpTurns || 0,
        blindSpots: route.visibilityData?.blindSpots || 0,
        criticalTurns: route.visibilityData?.criticalTurns || 0,
        criticalBlindSpots: route.visibilityData?.criticalBlindSpots || 0,
        visibilityAnalyzed: route.visibilityAnalysisSuccessful || false
      }))

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
    }
  }

  const handleViewDetails = (routeId) => {
    window.open(`/routes/${routeId}`, '_blank')
  }

  // Processing mode options with new visibility analysis mode
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

  const visibilityAnalysisModes = [
    { value: 'basic', label: 'Basic Analysis', description: 'Standard sharp turn and blind spot detection' },
    { value: 'comprehensive', label: 'Comprehensive Analysis', description: 'Advanced analysis with elevation and curve data' },
    { value: 'detailed', label: 'Detailed Analysis', description: 'Complete analysis with obstruction and intersection data' }
  ]

  const dataCollectionModes = [
    { value: 'basic', label: 'Basic Collection', description: 'Essential data only' },
    { value: 'comprehensive', label: 'Comprehensive Collection', description: 'Most safety data (recommended)' },
    { value: 'complete', label: 'Complete Collection', description: 'All available data (slower)' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Bulk Route Processor</h1>
          <p className="text-gray-600">Upload and process multiple routes with comprehensive risk analysis and automatic visibility detection</p>
        </div>
        <Button
          variant="outline"
          icon={Download}
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
      </div>

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
              }`}
              onClick={() => setOptions(prev => ({ ...prev, mode: mode.value }))}
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
            />
          </Card>

          {/* Enhanced Processing Options */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Processing Configuration
            </h3>
            
            <div className="space-y-6">
              {/* Concurrent Routes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concurrent Routes
                </label>
                <Select
                  options={[
                    { value: 1, label: '1 Route (Safest)' },
                    { value: 2, label: '2 Routes (Recommended for Visibility)' },
                    { value: 3, label: '3 Routes' },
                    { value: 4, label: '4 Routes' },
                    { value: 5, label: '5 Routes (Fastest)' }
                  ]}
                  value={options.concurrentRoutes}
                  onChange={(e) => setOptions(prev => ({ ...prev, concurrentRoutes: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {options.enableAutomaticVisibilityAnalysis 
                    ? 'Lower values recommended for visibility analysis to avoid API rate limits'
                    : 'Number of routes to process simultaneously'
                  }
                </p>
              </div>

              {/* Data Collection Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Collection Intensity
                </label>
                <Select
                  options={dataCollectionModes}
                  value={options.dataCollectionMode}
                  onChange={(e) => setOptions(prev => ({ ...prev, dataCollectionMode: e.target.value }))}
                />
              </div>

              {/* Background Processing */}
              <Toggle
                checked={options.backgroundProcessing}
                onChange={(value) => setOptions(prev => ({ ...prev, backgroundProcessing: value }))}
                label="Background Processing"
                description="Continue processing in the background for large batches"
              />
            </div>
          </Card>

          {/* NEW: Automatic Visibility Analysis Options */}
          {(options.mode === 'enhanced' || options.mode === 'enhancedWithVisibility') && (
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Automatic Visibility Analysis
                <Badge variant="primary" className="ml-2 text-xs">NEW</Badge>
              </h3>
              
              <div className="space-y-4">
                <Toggle
                  checked={options.enableAutomaticVisibilityAnalysis}
                  onChange={(value) => setOptions(prev => ({ 
                    ...prev, 
                    enableAutomaticVisibilityAnalysis: value,
                    mode: value ? 'enhancedWithVisibility' : 'enhanced'
                  }))}
                  label="Enable Automatic Visibility Analysis"
                  description="Automatically detect sharp turns and blind spots for each route"
                />

                {options.enableAutomaticVisibilityAnalysis && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Analysis Mode
                      </label>
                      <Select
                        options={visibilityAnalysisModes}
                        value={options.visibilityAnalysisMode}
                        onChange={(e) => setOptions(prev => ({ ...prev, visibilityAnalysisMode: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Analysis Timeout (per route)
                      </label>
                      <Select
                        options={[
                          { value: 60000, label: '1 minute (Fast)' },
                          { value: 120000, label: '2 minutes (Balanced)' },
                          { value: 180000, label: '3 minutes (Thorough)' },
                          { value: 300000, label: '5 minutes (Maximum)' }
                        ]}
                        value={options.visibilityAnalysisTimeout}
                        onChange={(e) => setOptions(prev => ({ ...prev, visibilityAnalysisTimeout: parseInt(e.target.value) }))}
                      />
                    </div>

                    <Toggle
                      checked={options.continueOnVisibilityFailure}
                      onChange={(value) => setOptions(prev => ({ ...prev, continueOnVisibilityFailure: value }))}
                      label="Continue on Visibility Analysis Failure"
                      description="Don't fail entire batch if visibility analysis fails for some routes"
                    />

                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Automatic Detection Features:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Sharp turn angle analysis</li>
                            <li>Blind spot visibility detection</li>
                            <li>Critical risk identification</li>
                            <li>Real-time processing per route</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Enhanced Data Collection Options */}
          <ProcessingOptions
            options={options}
            onUpdateOptions={setOptions}
          />

          {/* Start Processing Button */}
          <Card className="p-6">
            <Button
              variant="primary"
              size="lg"
              icon={options.enableAutomaticVisibilityAnalysis ? Eye : Play}
              onClick={handleStartProcessing}
              disabled={!selectedFile || processing}
              loading={processing}
              className="w-full"
            >
              {processing 
                ? options.enableAutomaticVisibilityAnalysis 
                  ? 'Processing with Visibility Analysis...' 
                  : 'Processing...'
                : options.enableAutomaticVisibilityAnalysis
                  ? 'Start Enhanced Processing + Visibility Analysis'
                  : 'Start Enhanced Processing'
              }
            </Button>
            
            {options.enableAutomaticVisibilityAnalysis && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  Estimated time: {Math.ceil(((selectedFile?.size || 0) / 1024 / 10) * 4)} minutes
                  <span className="text-blue-600 ml-1">(includes visibility analysis)</span>
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Progress & Results */}
        <div className="space-y-6">
          {progress && (
            <div className="space-y-4">
              <ProcessingProgress
                progress={progress}
                onStop={handleStopProcessing}
              />
              
              {/* NEW: Visibility Analysis Progress */}
              {progress.visibilityAnalysis && options.enableAutomaticVisibilityAnalysis && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Visibility Analysis Progress
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{progress.visibilityAnalysis.attempted}</p>
                      <p className="text-xs text-blue-700">Attempted</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{progress.visibilityAnalysis.successful}</p>
                      <p className="text-xs text-green-700">Successful</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">{progress.visibilityAnalysis.failed}</p>
                      <p className="text-xs text-red-700">Failed</p>
                    </div>
                  </div>
                  {progress.visibilityAnalysis.currentRoute && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-blue-700">
                        Currently analyzing: {progress.visibilityAnalysis.currentRoute}
                      </p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <ResultsViewer
                results={results}
                onDownload={handleDownloadResults}
                onViewDetails={handleViewDetails}
              />
              
              {/* NEW: Visibility Analysis Results Summary */}
              {results.visibilityAnalysisResults && (
                <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-green-600" />
                    Visibility Analysis Results
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {results.visibilityAnalysisResults.routesAnalyzed}
                      </p>
                      <p className="text-sm text-gray-600">Routes Analyzed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {results.visibilityAnalysisResults.totalSharpTurns}
                      </p>
                      <p className="text-sm text-gray-600">Sharp Turns</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {results.visibilityAnalysisResults.totalBlindSpots}
                      </p>
                      <p className="text-sm text-gray-600">Blind Spots</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {results.visibilityAnalysisResults.criticalTurns + results.visibilityAnalysisResults.criticalBlindSpots}
                      </p>
                      <p className="text-sm text-gray-600">Critical Issues</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant="success" className="mr-2">
                      {results.visibilityAnalysisResults.successRate}% Success Rate
                    </Badge>
                    <Badge variant="primary">
                      Mode: {results.visibilityAnalysisResults.analysisMode}
                    </Badge>
                  </div>
                </Card>
              )}
            </div>
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
                  ? 'Ready for Enhanced Processing with Visibility Analysis'
                  : 'Ready to Process'
                }
              </h3>
              <p className="text-gray-500">
                {options.enableAutomaticVisibilityAnalysis
                  ? 'Upload a CSV file and configure your options to start comprehensive route analysis with automatic sharp turn and blind spot detection'
                  : 'Upload a CSV file and configure your processing options to get started'
                }
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Status and Help Information */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-blue-800 font-medium">
              Enhanced Bulk Processor with Automatic Visibility Analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {options.enableAutomaticVisibilityAnalysis && (
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Auto-Visibility Enabled</span>
              </div>
            )}
            <Badge variant="primary" size="sm">
              API Connected
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default BulkProcessor