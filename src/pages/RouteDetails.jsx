import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Map, 
  AlertTriangle,
  Eye,
  Phone,
  Wifi,
  Construction,
  Navigation,
  Activity,
  BarChart3,
  Cloud,
  Car,
  Filter,
  MapPin,
  Clock,
  Shield,
  Thermometer,
  Wind,
  CloudRain,
  Sun,
  Snowflake,
  Zap,
  Cross,
  Truck,
  Users,
  Search,
  ToggleLeft,
  ToggleRight,
  Edit,
  Save,
  X
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { apiService } from '../services/apiService'
import { routeService, routeController } from '../services'
import { formatDistance, formatDate, getRiskLevel, getRiskColor } from '../utils/helpers'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import Modal from '../components/UI/Modal'
import RouteMap from '../components/Maps/RouteMap'
import toast from 'react-hot-toast'

const RouteDetails = () => {
  const { _id } = useParams()
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapData, setMapData] = useState({
    gpsPoints: [],
    sharpTurns: [],
    blindSpots: [],
    emergencyServices: [],
    accidentAreas: [],
    roadConditions: [],
    networkCoverage: [],
    weatherData: [],
    trafficData: []
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    emergencyServiceType: 'all',
    weatherCondition: 'all',
    trafficSeverity: 'all',
    roadConditionType: 'all'
  })
  const [mapToggles, setMapToggles] = useState({
    showGPSPoints: true,
    showSharpTurns: true,
    showBlindSpots: true,
    showEmergencyServices: true,
    showAccidentAreas: true,
    showRoadConditions: true,
    showNetworkCoverage: true,
    showWeatherData: true,
    showTrafficData: true
  })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  useEffect(() => {
    if (_id) {
      loadRouteDetails()
    }
  }, [_id])

  const loadRouteDetails = async () => {
    try {
      setLoading(true)
      console.log('Loading route details for ID:', _id)
      console.log('Route ID type:', typeof _id)
      console.log('Route ID length:', _id ? _id.length : 'undefined')
      
      // Check authentication
      const token = localStorage.getItem('authToken')
      console.log('Auth token exists:', !!token)
      if (!token) {
        try {
          console.log('Attempting auto-login...')
          const loginResponse = await apiService.auth.login({
            email: 'test@example.com',
            password: 'Test123456'
          })
          if (loginResponse.token) {
            localStorage.setItem('authToken', loginResponse.token)
            console.log('Auto-login successful')
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError)
          toast.error('Authentication required. Please login.')
          return
        }
      }
      
      // Use the new route service for comprehensive data loading
      console.log('Fetching comprehensive route data using routeService...')
      const result = await routeService.getRouteDetails(_id, {
        includeGPS: true,
        includeEmergencyServices: true,
        includeWeather: true,
        includeTraffic: true,
        includeAccidentAreas: true,
        includeRoadConditions: true,
        includeSharpTurns: true,
        includeBlindSpots: true,
        includeNetworkCoverage: true,
        includeRiskAnalysis: true
      })
      
      console.log('RouteService result:', result)
      console.log('Result success:', result?.success)
      console.log('Result data:', result?.data)
      console.log('Route data:', result?.data?.route)
      
      if (result.success && result.data.route) {
        const routeData = result.data.route
        setRoute(routeData)
        console.log('Route data loaded successfully:', routeData)
        
        // Process and set map data from the comprehensive result
        const newMapData = {
          gpsPoints: processResult(result.data.gpsPoints),
          sharpTurns: processResult(result.data.sharpTurns),
          blindSpots: processResult(result.data.blindSpots),
          emergencyServices: processResult(result.data.emergencyServices),
          accidentAreas: processResult(result.data.accidentAreas),
          roadConditions: processResult(result.data.roadConditions),
          networkCoverage: processResult(result.data.networkCoverage),
          weatherData: processResult(result.data.weatherData),
          trafficData: processResult(result.data.trafficData)
        }
        
        setMapData(newMapData)
        console.log('Map data processed and set:', newMapData)
        
        // Log any errors that occurred during data fetching
        if (result.errors && result.errors.length > 0) {
          console.warn('Some data failed to load:', result.errors)
          result.errors.forEach(error => {
            console.warn(`Failed to load ${error.key}:`, error.error)
          })
        }
      } else {
        throw new Error('Failed to load route data')
      }

      // Data loading is now handled by routeService.getRouteDetails above
    } catch (error) {
      console.error('Route details load error:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error('Failed to load route details')
      setRoute(null)
    } finally {
      setLoading(false)
      console.log('Route details loading completed. Loading state:', false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      // Use the route's actual _id if available, otherwise fall back to the URL parameter
      const routeId = route?._id || _id
      const response = await routeService.generateReport(routeId, 'pdf')
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

  const handleEditRoute = () => {
    if (route) {
      reset({
        routeName: route.routeName || '',
        fromName: route.fromName || '',
        toName: route.toName || '',
        fromAddress: route.fromAddress || '',
        toAddress: route.toAddress || '',
        description: route.description || ''
      })
      setIsEditModalOpen(true)
    }
  }

  // Process API results to ensure consistent array format
  const processResult = (data) => {
    if (!data) return []
    if (Array.isArray(data)) return data
    
    // Try to extract array from common response patterns
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.results && Array.isArray(data.results)) return data.results
    if (data.items && Array.isArray(data.items)) return data.items
    if (data.services && Array.isArray(data.services)) return data.services
    if (data.conditions && Array.isArray(data.conditions)) return data.conditions
    if (data.areas && Array.isArray(data.areas)) return data.areas
    if (data.turns && Array.isArray(data.turns)) return data.turns
    if (data.spots && Array.isArray(data.spots)) return data.spots
    if (data.points && Array.isArray(data.points)) return data.points
    
    // If it's an object, wrap it in an array
    if (typeof data === 'object') return [data]
    
    return []
  }

  const handleUpdateRoute = async (data) => {
    try {
      setIsUpdating(true)
      const routeId = route?._id || _id
      
      const updateData = {
        routeName: data.routeName,
        fromName: data.fromName,
        toName: data.toName,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        description: data.description
      }

      const response = await routeService.updateRoute(routeId, updateData)
      
      // Update the local route state
      setRoute(prev => ({
        ...prev,
        ...updateData
      }))
      
      setIsEditModalOpen(false)
      toast.success('Route updated successfully!')
    } catch (error) {
      console.error('Update route error:', error)
      toast.error('Failed to update route')
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper function to safely get array length
  const getArrayLength = (arr) => Array.isArray(arr) ? arr.length : 0

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'map', label: 'Interactive Map', icon: Map },
    { id: 'emergency', label: 'Emergency Services', icon: Phone },
    { id: 'weather', label: 'Weather Conditions', icon: Cloud },
    { id: 'traffic', label: 'Traffic Data', icon: Car },
    { id: 'road-conditions', label: 'Road Conditions', icon: Construction },
    { id: 'analysis', label: 'Risk Analysis', icon: BarChart3 }
  ]

  // Helper functions
  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'clear': return <Sun className="w-4 h-4" />
      case 'heavy rain': case 'rain': return <CloudRain className="w-4 h-4" />
      case 'fog': return <Cloud className="w-4 h-4" />
      case 'snow': return <Snowflake className="w-4 h-4" />
      case 'storm': return <Zap className="w-4 h-4" />
      default: return <Cloud className="w-4 h-4" />
    }
  }

  const getTrafficColor = (density) => {
    switch (density.toLowerCase()) {
      case 'light': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'heavy': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoadConditionColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getEmergencyServiceIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'hospital': return <Cross className="w-4 h-4" />
      case 'police': return <Shield className="w-4 h-4" />
      case 'fire': return <Zap className="w-4 h-4" />
      case 'mechanic': return <Truck className="w-4 h-4" />
      default: return <Phone className="w-4 h-4" />
    }
  }

  // Filter functions
  const getFilteredEmergencyServices = () => {
    if (!Array.isArray(mapData.emergencyServices)) return []
    if (filters.emergencyServiceType === 'all') return mapData.emergencyServices
    return mapData.emergencyServices.filter(service => 
      service.serviceType.toLowerCase() === filters.emergencyServiceType.toLowerCase()
    )
  }

  const getFilteredWeatherData = () => {
    if (!Array.isArray(mapData.weatherData)) return []
    if (filters.weatherCondition === 'all') return mapData.weatherData
    return mapData.weatherData.filter(weather => 
      weather.weatherCondition.toLowerCase().includes(filters.weatherCondition.toLowerCase())
    )
  }

  const getFilteredTrafficData = () => {
    if (!Array.isArray(mapData.trafficData)) return []
    if (filters.trafficSeverity === 'all') return mapData.trafficData
    return mapData.trafficData.filter(traffic => 
      traffic.trafficDensity.toLowerCase() === filters.trafficSeverity.toLowerCase()
    )
  }

  const getFilteredRoadConditions = () => {
    if (!Array.isArray(mapData.roadConditions)) return []
    if (filters.roadConditionType === 'all') return mapData.roadConditions
    return mapData.roadConditions.filter(condition => 
      condition.conditionType.toLowerCase() === filters.roadConditionType.toLowerCase()
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading route details..." />
      </div>
    )
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Route not found</h3>
        <p className="text-gray-500">The requested route could not be found.</p>
        <Link to="/routes">
          <Button variant="primary" className="mt-4">
            Back to Routes
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/routes">
            <Button variant="outline" icon={ArrowLeft}>
              Back to Routes
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{route.routeName}</h1>
            <p className="text-gray-600">Route ID: {route._id}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={Edit}
            onClick={handleEditRoute}
          >
            Edit Route
          </Button>
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={loadRouteDetails}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={handleDownloadReport}
          >
            Download Report
          </Button>
        </div>
      </div>

      {/* Route Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Distance</p>
              <p className="text-lg font-bold text-gray-900">{formatDistance(route.totalDistance)}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Navigation className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Risk Score</p>
              <div className="flex items-center space-x-1">
                <p className="text-lg font-bold text-gray-900">{route.riskScore}</p>
                <Badge variant={route.riskLevel} className="text-xs">{getRiskLevel(route.riskScore)}</Badge>
              </div>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Sharp Turns</p>
              <p className="text-lg font-bold text-gray-900">{getArrayLength(mapData.sharpTurns)}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Navigation className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Blind Spots</p>
              <p className="text-lg font-bold text-gray-900">{getArrayLength(mapData.blindSpots)}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <Eye className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Weather Risks</p>
              <p className="text-lg font-bold text-gray-900">{Array.isArray(mapData.weatherData) ? mapData.weatherData.filter(w => w.riskScore > 50).length : 0}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Cloud className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Traffic Issues</p>
              <p className="text-lg font-bold text-gray-900">{Array.isArray(mapData.trafficData) ? mapData.trafficData.filter(t => t.congestionLevel === 'High').length : 0}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Car className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="p-0">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium text-gray-900">{route.fromAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium text-gray-900">{route.toAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Major Highways</p>
                      <p className="font-medium text-gray-900">{route.majorHighways?.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Terrain</p>
                      <p className="font-medium text-gray-900">{route.terrain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">{formatDate(route?.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sharp Turns</span>
                      <Badge variant="warning">{Array.isArray(mapData.sharpTurns) ? mapData.sharpTurns.length : 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Blind Spots</span>
                      <Badge variant="danger">{Array.isArray(mapData.blindSpots) ? mapData.blindSpots.length : 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Accident Areas</span>
                      <Badge variant="danger">{Array.isArray(mapData.accidentAreas) ? mapData.accidentAreas.length : 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Emergency Services</span>
                      <Badge variant="success">{Array.isArray(mapData.emergencyServices) ? mapData.emergencyServices.length : 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Network Dead Zones</span>
                      <Badge variant="warning">{Array.isArray(mapData.networkCoverage) ? mapData.networkCoverage.filter(c => c.isDeadZone).length : 0}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-6">
              {/* Map Controls */}
              <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Map Layer Controls</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(mapToggles).map(([key, value]) => {
                    const label = key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()
                    return (
                      <button
                        key={key}
                        onClick={() => setMapToggles(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                          value 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span>{label}</span>
                        {value ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
              </Card>
              
              <RouteMap
                route={route}
                gpsPoints={mapData.gpsPoints || []}
                sharpTurns={mapToggles.showSharpTurns ? (mapData.sharpTurns || []) : []}
                blindSpots={mapToggles.showBlindSpots ? (mapData.blindSpots || []) : []}
                emergencyServices={mapToggles.showEmergencyServices ? (mapData.emergencyServices || []) : []}
                accidentAreas={mapToggles.showAccidentAreas ? (mapData.accidentAreas || []) : []}
                roadConditions={mapToggles.showRoadConditions ? (mapData.roadConditions || []) : []}
                networkCoverage={mapToggles.showNetworkCoverage ? (mapData.networkCoverage || []) : []}
                weatherData={mapToggles.showWeatherData ? (mapData.weatherData || []) : []}
                trafficData={mapToggles.showTrafficData ? (mapData.trafficData || []) : []}
              />
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-6">
              {/* Emergency Services Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.emergencyServiceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, emergencyServiceType: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Services</option>
                  <option value="hospital">Hospitals</option>
                  <option value="police">Police</option>
                  <option value="fire">Fire Department</option>
                  <option value="mechanic">Mechanics</option>
                </select>
              </div>

              {/* Emergency Services List */}
              <div className="grid gap-4">
                {getFilteredEmergencyServices().map((service, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          {getEmergencyServiceIcon(service.serviceType)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{service.serviceType}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Phone</p>
                              <p className="font-medium">{service.phoneNumber}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Distance from Route</p>
                              <p className="font-medium">{service.distanceFromRouteKm} km</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Response Time</p>
                              <p className="font-medium">{service.responseTimeMinutes} min</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" className="text-xs">
                        Available
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'weather' && (
            <div className="space-y-6">
              {/* Weather Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.weatherCondition}
                  onChange={(e) => setFilters(prev => ({ ...prev, weatherCondition: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Conditions</option>
                  <option value="clear">Clear</option>
                  <option value="rain">Rain</option>
                  <option value="fog">Fog</option>
                  <option value="storm">Storm</option>
                </select>
              </div>

              {/* Weather Data List */}
              <div className="grid gap-4">
                {getFilteredWeatherData().map((weather, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          {getWeatherIcon(weather.weatherCondition)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{weather.weatherCondition}</h4>
                          <p className="text-sm text-gray-600">km {weather.distanceFromStartKm}</p>
                        </div>
                      </div>
                      <Badge variant={weather.riskScore > 70 ? 'danger' : weather.riskScore > 40 ? 'warning' : 'success'}>
                        Risk: {weather.riskScore}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Temperature</p>
                        <div className="flex items-center space-x-1">
                          <Thermometer className="w-3 h-3" />
                          <span className="font-medium">{weather.temperature}°C</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500">Humidity</p>
                        <p className="font-medium">{weather.humidity}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Wind Speed</p>
                        <div className="flex items-center space-x-1">
                          <Wind className="w-3 h-3" />
                          <span className="font-medium">{weather.windSpeed} km/h</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500">Visibility</p>
                        <p className="font-medium">{weather.visibility}m</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Recommendations:</strong> {weather.recommendations}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'traffic' && (
            <div className="space-y-6">
              {/* Traffic Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.trafficSeverity}
                  onChange={(e) => setFilters(prev => ({ ...prev, trafficSeverity: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Traffic Levels</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>

              {/* Traffic Data List */}
              <div className="grid gap-4">
                {getFilteredTrafficData().map((traffic, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <Car className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Traffic Zone</h4>
                          <p className="text-sm text-gray-600">km {traffic.distanceFromStartKm}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getTrafficColor(traffic.trafficDensity)}`}>
                          {traffic.trafficDensity}
                        </Badge>
                        <Badge variant={traffic.riskScore > 70 ? 'danger' : traffic.riskScore > 40 ? 'warning' : 'success'}>
                          Risk: {traffic.riskScore}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Average Speed</p>
                        <p className="font-medium">{traffic.averageSpeed} km/h</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Congestion</p>
                        <p className="font-medium">{traffic.congestionLevel}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Estimated Delay</p>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{traffic.estimatedDelay} min</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500">Accidents</p>
                        <p className="font-medium">{traffic.accidentReports}</p>
                      </div>
                    </div>
                    
                    {traffic.peakHours !== 'None' && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Peak Hours:</strong> {traffic.peakHours}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'road-conditions' && (
            <div className="space-y-6">
              {/* Road Conditions Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.roadConditionType}
                  onChange={(e) => setFilters(prev => ({ ...prev, roadConditionType: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Conditions</option>
                  <option value="pothole">Potholes</option>
                  <option value="construction">Construction</option>
                  <option value="flooding">Flooding</option>
                  <option value="debris">Debris</option>
                </select>
              </div>

              {/* Road Conditions List */}
              <div className="grid gap-4">
                {getFilteredRoadConditions().map((condition, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Construction className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{condition.conditionType}</h4>
                          <p className="text-sm text-gray-600">km {condition.distanceFromStartKm}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getRoadConditionColor(condition.severity)}`}>
                          {condition.severity}
                        </Badge>
                        <Badge variant={condition.riskScore > 70 ? 'danger' : condition.riskScore > 40 ? 'warning' : 'success'}>
                          Risk: {condition.riskScore}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Affected Lanes</p>
                        <p className="font-medium">{condition.affectedLanes}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Reported Date</p>
                        <p className="font-medium">{formatDate(condition?.reportedDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Repair Time</p>
                        <p className="font-medium">{condition.estimatedRepairTime}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Risk Factors</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sharp Turns Risk</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Visibility Risk</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                        <span className="text-sm font-medium">82%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Accident Risk</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Network Risk</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p>Reduce speed at sharp turns (km 45.2 and 89.1)</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <p>Exercise extreme caution at blind spot (km 67.3)</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <p>High accident zone at km 72.5 - maintain safe distance</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <p>Network dead zone at km 35.2 - inform contacts beforehand</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Route Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Route Details"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleUpdateRoute)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Name
              </label>
              <input
                type="text"
                {...register('routeName', { required: 'Route name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter route name"
              />
              {errors.routeName && (
                <p className="text-red-500 text-xs mt-1">{errors.routeName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Location
              </label>
              <input
                type="text"
                {...register('fromName', { required: 'From location is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter origin location"
              />
              {errors.fromName && (
                <p className="text-red-500 text-xs mt-1">{errors.fromName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Location
              </label>
              <input
                type="text"
                {...register('toName', { required: 'To location is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter destination location"
              />
              {errors.toName && (
                <p className="text-red-500 text-xs mt-1">{errors.toName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Address
              </label>
              <input
                type="text"
                {...register('fromAddress')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter full origin address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Address
            </label>
            <input
              type="text"
              {...register('toAddress')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full destination address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter route description (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Route'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default RouteDetails