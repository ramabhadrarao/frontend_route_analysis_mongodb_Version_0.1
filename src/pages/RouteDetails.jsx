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
  BarChart3
} from 'lucide-react'
import { apiService } from '../services/apiService'
import { formatDistance, formatDate, getRiskLevel, getRiskColor } from '../utils/helpers'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import RouteMap from '../components/Maps/RouteMap'
import toast from 'react-hot-toast'

const RouteDetails = () => {
  const { routeId } = useParams()
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapData, setMapData] = useState({
    gpsPoints: [],
    sharpTurns: [],
    blindSpots: [],
    emergencyServices: [],
    accidentAreas: [],
    roadConditions: [],
    networkCoverage: []
  })
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (routeId) {
      loadRouteDetails()
    }
  }, [routeId])

  const loadRouteDetails = async () => {
    try {
      setLoading(true)
      
      // Load route basic info
      const routeResponse = await apiService.routes.getById(routeId)
      setRoute(routeResponse.route || mockRoute)

      // Load map data
      const [
        gpsPoints,
        sharpTurns,
        blindSpots,
        emergencyServices,
        accidentAreas,
        roadConditions,
        networkCoverage
      ] = await Promise.all([
        apiService.routes.getGPSPoints(routeId).catch(() => mockGPSPoints),
        apiService.routes.getSharpTurns(routeId).catch(() => mockSharpTurns),
        apiService.routes.getBlindSpots(routeId).catch(() => mockBlindSpots),
        apiService.routes.getEmergencyServices(routeId).catch(() => mockEmergencyServices),
        apiService.routes.getAccidentAreas(routeId).catch(() => mockAccidentAreas),
        apiService.routes.getRoadConditions(routeId).catch(() => []),
        apiService.networkCoverage.getOverview(routeId).catch(() => mockNetworkCoverage)
      ])

      setMapData({
        gpsPoints: gpsPoints.points || mockGPSPoints,
        sharpTurns: sharpTurns.turns || mockSharpTurns,
        blindSpots: blindSpots.spots || mockBlindSpots,
        emergencyServices: emergencyServices.services || mockEmergencyServices,
        accidentAreas: accidentAreas.areas || mockAccidentAreas,
        roadConditions: roadConditions.conditions || [],
        networkCoverage: networkCoverage.coverage || mockNetworkCoverage
      })
    } catch (error) {
      console.error('Route details load error:', error)
      toast.error('Failed to load route details')
      // Use mock data
      setRoute(mockRoute)
      setMapData({
        gpsPoints: mockGPSPoints,
        sharpTurns: mockSharpTurns,
        blindSpots: mockBlindSpots,
        emergencyServices: mockEmergencyServices,
        accidentAreas: mockAccidentAreas,
        roadConditions: [],
        networkCoverage: mockNetworkCoverage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async () => {
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

  // Mock data
  const mockRoute = {
    routeId: routeId,
    routeName: 'Mumbai to Pune Express',
    fromAddress: 'Mumbai, Maharashtra',
    toAddress: 'Pune, Maharashtra',
    totalDistance: 148.5,
    estimatedDuration: 180,
    riskScore: 72,
    riskLevel: 'high',
    status: 'active',
    createdAt: new Date().toISOString(),
    majorHighways: ['NH48', 'Mumbai-Pune Expressway'],
    terrain: 'Mixed (Plains and Hills)',
    dataProcessingStatus: 'completed'
  }

  const mockGPSPoints = [
    { latitude: 19.0760, longitude: 72.8777, pointOrder: 1, elevation: 14 },
    { latitude: 19.0500, longitude: 72.9000, pointOrder: 2, elevation: 25 },
    { latitude: 18.9000, longitude: 73.2000, pointOrder: 3, elevation: 150 },
    { latitude: 18.7000, longitude: 73.5000, pointOrder: 4, elevation: 300 },
    { latitude: 18.5204, longitude: 73.8567, pointOrder: 5, elevation: 560 }
  ]

  const mockSharpTurns = [
    {
      latitude: 18.9000,
      longitude: 73.2000,
      distanceFromStartKm: 45.2,
      turnAngle: 85,
      turnDirection: 'Right',
      riskScore: 75,
      recommendedSpeed: 40
    },
    {
      latitude: 18.7000,
      longitude: 73.5000,
      distanceFromStartKm: 89.1,
      turnAngle: 92,
      turnDirection: 'Left',
      riskScore: 68,
      recommendedSpeed: 35
    }
  ]

  const mockBlindSpots = [
    {
      latitude: 18.8500,
      longitude: 73.3000,
      distanceFromStartKm: 67.3,
      spotType: 'Hill Crest',
      visibilityDistance: 50,
      riskScore: 82,
      recommendations: 'Reduce speed, use horn'
    }
  ]

  const mockEmergencyServices = [
    {
      name: 'Lonavala Hospital',
      serviceType: 'Hospital',
      latitude: 18.7500,
      longitude: 73.4000,
      phoneNumber: '+91-2114-273456',
      distanceFromRouteKm: 2.1,
      responseTimeMinutes: 15
    },
    {
      name: 'Highway Police Station',
      serviceType: 'Police',
      latitude: 18.8000,
      longitude: 73.3500,
      phoneNumber: '100',
      distanceFromRouteKm: 0.5,
      responseTimeMinutes: 8
    }
  ]

  const mockAccidentAreas = [
    {
      latitude: 18.8200,
      longitude: 73.3200,
      distanceFromStartKm: 72.5,
      accidentFrequencyYearly: 12,
      accidentSeverity: 'High',
      riskScore: 88,
      commonAccidentTypes: 'Rear-end collisions, Lane departure'
    }
  ]

  const mockNetworkCoverage = [
    {
      latitude: 18.9500,
      longitude: 73.1500,
      distanceFromStartKm: 35.2,
      isDeadZone: true,
      deadZoneSeverity: 'High',
      deadZoneRadius: 500,
      deadZoneDuration: '2-3 minutes'
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'map', label: 'Interactive Map', icon: Map },
    { id: 'analysis', label: 'Risk Analysis', icon: BarChart3 }
  ]

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
            <p className="text-gray-600">Route ID: {route.routeId}</p>
          </div>
        </div>
        <div className="flex space-x-3">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900">{formatDistance(route.totalDistance)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Navigation className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Risk Score</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-gray-900">{route.riskScore}</p>
                <Badge variant={route.riskLevel}>{getRiskLevel(route.riskScore)}</Badge>
              </div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sharp Turns</p>
              <p className="text-2xl font-bold text-gray-900">{mapData.sharpTurns.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Navigation className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blind Spots</p>
              <p className="text-2xl font-bold text-gray-900">{mapData.blindSpots.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-red-600" />
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
                      <p className="font-medium text-gray-900">{formatDate(route.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sharp Turns</span>
                      <Badge variant="warning">{mapData.sharpTurns.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Blind Spots</span>
                      <Badge variant="danger">{mapData.blindSpots.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Accident Areas</span>
                      <Badge variant="danger">{mapData.accidentAreas.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Emergency Services</span>
                      <Badge variant="success">{mapData.emergencyServices.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Network Dead Zones</span>
                      <Badge variant="warning">{mapData.networkCoverage.filter(c => c.isDeadZone).length}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <RouteMap
              routeData={route}
              gpsPoints={mapData.gpsPoints}
              sharpTurns={mapData.sharpTurns}
              blindSpots={mapData.blindSpots}
              emergencyServices={mapData.emergencyServices}
              accidentAreas={mapData.accidentAreas}
              roadConditions={mapData.roadConditions}
              networkCoverage={mapData.networkCoverage}
            />
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
    </div>
  )
}

export default RouteDetails