import React, { useState, useEffect } from 'react'
import { 
  Route, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Map,
  Users,
  Activity,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { apiService } from '../services/apiService'
import { formatDistance, formatDate, getRiskColor } from '../utils/helpers'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [overview, setOverview] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Dashboard: Loading data from real APIs only...')
      
      // Try to load data from real APIs
      const [overviewData, statisticsData, alertsData] = await Promise.allSettled([
        apiService.dashboard.getOverview(),
        apiService.dashboard.getStatistics(),
        apiService.dashboard.getAlerts()
      ])

      // Process overview data
      if (overviewData.status === 'fulfilled') {
        setOverview(overviewData.value)
        console.log('Dashboard: Overview data loaded from API:', overviewData.value)
      } else {
        console.warn('Dashboard: Overview API failed:', overviewData.reason)
        setOverview(null)
      }

      // Process statistics data
      if (statisticsData.status === 'fulfilled') {
        setStatistics(statisticsData.value)
        console.log('Dashboard: Statistics data loaded from API:', statisticsData.value)
      } else {
        console.warn('Dashboard: Statistics API failed:', statisticsData.reason)
        setStatistics(null)
      }

      // Process alerts data
      if (alertsData.status === 'fulfilled') {
        setAlerts(alertsData.value)
        console.log('Dashboard: Alerts data loaded from API:', alertsData.value)
      } else {
        console.warn('Dashboard: Alerts API failed:', alertsData.reason)
        setAlerts([])
      }

      // If all APIs failed, show error
      if (overviewData.status === 'rejected' && 
          statisticsData.status === 'rejected' && 
          alertsData.status === 'rejected') {
        throw new Error('All dashboard APIs failed to load')
      }

    } catch (error) {
      console.error('Dashboard: Failed to load data from APIs:', error)
      setError('Failed to load dashboard data from API')
      setOverview(null)
      setStatistics(null)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard from API..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard API Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="primary">
            Retry Loading from API
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your journey risk management system (Real API Data)</p>
        </div>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh API Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.totalRoutes || 0}
              </p>
              {!overview && (
                <p className="text-xs text-red-500">API data unavailable</p>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk Routes</p>
              <p className="text-2xl font-bold text-red-600">
                {overview?.highRiskRoutes || 0}
              </p>
              {!overview && (
                <p className="text-xs text-red-500">API data unavailable</p>
              )}
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.totalDistance ? formatDistance(overview.totalDistance) : '0 km'}
              </p>
              {!overview && (
                <p className="text-xs text-red-500">API data unavailable</p>
              )}
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Map className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Risk Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.averageRiskScore || 0}
              </p>
              {!overview && (
                <p className="text-xs text-red-500">API data unavailable</p>
              )}
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Risk Distribution
            {!statistics && <span className="text-sm text-red-500 ml-2">(API data unavailable)</span>}
          </h3>
          
          {statistics?.riskDistribution ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statistics.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Risk distribution data not available from API</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Route Processing
            {!statistics && <span className="text-sm text-red-500 ml-2">(API data unavailable)</span>}
          </h3>
          
          {statistics?.processedRoutes ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.processedRoutes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="routes" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Processing data not available from API</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Risk Score Trends
            {!statistics && <span className="text-sm text-red-500 ml-2">(API data unavailable)</span>}
          </h3>
          
          {statistics?.riskTrends ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.riskTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgRisk" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Risk trends data not available from API</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Alerts
            {alerts.length === 0 && <span className="text-sm text-red-500 ml-2">(API data unavailable)</span>}
          </h3>
          
          {alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.priority === 'critical' ? 'bg-red-500' :
                      alert.priority === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">{formatDate(alert?.timestamp)}</p>
                  </div>
                  <Badge variant={alert.priority} size="sm">
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No alerts available from API</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            className="justify-start"
            onClick={() => window.location.href = '/bulk-processor'}
          >
            <Route className="w-5 h-5 mr-2" />
            Process New Routes
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => window.location.href = '/routes'}
          >
            <Map className="w-5 h-5 mr-2" />
            View All Routes
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => window.location.href = '/reports'}
          >
            <Activity className="w-5 h-5 mr-2" />
            Generate Reports
          </Button>
        </div>
      </Card>

      {/* API Status Indicator */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <p className="text-sm text-blue-800">
            Dashboard displaying real-time data from API endpoints
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard