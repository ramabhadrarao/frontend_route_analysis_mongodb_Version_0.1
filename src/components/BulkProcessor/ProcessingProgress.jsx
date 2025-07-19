import React from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Activity, Zap } from 'lucide-react'
import Card from '../UI/Card'
import ProgressBar from '../UI/ProgressBar'
import Badge from '../UI/Badge'
import { PROCESSING_STATUS } from '../../utils/constants'

const ProcessingProgress = ({ progress, onStop }) => {
  const { 
    status, 
    currentRoute, 
    totalRoutes, 
    completedRoutes, 
    failedRoutes, 
    estimatedTimeRemaining,
    // NEW: Visibility analysis progress
    visibilityAnalysis,
    enhancedDataCollection
  } = progress

  const getStatusIcon = (status) => {
    switch (status) {
      case PROCESSING_STATUS.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case PROCESSING_STATUS.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />
      case PROCESSING_STATUS.PROCESSING:
        return <Clock className="w-5 h-5 text-blue-500" />
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

  return (
    <div className="space-y-4">
      {/* Main Processing Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Processing Progress
          </h3>
          {getStatusBadge(status)}
        </div>

        <div className="space-y-4">
          <ProgressBar
            value={progressPercentage}
            max={100}
            showLabel={true}
            variant={status === PROCESSING_STATUS.FAILED ? 'danger' : 'primary'}
          />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedRoutes}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{failedRoutes}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
          </div>

          {currentRoute && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(status)}
                <span className="font-medium text-gray-900">Currently Processing</span>
              </div>
              <p className="text-sm text-gray-700">{currentRoute}</p>
            </div>
          )}

          {estimatedTimeRemaining && (
            <div className="text-center text-sm text-gray-500">
              Estimated time remaining: {estimatedTimeRemaining}
            </div>
          )}

          {status === PROCESSING_STATUS.PROCESSING && (
            <div className="text-center">
              <button
                onClick={onStop}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Stop Processing
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* NEW: Visibility Analysis Progress */}
      {visibilityAnalysis && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-blue-900 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Automatic Visibility Analysis
            </h4>
            <Badge variant="primary" size="sm" className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Auto Detection</span>
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Visibility Progress Bar */}
            {visibilityAnalysis.attempted > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-blue-700">Visibility Analysis Progress</span>
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

            {/* Visibility Statistics */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-lg font-bold text-blue-600">{visibilityAnalysis.attempted || 0}</p>
                <p className="text-xs text-blue-700">Attempted</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-lg font-bold text-green-600">{visibilityAnalysis.successful || 0}</p>
                <p className="text-xs text-green-700">Successful</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-lg font-bold text-red-600">{visibilityAnalysis.failed || 0}</p>
                <p className="text-xs text-red-700">Failed</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-lg font-bold text-gray-600">{visibilityAnalysis.skipped || 0}</p>
                <p className="text-xs text-gray-700">Skipped</p>
              </div>
            </div>

            {/* Current Visibility Analysis */}
            {visibilityAnalysis.currentRoute && (
              <div className="bg-blue-100 p-3 rounded-lg">
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
                <h5 className="font-medium text-gray-900 mb-2">Detection Summary</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Sharp Turns</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600">
                      {visibilityAnalysis.totalSharpTurns || 0}
                    </p>
                    {visibilityAnalysis.criticalTurns > 0 && (
                      <p className="text-xs text-red-600">
                        {visibilityAnalysis.criticalTurns} critical
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Eye className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-700">Blind Spots</span>
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      {visibilityAnalysis.totalBlindSpots || 0}
                    </p>
                    {visibilityAnalysis.criticalBlindSpots > 0 && (
                      <p className="text-xs text-red-600">
                        {visibilityAnalysis.criticalBlindSpots} critical
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Mode and Performance */}
            <div className="flex justify-between items-center text-sm">
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
        </Card>
      )}

      {/* Enhanced Data Collection Progress */}
      {enhancedDataCollection && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-green-900 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Enhanced Data Collection
            </h4>
            <Badge variant="success" size="sm">
              {enhancedDataCollection.successful || 0} / {enhancedDataCollection.attempted || 0}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-lg font-bold text-green-600">
                {enhancedDataCollection.sharpTurnsCollected || 0}
              </p>
              <p className="text-xs text-green-700">Sharp Turns</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <p className="text-lg font-bold text-red-600">
                {enhancedDataCollection.blindSpotsCollected || 0}
              </p>
              <p className="text-xs text-red-700">Blind Spots</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-lg font-bold text-blue-600">
                {enhancedDataCollection.networkCoverageAnalyzed || 0}
              </p>
              <p className="text-xs text-blue-700">Network Analysis</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-lg font-bold text-purple-600">
                {enhancedDataCollection.totalRecordsCreated || 0}
              </p>
              <p className="text-xs text-purple-700">Total Records</p>
            </div>
          </div>

          {enhancedDataCollection.collectionBreakdown && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-green-900 mb-2">Collection Breakdown</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(enhancedDataCollection.collectionBreakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between bg-white px-2 py-1 rounded border border-green-200">
                    <span className="text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-medium text-green-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Processing Status Indicators */}
      <div className="flex justify-center space-x-4">
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
      </div>
    </div>
  )
}

export default ProcessingProgress