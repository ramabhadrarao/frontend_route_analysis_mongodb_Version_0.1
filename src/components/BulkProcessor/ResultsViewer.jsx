import React, { useState } from 'react'
import { Download, Eye, FileText, AlertTriangle, Activity, Zap, BarChart3, CheckCircle, XCircle } from 'lucide-react'
import Card from '../UI/Card'
import Button from '../UI/Button'
import Badge from '../UI/Badge'
import { formatDate, formatDistance, getRiskLevel } from '../../utils/helpers'

const ResultsViewer = ({ results, onDownload, onViewDetails }) => {
  const [activeTab, setActiveTab] = useState('summary')
  
  const { 
    summary, 
    routes, 
    errors,
    // NEW: Enhanced results data
    enhancedDataCollectionStats,
    visibilityAnalysisStats,
    enhancedMongodbCollectionsSummary,
    nextSteps
  } = results

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'routes', label: 'Routes', icon: FileText },
    { id: 'visibility', label: 'Visibility Analysis', icon: Eye },
    { id: 'enhanced', label: 'Enhanced Data', icon: Activity },
    { id: 'errors', label: 'Issues', icon: AlertTriangle }
  ]

  const getVisibilityBadge = (route) => {
    if (route.visibilityAnalysisSuccessful) {
      return <Badge variant="success" size="sm">Analyzed</Badge>
    } else if (route.visibilityAnalysisAttempted) {
      return <Badge variant="danger" size="sm">Failed</Badge>
    } else {
      return <Badge variant="warning" size="sm">Skipped</Badge>
    }
  }

  const getEnhancedDataBadge = (route) => {
    if (route.enhancedDataCollectionSuccessful) {
      return <Badge variant="success" size="sm">Enhanced</Badge>
    } else if (route.enhancedDataCollectionAttempted) {
      return <Badge variant="danger" size="sm">Failed</Badge>
    } else {
      return <Badge variant="warning" size="sm">Basic</Badge>
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Processing Results</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={Download}
            onClick={onDownload}
            size="sm"
          >
            Download Results
          </Button>
          {visibilityAnalysisStats?.enabled && (
            <Badge variant="primary" className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>Visibility Analysis</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'errors' && errors?.length > 0 && (
                  <Badge variant="danger" size="sm">{errors.length}</Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Main Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{summary.successful}</p>
                <p className="text-sm text-green-700">Successful</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{summary.totalDistance}</p>
                <p className="text-sm text-blue-700">Total Distance</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{summary.averageRiskScore}</p>
                <p className="text-sm text-purple-700">Avg Risk Score</p>
              </div>
            </div>

            {/* Enhanced Data Summary */}
            {enhancedDataCollectionStats && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Enhanced Data Collection
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {enhancedDataCollectionStats.totalRecordsCreated}
                    </p>
                    <p className="text-xs text-gray-600">Total Records</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">
                      {enhancedDataCollectionStats.sharpTurnsCollected}
                    </p>
                    <p className="text-xs text-gray-600">Sharp Turns</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">
                      {enhancedDataCollectionStats.blindSpotsCollected}
                    </p>
                    <p className="text-xs text-gray-600">Blind Spots</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {enhancedDataCollectionStats.successful}
                    </p>
                    <p className="text-xs text-gray-600">Routes Enhanced</p>
                  </div>
                </div>
              </div>
            )}

            {/* Visibility Analysis Summary */}
            {visibilityAnalysisStats?.enabled && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Automatic Visibility Analysis Results
                  <Badge variant="primary" className="ml-2" size="sm">NEW</Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-lg font-bold text-blue-600">
                      {visibilityAnalysisStats.successful}
                    </p>
                    <p className="text-xs text-blue-700">Routes Analyzed</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 border border-orange-200">
                    <p className="text-lg font-bold text-orange-600">
                      {visibilityAnalysisStats.totalSharpTurns}
                    </p>
                    <p className="text-xs text-orange-700">Sharp Turns Found</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-lg font-bold text-red-600">
                      {visibilityAnalysisStats.totalBlindSpots}
                    </p>
                    <p className="text-xs text-red-700">Blind Spots Found</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                    <p className="text-lg font-bold text-purple-600">
                      {visibilityAnalysisStats.criticalTurns + visibilityAnalysisStats.criticalBlindSpots}
                    </p>
                    <p className="text-xs text-purple-700">Critical Issues</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="text-blue-700">Success Rate: </span>
                    <Badge variant="success" size="sm">
                      {Math.round((visibilityAnalysisStats.successful / visibilityAnalysisStats.attempted) * 100)}%
                    </Badge>
                  </div>
                  <div className="text-blue-600">
                    Avg Analysis Time: {visibilityAnalysisStats.averageAnalysisTime}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {routes?.map((route, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{route.routeName}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDistance(route.totalDistance)}</span>
                          <span>{formatDate(route?.createdAt)}</span>
                          <Badge variant={getRiskLevel(route.riskScore)} size="sm">
                            {getRiskLevel(route.riskScore)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Enhanced Data Badge */}
                    {getEnhancedDataBadge(route)}
                    
                    {/* Visibility Analysis Badge */}
                    {route.visibilityAnalysisAttempted && getVisibilityBadge(route)}
                    
                    {/* Visibility Data Display */}
                    {route.visibilityData && route.visibilityData.sharpTurns > 0 && (
                      <div className="flex items-center space-x-1 text-xs">
                        <Activity className="w-3 h-3 text-orange-500" />
                        <span className="text-orange-600">{route.visibilityData.sharpTurns}</span>
                      </div>
                    )}
                    {route.visibilityData && route.visibilityData.blindSpots > 0 && (
                      <div className="flex items-center space-x-1 text-xs">
                        <Eye className="w-3 h-3 text-red-500" />
                        <span className="text-red-600">{route.visibilityData.blindSpots}</span>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => onViewDetails(route._id || route.routeId)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visibility Analysis Tab */}
        {activeTab === 'visibility' && visibilityAnalysisStats && (
          <div className="space-y-6">
            {/* Visibility Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Sharp Turns Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-orange-700">Total Found:</span>
                    <span className="font-bold text-orange-600">{visibilityAnalysisStats.totalSharpTurns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Critical:</span>
                    <span className="font-bold text-red-600">{visibilityAnalysisStats.criticalTurns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Success Rate:</span>
                    <span className="font-bold text-green-600">
                      {Math.round((visibilityAnalysisStats.analysisBreakdown.sharpTurnsSuccess / 
                        (visibilityAnalysisStats.analysisBreakdown.sharpTurnsSuccess + 
                         visibilityAnalysisStats.analysisBreakdown.sharpTurnsFailed)) * 100) || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-red-900 mb-3 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Blind Spots Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-red-700">Total Found:</span>
                    <span className="font-bold text-red-600">{visibilityAnalysisStats.totalBlindSpots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Critical:</span>
                    <span className="font-bold text-red-600">{visibilityAnalysisStats.criticalBlindSpots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Success Rate:</span>
                    <span className="font-bold text-green-600">
                      {Math.round((visibilityAnalysisStats.analysisBreakdown.blindSpotsSuccess / 
                        (visibilityAnalysisStats.analysisBreakdown.blindSpotsSuccess + 
                         visibilityAnalysisStats.analysisBreakdown.blindSpotsFailed)) * 100) || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Errors */}
            {visibilityAnalysisStats.errors && visibilityAnalysisStats.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Analysis Issues
                </h4>
                <div className="space-y-2">
                  {visibilityAnalysisStats.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <span className="font-medium text-red-800">
                          Route {error.routeNumber}: {error.fromCode} → {error.toCode}
                        </span>
                        <p className="text-red-600">{error.error}</p>
                      </div>
                    </div>
                  ))}
                  {visibilityAnalysisStats.errors.length > 5 && (
                    <p className="text-sm text-red-600">
                      ...and {visibilityAnalysisStats.errors.length - 5} more issues
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Data Tab */}
        {activeTab === 'enhanced' && enhancedMongodbCollectionsSummary && (
          <div className="space-y-6">
            {/* Collection Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">MongoDB Collections Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(enhancedMongodbCollectionsSummary.breakdown).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg p-3 border">
                    <p className="text-lg font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Features Summary */}
            {enhancedMongodbCollectionsSummary.enhancedFeatures && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-900 mb-3">Enhanced Features Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(enhancedMongodbCollectionsSummary.enhancedFeatures).map(([key, value]) => (
                    <div key={key} className="flex justify-between bg-white px-3 py-2 rounded border border-green-200">
                      <span className="text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-medium text-green-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {enhancedMongodbCollectionsSummary.routesWithEnhancedData}
                </p>
                <p className="text-sm text-blue-700">Routes with Enhanced Data</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {enhancedMongodbCollectionsSummary.recordsPerRoute}
                </p>
                <p className="text-sm text-purple-700">Avg Records per Route</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {enhancedMongodbCollectionsSummary.dataCollectionMode}
                </p>
                <p className="text-sm text-indigo-700">Collection Mode</p>
              </div>
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="space-y-4">
            {errors && errors.length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-600 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Processing Errors ({errors.length})
                </h4>
                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 bg-white p-2 rounded border border-red-200">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h4>
                <p className="text-gray-500">All routes processed successfully without errors.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Next Steps
          </h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="space-y-1 text-sm text-blue-800">
              {nextSteps.slice(0, 5).map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-3 h-3 text-blue-600 mt-1" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ResultsViewer