import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Download, 
  RefreshCw,
  Map,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { apiService } from '../services/apiService'
import { formatDistance, formatDate, getRiskLevel, getRiskColor } from '../utils/helpers'
import { RISK_LEVELS } from '../utils/constants'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Badge from '../components/UI/Badge'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const Routes = () => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    status: 'all',
    dateRange: 'all'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  })

  useEffect(() => {
    loadRoutes()
  }, [filters, pagination.page, searchTerm])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      }
      
      const response = await apiService.routes.getAll(params)
      setRoutes(response.routes || [])
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }))
    } catch (error) {
      console.error('Routes load error:', error)
      toast.error('Failed to load routes')
      // Use mock data for demo
      setRoutes(mockRoutes)
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
      const response = await apiService.reports.generatePDF(routeId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `route-report-${routeId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Report downloaded successfully!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download report')
    }
  }

  // Mock data for demo
  const mockRoutes = [
    {
      routeId: 'R-2024-001',
      routeName: 'Mumbai to Pune Express',
      fromAddress: 'Mumbai, Maharashtra',
      toAddress: 'Pune, Maharashtra',
      totalDistance: 148.5,
      estimatedDuration: 180,
      riskScore: 72,
      riskLevel: 'high',
      status: 'active',
      createdAt: new Date().toISOString(),
      dataProcessingStatus: 'completed'
    },
    {
      routeId: 'R-2024-002',
      routeName: 'Delhi to Agra Highway',
      fromAddress: 'Delhi, India',
      toAddress: 'Agra, Uttar Pradesh',
      totalDistance: 233.2,
      estimatedDuration: 240,
      riskScore: 45,
      riskLevel: 'medium',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      dataProcessingStatus: 'completed'
    },
    {
      routeId: 'R-2024-003',
      routeName: 'Bangalore to Chennai Route',
      fromAddress: 'Bangalore, Karnataka',
      toAddress: 'Chennai, Tamil Nadu',
      totalDistance: 346.8,
      estimatedDuration: 360,
      riskScore: 28,
      riskLevel: 'low',
      status: 'active',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      dataProcessingStatus: 'processing'
    }
  ]

  const riskLevelOptions = [
    { value: 'all', label: 'All Risk Levels' },
    { value: RISK_LEVELS.LOW, label: 'Low Risk' },
    { value: RISK_LEVELS.MEDIUM, label: 'Medium Risk' },
    { value: RISK_LEVELS.HIGH, label: 'High Risk' },
    { value: RISK_LEVELS.CRITICAL, label: 'Critical Risk' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' }
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ]

  const currentRoutes = routes.length > 0 ? routes : mockRoutes

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading routes..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
          <p className="text-gray-600">Manage and analyze your journey routes</p>
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

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
          <Select
            options={riskLevelOptions}
            value={filters.riskLevel}
            onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
          />
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          />
          <Select
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          />
        </div>
      </Card>

      {/* Routes List */}
      <div className="grid gap-6">
        {currentRoutes.map((route) => (
          <Card key={route.routeId} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Map className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{route.routeName}</h3>
                  <p className="text-sm text-gray-500">ID: {route.routeId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={route.riskLevel}>
                  {getRiskLevel(route.riskScore)} Risk
                </Badge>
                <Badge variant={route.status === 'active' ? 'success' : 'default'}>
                  {route.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">From</p>
                <p className="font-medium text-gray-900">{route.fromAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">To</p>
                <p className="font-medium text-gray-900">{route.toAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Distance</p>
                <p className="font-medium text-gray-900">{formatDistance(route.totalDistance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Risk Score</p>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getRiskColor(route.riskLevel) }}
                  />
                  <span className="font-medium text-gray-900">{route.riskScore}/100</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(route.createdAt)}</span>
                </div>
                {route.dataProcessingStatus === 'processing' && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Link to={`/routes/${route.routeId}`}>
                  <Button variant="outline" size="sm" icon={Eye}>
                    View Details
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={() => handleDownloadReport(route.routeId)}
                >
                  Report
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Routes