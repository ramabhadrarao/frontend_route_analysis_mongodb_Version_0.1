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
      if (progress && (progress.status === 'processing' || progress.status === 'starting')) {
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
    results
  } = progress

  // Simplified status logic
  const getSimplifiedStatus = () => {
    if (status === 'completed') return 'completed'
    if (status === 'failed') return 'failed'
    if (status === 'cancelled') return 'cancelled'
    return 'in_progress' // Covers 'starting', 'processing', etc.
  }

  const simplifiedStatus = getSimplifiedStatus()

  const getStatusDisplay = () => {
    switch (simplifiedStatus) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          badge: <Badge variant="success">✅ Completed</Badge>,
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-800'
        }
      case 'failed':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          badge: <Badge variant="danger">❌ Failed</Badge>,
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800'
        }
      case 'cancelled':
        return {
          icon: <XCircle className="w-5 h-5 text-yellow-500" />,
          badge: <Badge variant="warning">⏹️ Cancelled</Badge>,
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800'
        }
      default:
        return {
          icon: <Clock className="w-5 h-5 text-blue-500 animate-pulse" />,
          badge: <Badge variant="primary">⏳ In Progress</Badge>,
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800'
        }
    }
  }

  const statusDisplay = getStatusDisplay()
  const progressPercentage = totalRoutes > 0 ? Math.round((completedRoutes / totalRoutes) * 100) : 0
  const isCompleted = simplifiedStatus === 'completed'
  const isInProgress = simplifiedStatus === 'in_progress'

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

      {/* Main Processing Status */}
      <Card className={`p-6 ${statusDisplay.color}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {statusDisplay.icon}
            <h3 className={`text-lg font-semibold ${statusDisplay.textColor}`}>
              {isCompleted ? 'Processing Completed Successfully!' : 
               isInProgress ? 'Enhanced Processing in Progress' : 
               'Processing Status'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {statusDisplay.badge}
            {processingMode && (
              <Badge variant="primary" size="sm">
                {processingMode === 'enhancedWithVisibility' ? 'Enhanced + Visibility' : processingMode}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar - Only show for in-progress */}
        {isInProgress && (
          <div className="mb-4">
            <ProgressBar
              value={progressPercentage}
              max={100}
              showLabel={true}
              variant="primary"
              className="mb-2"
            />
            <div className="text-center text-sm text-gray-600">
              {progressPercentage}% Complete ({completedRoutes} of {totalRoutes} routes)
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className={`text-center p-4 rounded-lg ${isCompleted ? 'bg-white border border-green-200' : 'bg-white border border-gray-200'}`}>
            <p className="text-2xl font-bold text-green-600">{completedRoutes || 0}</p>
            <p className="text-sm text-green-700">✅ Completed</p>
          </div>
          <div className={`text-center p-4 rounded-lg ${isCompleted ? 'bg-white border border-blue-200' : 'bg-white border border-gray-200'}`}>
            <p className="text-2xl font-bold text-blue-600">{totalRoutes || 0}</p>
            <p className="text-sm text-blue-700">📊 Total</p>
          </div>
          <div className={`text-center p-4 rounded-lg ${isCompleted ? 'bg-white border border-red-200' : 'bg-white border border-gray-200'}`}>
            <p className="text-2xl font-bold text-red-600">{failedRoutes || 0}</p>
            <p className="text-sm text-red-700">❌ Failed</p>
          </div>
        </div>

        {/* Current Status Message */}
        {currentRoute && isInProgress && (
          <div className="bg-blue-100 p-4 rounded-lg border border-blue-300 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="font-medium text-blue-900">Currently Processing</span>
            </div>
            <p className="text-sm text-blue-800">{currentRoute}</p>
            {estimatedTimeRemaining && (
              <p className="text-xs text-blue-600 mt-1">⏰ {estimatedTimeRemaining}</p>
            )}
          </div>
        )}

        {/* Completion Message */}
        {isCompleted && (
          <div className="bg-green-100 p-4 rounded-lg border border-green-300 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Processing Complete!</span>
            </div>
            <p className="text-sm text-green-800">
              All routes have been processed successfully. You can now view them in the Routes page.
            </p>
          </div>
        )}

        {/* Control Buttons */}
        {isInProgress && onStop && (
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

        {isCompleted && (
          <div className="text-center pt-4 border-t border-gray-200">
            <Button
              onClick={() => window.location.href = '/routes'}
              variant="primary"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              View Completed Routes
            </Button>
          </div>
        )}
      </Card>

      {/* Enhanced Results Summary - Only show when completed */}
      {isCompleted && (visibilityAnalysis || enhancedDataCollection) && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Processing Results Summary
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visibility Analysis Results */}
            {visibilityAnalysis && visibilityAnalysis.successful > 0 && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-blue-600" />
                  Automatic Visibility Analysis
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Routes Analyzed:</span>
                    <span className="font-medium text-blue-600">{visibilityAnalysis.successful}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">🔄 Sharp Turns Found:</span>
                    <span className="font-medium text-orange-600">{visibilityAnalysis.totalSharpTurns || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">👁️ Blind Spots Found:</span>
                    <span className="font-medium text-red-600">{visibilityAnalysis.totalBlindSpots || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">⚠️ Critical Issues:</span>
                    <span className="font-medium text-red-600">
                      {(visibilityAnalysis.criticalTurns || 0) + (visibilityAnalysis.criticalBlindSpots || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Data Collection Results */}
            {enhancedDataCollection && enhancedDataCollection.successful > 0 && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-green-600" />
                  Enhanced Data Collection
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Routes Enhanced:</span>
                    <span className="font-medium text-green-600">{enhancedDataCollection.successful}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">📊 Total Records:</span>
                    <span className="font-medium text-purple-600">{enhancedDataCollection.totalRecordsCreated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">🏥 Emergency Services:</span>
                    <span className="font-medium text-blue-600">{enhancedDataCollection.collectionBreakdown?.emergencyServices || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">🛣️ Road Conditions:</span>
                    <span className="font-medium text-indigo-600">{enhancedDataCollection.collectionBreakdown?.roadConditions || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => window.location.href = '/routes'}
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                📋 View All Routes
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                icon={RefreshCw}
              >
                🔄 Process More Routes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Processing Status Indicators */}
      <div className="flex justify-center space-x-6 py-4">
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${isInProgress ? 'bg-blue-500 animate-pulse' : isCompleted ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-gray-600">
            {isCompleted ? 'Completed Successfully' : isInProgress ? 'Processing Active' : 'Ready'}
          </span>
        </div>
        {visibilityAnalysis?.successful > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Visibility Analysis</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Real-time Tracking</span>
        </div>
      </div>
    </div>
  )
}

export default ProcessingProgress