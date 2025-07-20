import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  Download,
  AlertTriangle,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Database,
  TrendingUp
} from 'lucide-react'
import { enhancedRouteService } from '../services/enhancedRouteService'
import { formatDistance, getRiskLevel, getRiskColor, formatDate } from '../utils/helpers'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Badge from '../components/UI/Badge'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Routes = () => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    status: 'all',
    dateRange: 'all',
    hasData: 'all'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [refreshing, setRefreshing] = useState(false)
  const [overallStats, setOverallStats] = useState(null)

  useEffect(() => {
    loadRoutes()
  }, [filters, pagination.page, searchTerm])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Routes Page: Loading routes with enhanced statistics...')
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        includeStatistics: true, // Always include statistics
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== 'all')
        )
      }
      
      const response = await enhancedRouteService.getRoutesWithStatistics(params)
      
      console.log('Routes Page: Enhanced API response:', response)
      
      if (response.success && response.data) {
        const routesData = response.data.routes || []
        console.log('Routes Page: Loaded', routesData.length, 'routes with statistics')
        
        setRoutes(routesData)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.totalRoutes || routesData.length,
          totalPages: response.data.pagination?.totalPages || Math.ceil(routesData.length / pagination.limit)
        }))

        // Calculate overall statistics
        calculateOverallStatistics(routesData)
      } else {
        throw new Error('Invalid response structure from enhanced route service')
      }
      
    } catch (error) {
      console.error('Routes Page: Failed to load routes with statistics:', error)
      setError(`Failed to load routes: ${error.message}`)
      setRoutes([])
      toast.error(`Failed to load routes: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Calculate overall statistics for all loaded routes
  const calculateOverallStatistics = (routesData) => {
    const stats = {
      totalRoutes: routesData.length,
      routesWithData: 0,
      totalDataPoints: 0,
      totalCriticalPoints: 0,
      averageDataCompleteness: 0,
      dataBreakdown: {
        sharpTurns: 0,
        blindSpots: 0,
        emergencyServices: 0,
        weatherConditions: 0,
        trafficData: 0,
        roadConditions: 0,
        networkCoverage: 0,
        accidentProneAreas: 0
      },
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    }

    routesData.forEach(route => {
      if (route.statistics && route.hasStatistics) {
        stats.routesWithData++
        stats.totalDataPoints += route.statistics.totals?.totalDataPoints || 0
        stats.totalCriticalPoints += route.statistics.totals?.criticalPoints || 0
        stats.averageDataCompleteness += route.statistics.performance?.dataCompleteness || 0

        // Aggregate data breakdown
        if (route.statistics.dataAvailability) {
          Object.keys(stats.dataBreakdown).forEach(key => {
            stats.dataBreakdown[key] += route.statistics.dataAvailability[key] || 0
          })
        }

        // Risk distribution
        const riskLevel = (route.riskLevel || route.statistics?.route?.riskLevel || 'unknown').toLowerCase()
        if (riskLevel.includes('low')) stats.riskDistribution.low++
        else if (riskLevel.includes('medium')) stats.riskDistribution.medium++
        else if (riskLevel.includes('high')) stats.riskDistribution.high++
        else if (riskLevel.includes('critical')) stats.riskDistribution.critical++
      }
    })

    // Calculate averages
    if (stats.routesWithData > 0) {
      stats.averageDataCompleteness = Math.round(stats.averageDataCompleteness / stats.routesWithData)
      stats.averageDataPointsPerRoute = Math.round(stats.totalDataPoints / stats.routesWithData)
    }

    setOverallStats(stats)
    console.log('Routes Page: Overall statistics calculated:', stats)
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRoutes()
    setRefreshing(false)
  }

  const handleDownloadReport = async (routeId) => {
    try {
      toast.success(`Preparing report for route ${routeId}...`)
      toast.info('Report download feature will be implemented soon')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download report')
    }
  }

  const handleViewDetails = (routeId) => {
    window.open(`/routes/${routeId}`, '_blank')
  }

  // Get route statistics for display
  const getRouteDisplayData = (route) => {
    const baseData = {
      id: route._id || route.routeId,
      name: route.routeName || 'Unnamed Route',
      fromLocation: route.fromAddress || route.fromName || 'Unknown Origin',
      toLocation: route.toAddress || route.toName || 'Unknown Destination',
      distance: formatDistance(route.totalDistance || 0),
      riskLevel: route.riskLevel || getRiskLevel(route.riskScore || 0),
      riskScore: route.riskScore || route.riskScores?.totalWeightedScore || 0,
      createdAt: route.createdAt
    }

    // Add statistics if available
    if (route.statistics && route.hasStatistics) {
      return {
        ...baseData,
        statistics: {
          totalDataPoints: route.statistics.totals?.totalDataPoints || 0,
          criticalPoints: route.statistics.totals?.criticalPoints || 0,
          dataCompleteness: route.statistics.performance?.dataCompleteness || 0,
          hasEnhancedData: route.statistics.totals?.totalDataPoints > 50,
          hasVisibilityData: (route.statistics.dataAvailability?.sharpTurns || 0) + 
                           (route.statistics.dataAvailability?.blindSpots || 0) > 0,
          breakdown: {
            sharpTurns: route.statistics.dataAvailability?.sharpTurns || 0,
            blindSpots: route.statistics.dataAvailability?.blindSpots || 0,
            emergencyServices: route.statistics.dataAvailability?.emergencyServices || 0,
            weatherConditions: route.statistics.dataAvailability?.weatherConditions || 0,
            trafficData: route.statistics.dataAvailability?.trafficData || 0,
            roadConditions: route.statistics.dataAvailability?.roadConditions || 0,
            networkCoverage: route.statistics.dataAvailability?.networkCoverage || 0,
            accidentProneAreas: route.statistics.dataAvailability?.accidentProneAreas || 0
          }
        },
        hasStatistics: true,
        statisticsError: null
      }
    } else {
      return {
        ...baseData,
        statistics: {
          totalDataPoints: 0,
          criticalPoints: 0,
          dataCompleteness: 0,
          hasEnhancedData: false,
          hasVisibilityData: false,
          breakdown: {
            sharpTurns: 0,
            blindSpots: 0,
            emergencyServices: 0,
            weatherConditions: 0,
            trafficData: 0,
            roadConditions: 0,
            networkCoverage: 0,
            accidentProneAreas: 0
          }
        },
        hasStatistics: false,
        statisticsError: route.statisticsError || 'No statistics available'
      }
    }
  }

  const getDataQualityColor = (completeness) => {
    if (completeness >= 80) return 'text-green-600 bg-green-100'
    if (completeness >= 60) return 'text-blue-600 bg-blue-100'
    if (completeness >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDataQualityLabel = (completeness) => {
    if (completeness >= 80) return 'Excellent'
    if (completeness >= 60) return 'Good'
    if (completeness >= 40) return 'Fair'
    return 'Poor'
  }

  const riskLevelOptions = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'LOW', label: 'Low Risk' },
    { value: 'MEDIUM', label: 'Medium Risk' },
    { value: 'HIGH', label: 'High Risk' },
    { value: 'CRITICAL', label: 'Critical Risk' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ]

  const dataStatusOptions = [
    { value: 'all', label: 'All Routes' },
    { value: 'enhanced', label: 'Enhanced Data' },
    { value: 'basic', label: 'Basic Data' },
    { value: 'no-data', label: 'No Data' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading routes with enhanced statistics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Enhanced Statistics Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="primary">
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
          <p className="text-gray-600">
            Manage and analyze routes with comprehensive statistics ({routes.length} routes loaded)
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh Statistics
          </Button>
          <Link to="/bulk-processor">
            <Button variant="primary" icon={Plus}>
              Add Routes
            </Button>
          </Link>
        </div>
      </div>

      {/* Overall Statistics Summary */}
      {overallStats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{overallStats.totalRoutes}</div>
              <div className="text-sm text-blue-700">Total Routes</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{overallStats.routesWithData}</div>
              <div className="text-sm text-green-700">With Enhanced Data</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{overallStats.totalDataPoints.toLocaleString()}</div>
              <div className="text-sm text-purple-700">Total Data Points</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{overallStats.totalCriticalPoints}</div>
              <div className="text-sm text-orange-700">Critical Points</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-600">{overallStats.averageDataCompleteness}%</div>
              <div className="text-sm text-indigo-700">Avg Completeness</div>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <div className="text-2xl font-bold text-teal-600">{overallStats.averageDataPointsPerRoute || 0}</div>
              <div className="text-sm text-teal-700">Avg Points/Route</div>
            </div>
          </div>
          
          {/* Data Breakdown */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data Distribution Across All Routes</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
              {Object.entries(overallStats.dataBreakdown).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="font-semibold text-gray-900">{value.toLocaleString()}</div>
                  <div className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search routes by name, origin, or destination..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="grid">Grid View</option>
              <option value="table">Table View</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={filters.riskLevel}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {riskLevelOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Availability</label>
                <select
                  value={filters.hasData}
                  onChange={(e) => handleFilterChange('hasData', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {dataStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Routes Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {routes.map((route) => {
            const displayData = getRouteDisplayData(route)
            
            return (
              <Card key={displayData.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {displayData.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">
                          {displayData.fromLocation} → {displayData.toLocation}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Badge
                        variant={getRiskColor(displayData.riskLevel)}
                        className="text-xs"
                      >
                        {displayData.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  {/* Route Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {displayData.distance}
                      </div>
                      <div className="text-xs text-gray-600">Distance</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {displayData.riskScore}
                      </div>
                      <div className="text-xs text-gray-600">Risk Score</div>
                    </div>
                  </div>

                  {/* Enhanced Statistics Section */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Enhanced Data</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {displayData.hasStatistics ? (
                          <Badge className={getDataQualityColor(displayData.statistics.dataCompleteness)}>
                            {getDataQualityLabel(displayData.statistics.dataCompleteness)}
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">No Data</Badge>
                        )}
                      </div>
                    </div>
                    
                    {displayData.hasStatistics ? (
                      <>
                        <div className="text-center mb-3">
                          <div className="text-2xl font-bold text-blue-600">
                            {displayData.statistics.totalDataPoints.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-700">Total Data Points</div>
                          {displayData.statistics.criticalPoints > 0 && (
                            <div className="text-sm text-red-600 font-medium mt-1">
                              {displayData.statistics.criticalPoints} Critical Points
                            </div>
                          )}
                        </div>

                        {/* Enhanced Data Breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {displayData.statistics.breakdown.sharpTurns > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-orange-600">{displayData.statistics.breakdown.sharpTurns}</div>
                              <div className="text-orange-700">Sharp Turns</div>
                            </div>
                          )}
                          {displayData.statistics.breakdown.blindSpots > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-red-600">{displayData.statistics.breakdown.blindSpots}</div>
                              <div className="text-red-700">Blind Spots</div>
                            </div>
                          )}
                          {displayData.statistics.breakdown.emergencyServices > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-green-600">{displayData.statistics.breakdown.emergencyServices}</div>
                              <div className="text-green-700">Emergency</div>
                            </div>
                          )}
                          {displayData.statistics.breakdown.accidentProneAreas > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-red-600">{displayData.statistics.breakdown.accidentProneAreas}</div>
                              <div className="text-red-700">Accidents</div>
                            </div>
                          )}
                          {displayData.statistics.breakdown.networkCoverage > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-purple-600">{displayData.statistics.breakdown.networkCoverage}</div>
                              <div className="text-purple-700">Network</div>
                            </div>
                          )}
                          {displayData.statistics.breakdown.roadConditions > 0 && (
                            <div className="text-center">
                              <div className="font-medium text-blue-600">{displayData.statistics.breakdown.roadConditions}</div>
                              <div className="text-blue-700">Road Data</div>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Features Indicators */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {displayData.statistics.hasVisibilityData && (
                            <Badge variant="warning" className="text-xs">
                              Visibility Analysis
                            </Badge>
                          )}
                          {displayData.statistics.hasEnhancedData && (
                            <Badge variant="success" className="text-xs">
                              Enhanced Data
                            </Badge>
                          )}
                          {displayData.statistics.criticalPoints > 0 && (
                            <Badge variant="danger" className="text-xs">
                              Critical Issues
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No enhanced statistics available</p>
                        {displayData.statisticsError && (
                          <p className="text-xs text-red-500 mt-1">{displayData.statisticsError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Route Meta */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <div className="flex justify-between">
                      <span>Created: {formatDate(displayData.createdAt)}</span>
                      <span>ID: {displayData.id?.toString().slice(-8)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleViewDetails(displayData.id)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={BarChart3}
                      onClick={() => handleViewDetails(displayData.id)}
                      className="flex-1"
                    >
                      Statistics
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enhanced Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => {
                  const displayData = getRouteDisplayData(route)
                  
                  return (
                    <tr key={displayData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {displayData.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {displayData.fromLocation} → {displayData.toLocation}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {displayData.distance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getRiskColor(displayData.riskLevel)}>
                          {displayData.riskLevel} ({displayData.riskScore})
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {displayData.hasStatistics ? (
                          <div className="text-sm">
                            <div className="font-medium text-blue-600">
                              {displayData.statistics.totalDataPoints.toLocaleString()} points
                            </div>
                            <div className="text-xs text-gray-500">
                              {displayData.statistics.criticalPoints > 0 && (
                                <span className="text-red-600">{displayData.statistics.criticalPoints} critical</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No data available</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {displayData.hasStatistics ? (
                          <Badge className={getDataQualityColor(displayData.statistics.dataCompleteness)}>
                            {displayData.statistics.dataCompleteness}% - {getDataQualityLabel(displayData.statistics.dataCompleteness)}
                          </Badge>
                        ) : (
                          <Badge variant="danger">No Data</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleViewDetails(displayData.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Download}
                            onClick={() => handleDownloadReport(displayData.id)}
                          >
                            Report
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} routes
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* No Results */}
      {routes.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <MapPin className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || Object.values(filters).some(f => f !== 'all') 
              ? 'Try adjusting your search criteria or filters.'
              : 'No routes available. Upload some route data to get started.'}
          </p>
          <Link to="/bulk-processor">
            <Button variant="primary" icon={Plus}>
              Upload Routes
            </Button>
          </Link>
        </Card>
      )}

      {/* Enhanced Status Footer */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-blue-800 font-medium">
              Routes loaded with comprehensive enhanced statistics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                {overallStats?.totalDataPoints?.toLocaleString() || 0} Total Data Points
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                {overallStats?.routesWithData || 0} Enhanced Routes
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">
                {overallStats?.averageDataCompleteness || 0}% Avg Quality
              </span>
            </div>
            <Badge variant="success" size="sm">
              Statistics API Connected
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Routes