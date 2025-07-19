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
  Phone,
  Wifi,
  Clock,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react'
import { api } from '../services/authService'
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
    processingStatus: 'all'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadRoutes()
  }, [filters, pagination.page, searchTerm])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Frontend Routes: Loading routes from API...')
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== 'all')
        )
      }
      
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/api/routes?${queryString}`)
      
      console.log('Frontend Routes: Raw API response:', response.data)
      
      // Handle the actual API response structure
      let routesData = []
      let totalRoutes = 0
      
      if (response.data) {
        // Check various possible response structures from your backend
        if (Array.isArray(response.data)) {
          // Direct array response
          routesData = response.data
          totalRoutes = response.data.length
        } else if (response.data.routes && Array.isArray(response.data.routes)) {
          // { routes: [...], pagination: {...} }
          routesData = response.data.routes
          totalRoutes = response.data.pagination?.totalRoutes || response.data.routes.length
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // { data: [...] }
          routesData = response.data.data
          totalRoutes = response.data.data.length
        } else if (response.data.data && response.data.data.routes && Array.isArray(response.data.data.routes)) {
          // { data: { routes: [...], pagination: {...} } }
          routesData = response.data.data.routes
          totalRoutes = response.data.data.pagination?.totalRoutes || response.data.data.routes.length
        } else {
          // Single route object
          routesData = [response.data]
          totalRoutes = 1
        }
      }
      
      console.log('Frontend Routes: Processed routes data:', {
        routesCount: routesData.length,
        totalRoutes: totalRoutes,
        firstRoute: routesData[0]
      })
      
      setRoutes(routesData)
      setPagination(prev => ({
        ...prev,
        total: totalRoutes,
        totalPages: Math.ceil(totalRoutes / pagination.limit)
      }))
      
    } catch (error) {
      console.error('Frontend Routes: API call failed:', error)
      setError(`Failed to load routes: ${error.response?.data?.message || error.message}`)
      setRoutes([])
      toast.error(`Failed to load routes: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
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
      // Implement actual download when ready
      toast.info('Report download feature will be implemented soon')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download report')
    }
  }

  const getProcessingStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Loader className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getProcessingStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProcessingStatus = (route) => {
    if (!route.dataProcessingStatus) return 'pending'
    
    const statuses = Object.values(route.dataProcessingStatus)
    const completed = statuses.filter(status => status === true).length
    const total = statuses.length
    
    if (completed === total) return 'completed'
    if (completed > 0) return 'processing'
    return 'pending'
  }

  // Safe data extraction helpers
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue
    } catch {
      return defaultValue
    }
  }

  const getRouteRiskLevel = (route) => {
    return route.riskLevel || getRiskLevel(route.riskScore || route.riskScores?.totalWeightedScore || 0)
  }

  const getRouteDistance = (route) => {
    return formatDistance(route.totalDistance || 0)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading routes from API..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">API Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="primary">
            Retry API Call
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
            Manage and analyze your journey routes ({routes.length} routes loaded from API)
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh API
          </Button>
          <Link to="/bulk-processor">
            <Button variant="primary" icon={Plus}>
              Add Routes
            </Button>
          </Link>
        </div>
      </div>

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
            </div>
          </div>
        )}
      </Card>

      {/* Routes Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {routes.map((route) => {
            const routeId = route._id || route.routeId
            const routeName = route.routeName || 'Unnamed Route'
            const fromLocation = route.fromAddress || route.fromName || 'Unknown Origin'
            const toLocation = route.toAddress || route.toName || 'Unknown Destination'
            const riskLevel = getRouteRiskLevel(route)
            const distance = getRouteDistance(route)
            const processingStatus = getProcessingStatus(route)
            
            return (
              <Card key={routeId} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {routeName}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">
                          {fromLocation} → {toLocation}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Badge
                        variant={getRiskColor(riskLevel)}
                        className="text-xs"
                      >
                        {riskLevel}
                      </Badge>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProcessingStatusColor(processingStatus)}`}>
                        <div className="flex items-center space-x-1">
                          {getProcessingStatusIcon(processingStatus)}
                          <span>{processingStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {distance}
                      </div>
                      <div className="text-xs text-gray-600">Distance</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {route.riskScore || route.riskScores?.totalWeightedScore || 0}
                      </div>
                      <div className="text-xs text-gray-600">Risk Score</div>
                    </div>
                  </div>

                  {/* Route Meta */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <div className="flex justify-between">
                      <span>Created: {formatDate(route.createdAt)}</span>
                      <span>ID: {routeId?.toString().slice(-8)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2 border-t border-gray-200">
                    <Link to={`/routes/${routeId}`} className="flex-1">
                      <Button variant="outline" size="sm" icon={Eye} className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Download}
                      onClick={() => handleDownloadReport(routeId)}
                    >
                      PDF
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => {
                  const routeId = route._id || route.routeId
                  const routeName = route.routeName || 'Unnamed Route'
                  const fromLocation = route.fromAddress || route.fromName || 'Unknown Origin'
                  const toLocation = route.toAddress || route.toName || 'Unknown Destination'
                  const riskLevel = getRouteRiskLevel(route)
                  const distance = getRouteDistance(route)
                  const processingStatus = getProcessingStatus(route)
                  
                  return (
                    <tr key={routeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {routeName}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {fromLocation} → {toLocation}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {distance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getRiskColor(riskLevel)}>
                          {riskLevel} ({route.riskScore || route.riskScores?.totalWeightedScore || 0})
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProcessingStatusColor(processingStatus)}`}>
                          {getProcessingStatusIcon(processingStatus)}
                          <span className="ml-1">{processingStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link to={`/routes/${routeId}`}>
                            <Button variant="outline" size="sm" icon={Eye}>
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Download}
                            onClick={() => handleDownloadReport(routeId)}
                          >
                            PDF
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
              : 'No routes available from the API. Upload some route data to get started.'}
          </p>
          <Link to="/bulk-processor">
            <Button variant="primary" icon={Plus}>
              Upload Routes
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

export default Routes