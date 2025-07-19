import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Activity, Zap, Pause, Play, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import Card from '../UI/Card'
import ProgressBar from '../UI/ProgressBar'
import Badge from '../UI/Badge'
import Button from '../UI/Button'
import { PROCESSING_STATUS } from '../../utils/constants'

const ProcessingProgress = ({ progress, onStop, processingId }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    visibility: true,
    enhanced: true,
    details: false
  })
  
  // Update last update timestamp when progress changes
  useEffect(() => {
    if (progress) {
      setLastUpdate(new Date())
      setConnectionStatus('connected')
    }
  }, [progress])

  // Check for stale updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (progress && progress.status === 'processing') {
        const timeSinceUpdate = Date.now() - lastUpdate.getTime()
        if (timeSinceUpdate > 30000) { // 30 seconds without update
          setConnectionStatus('disconnected')
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [progress, lastUpdate])

  if (!progress) return null

  const { 
    status, 
    currentRoute, 
    totalRoutes, 
    completedRoutes, 
    failedRoutes, 
    estimatedTimeRemaining,
    visibilityAnalysis,
    enhancedDataCollection,
    processingMode,
    dataCollectionMode,
    timestamp
  } = progress

  const getStatusIcon = (status) => {
    switch (status) {
      case PROCESSING_STATUS.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case PROCESSING_STATUS.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />
      case PROCESSING_STATUS.PROCESSING:
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'starting':
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case PROCESSING_STATUS.COMPLETED:
        return <Badge variant="success">Completed</Badge>
      case PROCESSING_STATUS.FAILED:
        return <Badge variant="danger">Failed</Badge>
      case PROCESSING_STATUS.PROCESSING:
        return <Badge variant="primary">Processing</Badge>
      case 'starting':
        return <Badge variant="primary">Starting</Badge>
      default:
        return <Badge variant="warning">Pending</Badge>
    }
  }

  const getVisibilityIcon = (analysisStatus) => {
    switch (analysisStatus) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <Eye className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const progressPercentage = totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0
  const visibilityProgressPercentage = visibilityAnalysis?.attempted > 0 ? 
    (visibilityAnalysis.successful / visibilityAnalysis.attempted) * 100 : 0

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className={`p-3 ${connectionStatus === 'connected' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-800' : 'text-red-800'}`}>
              {connectionStatus === 'connected' ? 'Live Progress Tracking' : 'Connection Lost'}
            </span>
            {processingId && (
              <Badge variant="primary" size="sm">
                ID: {processingId.slice(-8)}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-600">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </Card>

      {/* Main Processing Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleSection('main')}
              className="flex items-center space-x-2"
            >
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Main Processing Progress</h3>
            </button>
            {getStatusBadge(status)}
          </div>
          <div className="flex items-center space-x-2">
            {processingMode && (
              <Badge variant="primary" size="sm">
                {processingMode}
              </Badge>
            )}
            {dataCollectionMode && (
              <Badge variant="success" size="sm">
                {dataCollectionMode}
              </Badge>
            )}
          </div>
        </div>

        {expandedSections.main && (
          <div className="space-y-4">
            <ProgressBar
              value={progressPercentage}
              max={100}
              showLabel={true}
              variant={status === PROCESSING_STATUS.FAILED ? 'danger' : 'primary'}
              className="mb-4"
            />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{completedRoutes}</p>
                <p className="text-sm text-green-700">Completed</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{totalRoutes}</p>
                <p className="text-sm text-blue-700">Total</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{failedRoutes}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>

            {currentRoute && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(status)}
                  <span className="font-medium text-blue-900">Currently Processing</span>
                </div>
                <p className="text-sm text-blue-800">{currentRoute}</p>
              </div>
            )}

            {estimatedTimeRemaining && status === 'processing' && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    Estimated time remaining: {estimatedTimeRemaining}
                  </span>
                </div>
              </div>
            )}

            {status === PROCESSING_STATUS.PROCESSING && onStop && (
              <div className="text-center pt-4 border-t border-gray-200">
                <Button
                  onClick={onStop}
                  variant="outline"
                  size="sm"
                  icon={Pause}
                  className="text-red-600 hover:text-red-800 border-red-300 hover:border-red-400"
                >
                  Stop Processing
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Visibility Analysis Progress */}
      {visibilityAnalysis && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('visibility')}
              className="flex items-center space-x-2"
            >
              <Eye className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Automatic Visibility Analysis</h4>
            </button>
            <div className="flex items-center space-x-2">
              <Badge variant="primary" size="sm" className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Auto Detection</span>
              </Badge>
              <Badge variant="success" size="sm">
                {visibilityAnalysis.successful || 0} / {visibilityAnalysis.attempted || 0}
              </Badge>
            </div>
          </div>

          {expandedSections.visibility && (
            <div className="space-y-4">
              {/* Visibility Progress Bar */}
              {visibilityAnalysis.attempted > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-700">Analysis Progress</span>
                    <span className="text-sm text-blue-600">{Math.round(visibilityProgressPercentage)}%</span>
                  </div>
                  <ProgressBar
                    value={visibilityProgressPercentage}
                    max={100}
                    showLabel={false}
                    variant="primary"
                    className="bg-blue-100"
                  />
                </div>
              )}

              {/* Visibility Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                  <p className="text-lg font-bold text-blue-600">{visibilityAnalysis.attempted || 0}</p>
                  <p className="text-xs text-blue-700">Attempted</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
                  <p className="text-lg font-bold text-green-600">{visibilityAnalysis.successful || 0}</p>
                  <p className="text-xs text-green-700">Successful</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-200 text-center">
                  <p className="text-lg font-bold text-red-600">{visibilityAnalysis.failed || 0}</p>
                  <p className="text-xs text-red-700">Failed</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <p className="text-lg font-bold text-gray-600">{visibilityAnalysis.skipped || 0}</p>
                  <p className="text-xs text-gray-700">Skipped</p>
                </div>
              </div>

              {/* Current Visibility Analysis */}
              {visibilityAnalysis.currentRoute && (
                <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
                  <div className="flex items-center space-x-2 mb-1">
                    {getVisibilityIcon('processing')}
                    <span className="text-sm font-medium text-blue-900">
                      Analyzing Visibility
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">{visibilityAnalysis.currentRoute}</p>
                </div>
              )}

              {/* Visibility Detection Summary */}
              {(visibilityAnalysis.totalSharpTurns > 0 || visibilityAnalysis.totalBlindSpots > 0) && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-3">Real-time Detection Results</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Activity className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Sharp Turns</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {visibilityAnalysis.totalSharpTurns || 0}
                      </p>
                      {visibilityAnalysis.criticalTurns > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {visibilityAnalysis.criticalTurns} critical
                        </p>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Eye className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">Blind Spots</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {visibilityAnalysis.totalBlindSpots || 0}
                      </p>
                      {visibilityAnalysis.criticalBlindSpots > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {visibilityAnalysis.criticalBlindSpots} critical
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Performance */}
              <div className="flex justify-between items-center text-sm bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-700">Mode:</span>
                  <Badge variant="primary" size="sm">
                    {visibilityAnalysis.analysisMode || 'comprehensive'}
                  </Badge>
                </div>
                {visibilityAnalysis.averageAnalysisTime && (
                  <div className="text-blue-600">
                    Avg: {visibilityAnalysis.averageAnalysisTime}ms per route
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Enhanced Data Collection Progress */}
      {enhancedDataCollection && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('enhanced')}
              className="flex items-center space-x-2"
            >
              <Activity className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Enhanced Data Collection</h4>
            </button>
            <Badge variant="success" size="sm">
              {enhancedDataCollection.successful || 0} / {enhancedDataCollection.attempted || 0}
            </Badge>
          </div>

          {expandedSections.enhanced && (
            <div className="space-y-4">
              {/* Data Collection Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
                  <p className="text-lg font-bold text-green-600">
                    {enhancedDataCollection.sharpTurnsCollected || 0}
                  </p>
                  <p className="text-xs text-green-700">Sharp Turns</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-200 text-center">
                  <p className="text-lg font-bold text-red-600">
                    {enhancedDataCollection.blindSpotsCollected || 0}
                  </p>
                  <p className="text-xs text-red-700">Blind Spots</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {enhancedDataCollection.networkCoverageAnalyzed || 0}
                  </p>
                  <p className="text-xs text-blue-700">Network Analysis</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200 text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {enhancedDataCollection.totalRecordsCreated || 0}
                  </p>
                  <p className="text-xs text-purple-700">Total Records</p>
                </div>
              </div>

              {/* Collection Breakdown */}
              {enhancedDataCollection.collectionBreakdown && Object.keys(enhancedDataCollection.collectionBreakdown).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-900 mb-3">Real-time Collection Breakdown</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(enhancedDataCollection.collectionBreakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between bg-white px-3 py-2 rounded border border-green-200 text-sm">
                        <span className="text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-medium text-green-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Performance */}
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-green-700">Success Rate: </span>
                    <Badge variant="success" size="sm">
                      {enhancedDataCollection.attempted > 0 ? 
                        Math.round((enhancedDataCollection.successful / enhancedDataCollection.attempted) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="text-green-600">
                    Records per Route: {enhancedDataCollection.successful > 0 ? 
                      Math.round(enhancedDataCollection.totalRecordsCreated / enhancedDataCollection.successful) : 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Processing Details */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection('details')}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Processing Details</span>
          </div>
          <Badge variant="primary" size="sm">
            {expandedSections.details ? 'Hide' : 'Show'}
          </Badge>
        </button>

        {expandedSections.details && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Processing Mode:</span>
                <p className="font-medium text-gray-900">{processingMode || 'Standard'}</p>
              </div>
              <div>
                <span className="text-gray-600">Data Collection:</span>
                <p className="font-medium text-gray-900">{dataCollectionMode || 'Basic'}</p>
              </div>
              <div>
                <span className="text-gray-600">Session ID:</span>
                <p className="font-medium text-gray-900">{processingId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Started:</span>
                <p className="font-medium text-gray-900">
                  {timestamp ? new Date(timestamp).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Connection Status Details */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Connection Status:</span>
                <div className="flex items-center space-x-2">
                  {connectionStatus === 'connected' ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 text-sm">Live Updates</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-600 text-sm">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Progress updates every 2 seconds • Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Processing Status Indicators */}
      <div className="flex justify-center space-x-6 py-4">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">Enhanced Processing Active</span>
        </div>
        {visibilityAnalysis && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">Auto-Visibility Analysis</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">Real-time Tracking</span>
        </div>
      </div>
    </div>
  )
}

export default ProcessingProgress