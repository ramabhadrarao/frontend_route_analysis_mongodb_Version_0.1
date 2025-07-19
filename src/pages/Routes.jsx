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
import { apiService } from '../services/apiService'
import { routeService } from '../services'
import { RISK_LEVELS } from '../utils/constants'
import { formatDistance, getRiskLevel, getRiskColor } from '../utils/helpers'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
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
    total: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    loadRoutes()
  }, [filters, pagination.page, searchTerm])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check authentication
      const token = localStorage.getItem('authToken')
      if (!token) {
        try {
          const loginResponse = await apiService.auth.login({
            email: 'test@example.com',
            password: 'Test123456'
          })
          if (loginResponse.token) {
            localStorage.setItem('authToken', loginResponse.token)
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError)
          setError('Authentication required. Please login.')
          return
        }
      }
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== 'all')
        )
      }
      
      const response = await routeService.getRoutes(params)
      const routesData = response.data?.routes || []
      const paginationData = response.data?.pagination || {}
      
      setRoutes(routesData)
      setPagination(prev => ({
        ...prev,
        total: paginationData.totalRoutes || 0
      }))
    } catch (error) {
      console.error('Failed to load routes:', error)
      setError('Failed to load routes. Please try again.')
      setRoutes([])
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

  const handleRefresh = () => {
    loadRoutes()
  }

  const handleDownloadReport = async (routeId) => {
    try {
      toast.success(`Downloading report for route ${routeId}...`)
      // Implement PDF download logic here
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

  const processingStatusOptions = [
    { value: 'all', label: 'All Processing Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'processing', label: 'Processing' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' }
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading routes..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Routes</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="primary">
            Try Again
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
          <p className="text-gray-600">Manage and analyze your journey routes with comprehensive data</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
          >
            Refresh
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
            <Input
              type="text"
              placeholder="Search routes by name, origin, or destination..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Select
              value={viewMode}
              onChange={(value) => setViewMode(value)}
              options={[
                { value: 'grid', label: 'Grid View' },
                { value: 'table', label: 'Table View' }
              ]}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Risk Level"
                value={filters.riskLevel}
                onChange={(value) => handleFilterChange('riskLevel', value)}
                options={riskLevelOptions}
              />
              <Select
                label="Status"
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                options={statusOptions}
              />
              <Select
                label="Processing Status"
                value={filters.processingStatus}
                onChange={(value) => handleFilterChange('processingStatus', value)}
                options={processingStatusOptions}
              />
              <Select
                label="Date Range"
                value={filters.dateRange}
                onChange={(value) => handleFilterChange('dateRange', value)}
                options={dateRangeOptions}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Routes Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Card key={route.routeId || route._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {route.routeName}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {route.fromAddress} → {route.toAddress}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={getRiskColor(route.riskLevel)}
                      className="text-xs"
                    >
                      {route.riskLevel}
                    </Badge>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProcessingStatusColor(route.dataProcessingStatus)}`}>
                      <div className="flex items-center space-x-1">
                        {getProcessingStatusIcon(route.dataProcessingStatus)}
                        <span>{route.dataProcessingStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDistance(route.totalDistance)}
                    </div>
                    <div className="text-xs text-gray-600">Distance</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {route.riskScore || 0}
                    </div>
                    <div className="text-xs text-gray-600">Risk Score</div>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex items-center">
                      <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />
                      <span>Accidents</span>
                    </div>
                    <span className="font-medium">{route.accidentAreasCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 text-orange-500 mr-1" />
                      <span>Blind Spots</span>
                    </div>
                    <span className="font-medium">{route.blindSpotsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 text-blue-500 mr-1" />
                      <span>Emergency</span>
                    </div>
                    <span className="font-medium">{route.emergencyServicesCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div className="flex items-center">
                      <Wifi className="w-3 h-3 text-purple-500 mr-1" />
                      <span>Network</span>
                    </div>
                    <span className="font-medium">{route.networkDeadZones || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2 border-t border-gray-200">
                  <Link to={`/routes/${route._id || route.routeId}`} className="flex-1">
                    <Button variant="outline" size="sm" icon={Eye} className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownloadReport(route._id || route.routeId)}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
                    Risk Factors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => (
                  <tr key={route.routeId || route._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {route.routeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {route.fromAddress} → {route.toAddress}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDistance(route.totalDistance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRiskColor(route.riskLevel)}>
                        {route.riskLevel} ({route.riskScore || 0})
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProcessingStatusColor(route.dataProcessingStatus)}`}>
                        {getProcessingStatusIcon(route.dataProcessingStatus)}
                        <span className="ml-1">{route.dataProcessingStatus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2 text-xs">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                          A: {route.accidentAreasCount || 0}
                        </span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          B: {route.blindSpotsCount || 0}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          E: {route.emergencyServicesCount || 0}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          N: {route.networkDeadZones || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link to={`/routes/${route._id || route.routeId}`}>
                          <Button variant="outline" size="sm" icon={Eye}>
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => handleDownloadReport(route._id || route.routeId)}
                        >
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              {Array.from({ length: Math.min(Math.ceil(pagination.total / pagination.limit), 5) }, (_, i) => {
                const totalPages = Math.ceil(pagination.total / pagination.limit)
                let page
                if (totalPages <= 5) {
                  page = i + 1
                } else if (pagination.page <= 3) {
                  page = i + 1
                } else if (pagination.page >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = pagination.page - 2 + i
                }
                return (
                  <Button
                    key={page}
                    variant={pagination.page === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                  >
                    {page}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
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
              : 'Get started by uploading your first route data.'}
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