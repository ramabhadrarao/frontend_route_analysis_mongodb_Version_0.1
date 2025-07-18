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

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [overviewData, statisticsData, alertsData] = await Promise.all([
        apiService.dashboard.getOverview(),
        apiService.dashboard.getStatistics(),
        apiService.dashboard.getAlerts()
      ])

      setOverview(overviewData)
      setStatistics(statisticsData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Dashboard load error:', error)
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
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  const mockOverview = {
    totalRoutes: 1247,
    highRiskRoutes: 89,
    totalDistance: 15678.5,
    averageRiskScore: 42.8,
    activeProcessing: 3,
    completedToday: 12
  }

  const mockStatistics = {
    riskDistribution: [
      { name: 'Low Risk', value: 678, color: '#22c55e' },
      { name: 'Medium Risk', value: 345, color: '#f59e0b' },
      { name: 'High Risk', value: 156, color: '#f97316' },
      { name: 'Critical Risk', value: 68, color: '#ef4444' }
    ],
    processedRoutes: [
      { month: 'Jan', routes: 120 },
      { month: 'Feb', routes: 145 },
      { month: 'Mar', routes: 178 },
      { month: 'Apr', routes: 156 },
      { month: 'May', routes: 203 },
      { month: 'Jun', routes: 189 }
    ],
    riskTrends: [
      { month: 'Jan', avgRisk: 38.5 },
      { month: 'Feb', avgRisk: 42.1 },
      { month: 'Mar', avgRisk: 39.8 },
      { month: 'Apr', avgRisk: 44.2 },
      { month: 'May', avgRisk: 41.7 },
      { month: 'Jun', avgRisk: 42.8 }
    ]
  }

  const mockAlerts = [
    {
      id: 1,
      type: 'high_risk',
      message: 'Route R-2024-001 has high accident risk areas',
      timestamp: new Date().toISOString(),
      priority: 'high'
    },
    {
      id: 2,
      type: 'processing',
      message: 'Bulk processing completed for 45 routes',
      timestamp: new Date().toISOString(),
      priority: 'medium'
    },
    {
      id: 3,
      type: 'network',
      message: 'Critical network dead zones detected on 3 routes',
      timestamp: new Date().toISOString(),
      priority: 'critical'
    }
  ]

  const currentOverview = overview || mockOverview
  const currentStatistics = statistics || mockStatistics
  const currentAlerts = alerts.length > 0 ? alerts : mockAlerts

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your journey risk management system</p>
        </div>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{currentOverview.totalRoutes}</p>
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
              <p className="text-2xl font-bold text-red-600">{currentOverview.highRiskRoutes}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatDistance(currentOverview.totalDistance)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{currentOverview.averageRiskScore}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={currentStatistics.riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {currentStatistics.riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Route Processing</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentStatistics.processedRoutes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="routes" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentStatistics.riskTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgRisk" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {currentAlerts.slice(0, 5).map((alert) => (
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
                  <p className="text-xs text-gray-500">{formatDate(alert.timestamp)}</p>
                </div>
                <Badge variant={alert.priority} size="sm">
                  {alert.priority}
                </Badge>
              </div>
            ))}
          </div>
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
    </div>
  )
}

export default Dashboard