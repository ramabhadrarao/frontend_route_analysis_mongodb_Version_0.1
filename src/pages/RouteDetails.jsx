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
  Edit,
  Save,
  X
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '../services/authService'
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
  const [error, setError] = useState(null)
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
    roadConditionType: 'all',
    sharpTurnSeverity: 'all'
  })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dataLoadingStates, setDataLoadingStates] = useState({})

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
      setError(null)
      
      console.log('Frontend RouteDetails: Loading route from API:', _id)
      
      // First, load the basic route information
      const routeResponse = await api.get(`/api/routes/${_id}`)
      console.log('Frontend RouteDetails: Route API response:', routeResponse.data)
      
      if (routeResponse.data) {
        setRoute(routeResponse.data)
        
        // Then load all the related data in parallel
        await loadAllRouteData()
      } else {
        throw new Error('No route data received from API')
      }
      
    } catch (error) {
      console.error('Frontend RouteDetails: Route loading error:', error)
      setError(`Failed to load route: ${error.response?.data?.message || error.message}`)
      setRoute(null)
      toast.error(`Failed to load route: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadAllRouteData = async () => {
    const dataEndpoints = [
      { key: 'gpsPoints', url: `/api/routes/${_id}/gps-points` },
      { key: 'emergencyServices', url: `/api/routes/${_id}/emergency-services` },
      { key: 'weatherData', url: `/api/routes/${_id}/weather-data` },
      { key: 'trafficData', url: `/api/routes/${_id}/traffic-data` },
      { key: 'accidentAreas', url: `/api/routes/${_id}/accident-areas` },
      { key: 'roadConditions', url: `/api/routes/${_id}/road-conditions` },
      { key: 'sharpTurns', url: `/api/routes/${_id}/sharp-turns` },
      { key: 'blindSpots', url: `/api/routes/${_id}/blind-spots` }
    ]

    // Load all data in parallel with individual error handling
    const results = await Promise.allSettled(
      dataEndpoints.map(async (endpoint) => {
        try {
          console.log(`Frontend RouteDetails: Loading ${endpoint.key} from ${endpoint.url}`)
          const response = await api.get(endpoint.url)
          return { key: endpoint.key, data: response.data, success: true }
        } catch (error) {
          console.warn(`Frontend RouteDetails: Failed to load ${endpoint.key}:`, error.message)
          return { key: endpoint.key, data: [], success: false, error: error.message }
        }
      })
    )

    // Process results and update map data
    const newMapData = { ...mapData }
    const loadingStates = {}

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { key, data, success, error } = result.value
        
        if (success) {
          // Extract array from API response
          newMapData[key] = extractDataArray(data)
          loadingStates[key] = 'success'
          console.log(`Frontend RouteDetails: ${key} loaded successfully:`, newMapData[key].length, 'items')
        } else {
          newMapData[key] = []
          loadingStates[key] = 'error'
          console.warn(`Frontend RouteDetails: ${key} failed:`, error)
        }
      } else {
        const key = dataEndpoints.find(e => result.reason?.config?.url?.includes(e.url.split('/').pop()))?.key || 'unknown'
        newMapData[key] = []
        loadingStates[key] = 'error'
      }
    })

    setMapData(newMapData)
    setDataLoadingStates(loadingStates)
    
    console.log('Frontend RouteDetails: All data loading completed:', {
      ...Object.keys(newMapData).reduce((acc, key) => {
        acc[key] = newMapData[key].length
        return acc
      }, {}),
      loadingStates
    })
  }

  const extractDataArray = (apiResponse) => {
    console.log('🔍 Extracting data from API response:', apiResponse)
    
    if (!apiResponse) return []
    
    // Direct array check
    if (Array.isArray(apiResponse)) {
      console.log('✅ Direct array response:', apiResponse.length, 'items')
      return apiResponse
    }
    
    // Check for success flag first
    if (apiResponse.success === false) {
      console.log('❌ API returned success: false')
      return []
    }
    
    // NEW: Check for direct array properties at root level (your current API structure)
    const directArrayKeys = [
      'accidentAreas', 'roadConditions', 'emergencyServices', 'services',
      'gpsPoints', 'sharpTurns', 'blindSpots', 'networkCoverage',
      'weatherData', 'trafficData', 'weatherPoints', 'trafficPoints'
    ]
    
    for (const key of directArrayKeys) {
      if (apiResponse[key] && Array.isArray(apiResponse[key])) {
        console.log(`✅ Found direct ${key} array:`, apiResponse[key].length, 'items')
        return apiResponse[key]
      }
    }
    
    // Handle your specific API structure: { success: true, data: { specificArray: [...] } }
    if (apiResponse.success && apiResponse.data) {
      const dataObj = apiResponse.data
      
      // Check for specific array properties in the nested data object
      if (dataObj.gpsPoints && Array.isArray(dataObj.gpsPoints)) {
        console.log('✅ Found gpsPoints array:', dataObj.gpsPoints.length, 'items')
        return dataObj.gpsPoints
      }
      
      if (dataObj.sharpTurns && Array.isArray(dataObj.sharpTurns)) {
        console.log('✅ Found sharpTurns array:', dataObj.sharpTurns.length, 'items')
        return dataObj.sharpTurns
      }
      
      if (dataObj.blindSpots && Array.isArray(dataObj.blindSpots)) {
        console.log('✅ Found blindSpots array:', dataObj.blindSpots.length, 'items')
        return dataObj.blindSpots
      }
      
      if (dataObj.emergencyServices && Array.isArray(dataObj.emergencyServices)) {
        console.log('✅ Found emergencyServices array:', dataObj.emergencyServices.length, 'items')
        return dataObj.emergencyServices
      }
      
      if (dataObj.accidentAreas && Array.isArray(dataObj.accidentAreas)) {
        console.log('✅ Found accidentAreas array:', dataObj.accidentAreas.length, 'items')
        return dataObj.accidentAreas
      }
      
      if (dataObj.roadConditions && Array.isArray(dataObj.roadConditions)) {
        console.log('✅ Found roadConditions array:', dataObj.roadConditions.length, 'items')
        return dataObj.roadConditions
      }
      
      if (dataObj.networkCoverage && Array.isArray(dataObj.networkCoverage)) {
        console.log('✅ Found networkCoverage array:', dataObj.networkCoverage.length, 'items')
        return dataObj.networkCoverage
      }
      
      if (dataObj.weatherData && Array.isArray(dataObj.weatherData)) {
        console.log('✅ Found weatherData array:', dataObj.weatherData.length, 'items')
        return dataObj.weatherData
      }
      
      if (dataObj.trafficData && Array.isArray(dataObj.trafficData)) {
        console.log('✅ Found trafficData array:', dataObj.trafficData.length, 'items')
        return dataObj.trafficData
      }
      
      // Fallback: check if data itself is an array
      if (Array.isArray(dataObj)) {
        console.log('✅ Data object is array:', dataObj.length, 'items')
        return dataObj
      }
      
      // Check for generic array properties
      if (dataObj.results && Array.isArray(dataObj.results)) {
        console.log('✅ Found results array:', dataObj.results.length, 'items')
        return dataObj.results
      }
      
      if (dataObj.items && Array.isArray(dataObj.items)) {
        console.log('✅ Found items array:', dataObj.items.length, 'items')
        return dataObj.items
      }
    }
    
    // Fallback for other response formats
    if (apiResponse.data && Array.isArray(apiResponse.data)) {
      console.log('✅ Found direct data array:', apiResponse.data.length, 'items')
      return apiResponse.data
    }
    
    if (apiResponse.results && Array.isArray(apiResponse.results)) {
      console.log('✅ Found direct results array:', apiResponse.results.length, 'items')
      return apiResponse.results
    }
    
    // Single object fallback
    if (typeof apiResponse === 'object' && apiResponse !== null) {
      console.log('⚠️ Single object converted to array')
      return [apiResponse]
    }
    
    console.warn('❌ No valid array data found, returning empty array')
    return []
  }

  const handleDownloadReport = async () => {
    try {
      const routeId = route?._id || _id
      toast.success(`Preparing report for route ${routeId}...`)
      // Implement actual download when ready
      toast.info('Report download feature will be implemented soon')
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

      console.log('Frontend RouteDetails: Updating route via API:', updateData)
      const response = await api.put(`/api/routes/${routeId}`, updateData)
      
      if (response.data) {
        // Update the local route state
        setRoute(prev => ({
          ...prev,
          ...updateData
        }))
        
        setIsEditModalOpen(false)
        toast.success('Route updated successfully!')
      } else {
        throw new Error('Update failed - no response data')
      }
    } catch (error) {
      console.error('Frontend RouteDetails: Update route error:', error)
      toast.error(`Failed to update route: ${error.response?.data?.message || error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper function to safely get array length
  const getArrayLength = (arr) => Array.isArray(arr) ? arr.length : 0

  // Safe data extraction helpers
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue
    } catch {
      return defaultValue
    }
  }

  const getRouteRiskLevel = (route) => {
    return route?.riskLevel || getRiskLevel(route?.riskScore || route?.riskScores?.totalWeightedScore || 0)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'map', label: 'Interactive Map', icon: Map },
    { id: 'emergency', label: 'Emergency Services', icon: Phone },
    { id: 'weather', label: 'Weather Conditions', icon: Cloud },
    { id: 'traffic', label: 'Traffic Data', icon: Car },
    { id: 'road-conditions', label: 'Road Conditions', icon: Construction },
    { id: 'analysis', label: 'Risk Analysis', icon: BarChart3 }
  ]

  // Helper functions for data filtering and display
  const getFilteredEmergencyServices = () => {
    if (!Array.isArray(mapData.emergencyServices)) return []
    if (filters.emergencyServiceType === 'all') return mapData.emergencyServices
    return mapData.emergencyServices.filter(service => 
      service.serviceType?.toLowerCase() === filters.emergencyServiceType.toLowerCase()
    )
  }

  const getFilteredWeatherData = () => {
    if (!Array.isArray(mapData.weatherData)) return []
    if (filters.weatherCondition === 'all') return mapData.weatherData
    return mapData.weatherData.filter(weather => 
      weather.condition?.toLowerCase().includes(filters.weatherCondition.toLowerCase())
    )
  }

  const getFilteredTrafficData = () => {
    if (!Array.isArray(mapData.trafficData)) return []
    if (filters.trafficSeverity === 'all') return mapData.trafficData
    
    // Handle the actual congestion level values from API
    const filterValue = filters.trafficSeverity === 'freeFlow' ? 'free_flow' : filters.trafficSeverity
    
    return mapData.trafficData.filter(traffic => 
      traffic.congestionLevel?.toLowerCase() === filterValue.toLowerCase()
    )
  }

  const getFilteredRoadConditions = () => {
    console.log('🔍 Debug - Raw mapData.roadConditions:', mapData.roadConditions);
    console.log('🔍 Debug - Is array?', Array.isArray(mapData.roadConditions));
    console.log('🔍 Debug - Length:', mapData.roadConditions?.length);
    console.log('🔍 Debug - Sample item:', mapData.roadConditions?.[0]);
    
    if (!Array.isArray(mapData.roadConditions)) return []
    if (filters.roadConditionType === 'all') return mapData.roadConditions
    return mapData.roadConditions.filter(condition => 
      condition.surfaceQuality?.toLowerCase() === filters.roadConditionType.toLowerCase()
    )
  }

  // Display helper functions
  const getEmergencyServiceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'hospital': return <Phone className="w-4 h-4 text-red-600" />
      case 'police': return <Phone className="w-4 h-4 text-blue-600" />
      case 'fire': return <Phone className="w-4 h-4 text-orange-600" />
      case 'mechanic': return <Construction className="w-4 h-4 text-gray-600" />
      default: return <Phone className="w-4 h-4 text-green-600" />
    }
  }

  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'clear': return <Cloud className="w-4 h-4 text-blue-500" />
      case 'rain': return <Cloud className="w-4 h-4 text-gray-500" />
      case 'fog': return <Cloud className="w-4 h-4 text-gray-600" />
      default: return <Cloud className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrafficColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'free flow':
      case 'free_flow':
        return 'text-green-600 bg-green-100'
      case 'light': 
        return 'text-blue-600 bg-blue-100'
      case 'moderate': 
        return 'text-yellow-600 bg-yellow-100'
      case 'heavy': 
        return 'text-orange-600 bg-orange-100'
      case 'severe': 
        return 'text-red-600 bg-red-100'
      default: 
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoadConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'fair': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading route details from API..." />
      </div>
    )
  }

  if (error || !route) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          API Error
        </h3>
        <p className="text-gray-500 mb-4">
          {error || 'The requested route could not be loaded from the API.'}
        </p>
        <div className="space-x-3">
          <Button onClick={loadRouteDetails} variant="primary">
            Retry API Call
          </Button>
          <Link to="/routes">
            <Button variant="outline">
              Back to Routes
            </Button>
          </Link>
        </div>
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
            <p className="text-gray-600">Route ID: {route._id} (API Data)</p>
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
            Refresh API
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
              <p className="text-lg font-bold text-gray-900">
                {formatDistance(route.totalDistance)}
              </p>
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
                <p className="text-lg font-bold text-gray-900">
                  {route.riskScore || route.riskScores?.totalWeightedScore || 0}
                </p>
                <Badge variant={getRiskColor(getRouteRiskLevel(route))} className="text-xs">
                  {getRouteRiskLevel(route)}
                </Badge>
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
              {dataLoadingStates.sharpTurns === 'error' && 
                <p className="text-xs text-red-500">API Error</p>}
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
              {dataLoadingStates.blindSpots === 'error' && 
                <p className="text-xs text-red-500">API Error</p>}
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
              <p className="text-lg font-bold text-gray-900">
                {Array.isArray(mapData.weatherData) ? 
                  mapData.weatherData.filter(w => (w.riskScore || 0) > 50).length : 0}
              </p>
              {dataLoadingStates.weatherData === 'error' && 
                <p className="text-xs text-red-500">API Error</p>}
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
              <p className="text-lg font-bold text-gray-900">
                {Array.isArray(mapData.trafficData) ? 
                  mapData.trafficData.filter(t => 
                    t.congestionLevel === 'heavy' || t.congestionLevel === 'severe'
                  ).length : 0}
              </p>
              {dataLoadingStates.trafficData === 'error' && 
                <p className="text-xs text-red-500">API Error</p>}
            </div>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Car className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Data Loading Status */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-blue-800">
              Route data loaded from API - {Object.values(dataLoadingStates).filter(s => s === 'success').length} of {Object.keys(dataLoadingStates).length} endpoints successful
            </p>
          </div>
          {Object.values(dataLoadingStates).some(s => s === 'error') && (
            <Badge variant="warning" size="sm">
              Some data unavailable
            </Badge>
          )}
        </div>
      </Card>

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
                      <p className="font-medium text-gray-900">{route.fromAddress || route.fromName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium text-gray-900">{route.toAddress || route.toName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Major Highways</p>
                      <p className="font-medium text-gray-900">
                        {Array.isArray(route.majorHighways) ? route.majorHighways.join(', ') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Terrain</p>
                      <p className="font-medium text-gray-900">{route.terrain || 'Mixed'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">{formatDate(route.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Summary (From API)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sharp Turns</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="warning">{getArrayLength(mapData.sharpTurns)}</Badge>
                        {dataLoadingStates.sharpTurns === 'error' && 
                          <span className="text-xs text-red-500">API Error</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Blind Spots</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="danger">{getArrayLength(mapData.blindSpots)}</Badge>
                        {dataLoadingStates.blindSpots === 'error' && 
                          <span className="text-xs text-red-500">API Error</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Accident Areas</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="danger">{getArrayLength(mapData.accidentAreas)}</Badge>
                        {dataLoadingStates.accidentAreas === 'error' && 
                          <span className="text-xs text-red-500">API Error</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Emergency Services</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="success">{getArrayLength(mapData.emergencyServices)}</Badge>
                        {dataLoadingStates.emergencyServices === 'error' && 
                          <span className="text-xs text-red-500">API Error</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Network Dead Zones</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="warning">
                          {Array.isArray(mapData.networkCoverage) ? 
                            mapData.networkCoverage.filter(c => c.isDeadZone).length : 0}
                        </Badge>
                        {dataLoadingStates.networkCoverage === 'error' && 
                          <span className="text-xs text-red-500">API Error</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-6">
              <RouteMap
                routeData={route}
                gpsPoints={mapData.gpsPoints || []}
                sharpTurns={mapData.sharpTurns || []}
                blindSpots={mapData.blindSpots || []}
                emergencyServices={mapData.emergencyServices || []}
                accidentAreas={mapData.accidentAreas || []}
                roadConditions={mapData.roadConditions || []}
                networkCoverage={mapData.networkCoverage || []}
              />
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-6">
              {/* Emergency Services content - existing code */}
            </div>
          )}

          {/* Weather Conditions Tab */}
          {activeTab === 'weather' && (
            <div className="space-y-6">
              {/* Weather Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.weatherCondition || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, weatherCondition: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Weather Conditions</option>
                  <option value="clear">Clear</option>
                  <option value="rainy">Rainy</option>
                  <option value="fog">Fog</option>
                  <option value="snow">Snow</option>
                </select>
                {dataLoadingStates.weatherData === 'error' && (
                  <Badge variant="danger" size="sm">API Error</Badge>
                )}
              </div>

              {/* Weather Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{getArrayLength(mapData.weatherData)}</p>
                    <p className="text-sm text-gray-600">Total Weather Points</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {getFilteredWeatherData().filter(w => w.condition === 'clear').length}
                    </p>
                    <p className="text-sm text-gray-600">Clear</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {getFilteredWeatherData().filter(w => w.condition === 'rainy').length}
                    </p>
                    <p className="text-sm text-gray-600">Rainy</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {getFilteredWeatherData().filter(w => ['fog', 'snow'].includes(w.condition)).length}
                    </p>
                    <p className="text-sm text-gray-600">Poor Visibility</p>
                  </div>
                </Card>
              </div>

              {/* Weather Data Table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Point
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Condition
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Temperature (°F)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visibility (km)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wind Speed (km/h)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Surface
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredWeatherData().map((weather, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Weather Point {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {weather.coordinates?.latitude?.toFixed(5)}, {weather.coordinates?.longitude?.toFixed(5)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getWeatherIcon(weather.condition)}
                              <span className="capitalize">{weather.condition || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {weather.temperature?.toFixed(1) || 'N/A'}°F
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {weather.visibility?.toFixed(1) || 'N/A'} km
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {weather.windSpeed?.toFixed(1) || 'N/A'} km/h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Badge variant={weather.riskScore >= 7 ? 'danger' : weather.riskScore >= 5 ? 'warning' : 'success'}>
                              {weather.riskScore || 'N/A'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {weather.surfaceCondition || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {getFilteredWeatherData().length === 0 && (
                  <div className="text-center py-8">
                    <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {dataLoadingStates.weatherData === 'error' 
                        ? 'Failed to load weather data from API' 
                        : 'No weather data found'}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Traffic Data Tab */}
          {activeTab === 'traffic' && (
            <div className="space-y-6">
              {/* Traffic Data Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.trafficSeverity}
                  onChange={(e) => setFilters(prev => ({ ...prev, trafficSeverity: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Traffic Levels</option>
                  <option value="freeFlow">Free Flow</option>
                  <option value="light">Light Traffic</option>
                  <option value="moderate">Moderate Traffic</option>
                  <option value="heavy">Heavy Traffic</option>
                  <option value="severe">Severe Traffic</option>
                </select>
                {dataLoadingStates.trafficData === 'error' && (
                  <Badge variant="danger" size="sm">API Error</Badge>
                )}
              </div>

              {/* Traffic Data Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{getArrayLength(mapData.trafficData)}</p>
                    <p className="text-sm text-gray-600">Total Traffic Points</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {getFilteredTrafficData().filter(t => t.congestionLevel === 'free_flow').length}
                    </p>
                    <p className="text-sm text-gray-600">Free Flow</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {getFilteredTrafficData().filter(t => t.congestionLevel === 'light').length}
                    </p>
                    <p className="text-sm text-gray-600">Light Traffic</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {getFilteredTrafficData().filter(t => ['moderate', 'heavy', 'severe'].includes(t.congestionLevel)).length}
                    </p>
                    <p className="text-sm text-gray-600">Moderate+</p>
                  </div>
                </Card>
              </div>

              {/* Traffic Data Table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Point
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Congestion Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Speed (km/h)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bottlenecks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Measurement Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredTrafficData().map((traffic, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Traffic Point {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {traffic.coordinates?.latitude?.toFixed(5)}, {traffic.coordinates?.longitude?.toFixed(5)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getTrafficColor(traffic.congestionLevel?.replace('_', ' '))}>
                              {traffic.congestionLevel?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {traffic.speed?.toFixed(2) || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {traffic.riskScore || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {traffic.bottlenecks && traffic.bottlenecks.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {traffic.bottlenecks.map((bottleneck, idx) => (
                                  <Badge key={idx} variant="warning" className="text-xs">
                                    {bottleneck.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {traffic.measurementTime ? new Date(traffic.measurementTime).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {getFilteredTrafficData().length === 0 && (
                  <div className="text-center py-8">
                    <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {dataLoadingStates.trafficData === 'error' 
                        ? 'Failed to load traffic data from API' 
                        : 'No traffic data found'}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Road Conditions Tab */}
          {activeTab === 'road-conditions' && (
            <div className="space-y-6">
              {/* Road Conditions Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.roadConditionType || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, roadConditionType: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Road Conditions</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="critical">Critical</option>
                </select>
                {dataLoadingStates.roadConditions === 'error' && (
                  <Badge variant="danger" size="sm">API Error</Badge>
                )}
              </div>

              {/* Road Conditions Summary */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{getArrayLength(mapData.roadConditions)}</p>
                    <p className="text-sm text-gray-600">Total Road Points</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {getFilteredRoadConditions().filter(r => r.surfaceQuality === 'excellent').length}
                    </p>
                    <p className="text-sm text-gray-600">Excellent</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {getFilteredRoadConditions().filter(r => r.surfaceQuality === 'good').length}
                    </p>
                    <p className="text-sm text-gray-600">Good</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {getFilteredRoadConditions().filter(r => r.surfaceQuality === 'fair').length}
                    </p>
                    <p className="text-sm text-gray-600">Fair</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {getFilteredRoadConditions().filter(r => ['poor', 'critical'].includes(r.surfaceQuality)).length}
                    </p>
                    <p className="text-sm text-gray-600">Poor/Critical</p>
                  </div>
                </Card>
              </div>

              {/* Road Conditions Table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Point
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Surface Quality
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Road Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Width/Lanes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issues
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredRoadConditions().map((condition, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Road Point {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {condition.coordinates?.latitude?.toFixed(5)}, {condition.coordinates?.longitude?.toFixed(5)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getRoadConditionColor(condition.surfaceQuality)}>
                              {condition.surfaceQuality || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {condition.roadType || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {condition.width}m / {condition.lanes} lanes
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {condition.riskScore || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-1">
                              {condition.underConstruction && (
                                <Badge variant="warning" className="text-xs">Construction</Badge>
                              )}
                              {condition.hasPotholes && (
                                <Badge variant="danger" className="text-xs">Potholes</Badge>
                              )}
                              {!condition.underConstruction && !condition.hasPotholes && (
                                <span className="text-xs text-gray-400">None</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {getFilteredRoadConditions().length === 0 && (
                  <div className="text-center py-8">
                    <Construction className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {dataLoadingStates.roadConditions === 'error' 
                        ? 'Failed to load road conditions data from API' 
                        : 'No road conditions data found'}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Overall Risk Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {route.riskScores?.totalWeightedScore?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Overall Risk Score</div>
                  <Badge variant={route.riskScores?.riskGrade === 'A' ? 'success' : route.riskScores?.riskGrade === 'B' ? 'warning' : 'danger'} className="mt-2">
                    Grade {route.riskScores?.riskGrade || 'N/A'}
                  </Badge>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {route.riskLevel || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-600">Risk Level</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {route.totalDistance?.toFixed(2) || 'N/A'} km
                  </div>
                  <div className="text-sm text-gray-600">Total Distance</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(route.estimatedDuration / 60) || 'N/A'} min
                  </div>
                  <div className="text-sm text-gray-600">Est. Duration</div>
                </Card>
              </div>

              {/* Detailed Risk Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Risk Factor Analysis</h4>
                  <div className="space-y-4">
                    {route.riskScores && Object.entries(route.riskScores)
                      .filter(([key]) => !['totalWeightedScore', 'riskGrade', 'calculatedAt'].includes(key))
                      .map(([key, value]) => {
                        const riskName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                        const riskValue = typeof value === 'number' ? value : 0
                        const riskPercentage = Math.min(100, (riskValue / 10) * 100)
                        const riskColor = riskValue >= 8 ? 'bg-red-500' : riskValue >= 6 ? 'bg-orange-500' : riskValue >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                        
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">{riskName}</span>
                              <span className="text-sm font-bold text-gray-900">{riskValue.toFixed(2)}/10</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${riskColor}`}
                                style={{ width: `${riskPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Route Data Status</h4>
                  <div className="space-y-3">
                    {route.dataProcessingStatus && Object.entries(route.dataProcessingStatus).map(([key, status]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Badge variant={status ? 'success' : 'danger'} size="sm">
                          {status ? 'Processed' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-3">Processing Metadata</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">GPS Tracking Points:</span>
                        <span className="font-medium">{route.metadata?.gpsTrackingPoints?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking Accuracy:</span>
                        <Badge variant="success" size="sm">{route.metadata?.trackingAccuracy || 'N/A'}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Completion:</span>
                        <span className="font-medium">{route.processingCompletion || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Calculated:</span>
                        <span className="font-medium">
                          {route.riskScores?.calculatedAt ? new Date(route.riskScores.calculatedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Route Points Summary */}
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Route Analysis Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {route.routePoints?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Route Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {route.terrain || 'Mixed'}
                    </div>
                    <div className="text-sm text-gray-600">Terrain Type</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {route.majorHighways?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Major Highways</div>
                  </div>
                </div>
                
                {route.liveMapLink && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Live Google Maps Link:</span>
                      <a 
                        href={route.liveMapLink.trim()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </Card>

              {/* API Data Status from mapData */}
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Live API Data Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(dataLoadingStates).map(([key, status]) => (
                    <div key={key} className="text-center">
                      <Badge variant={status === 'success' ? 'success' : 'danger'} className="mb-2">
                        {status === 'success' ? 'Loaded' : 'Failed'}
                      </Badge>
                      <div className="text-xs text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
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
                {...register('fromName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter origin location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Location
              </label>
              <input
                type="text"
                {...register('toName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter destination location"
              />
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
              loading={isUpdating}
            >
              Update Route
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default RouteDetails