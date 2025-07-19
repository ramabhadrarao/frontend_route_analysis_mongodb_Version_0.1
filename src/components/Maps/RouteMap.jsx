import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'
import { 
  Navigation, 
  AlertTriangle, 
  Eye, 
  Phone, 
  Wifi, 
  Construction,
  MapPin,
  Layers
} from 'lucide-react'
import { MARKER_COLORS, LAYER_TYPES } from '../../utils/constants'
import { formatDistance, getRiskColor } from '../../utils/helpers'
import Card from '../UI/Card'
import Toggle from '../UI/Toggle'
import Badge from '../UI/Badge'

// Get Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAXa6qLmUm7YEoUOqpIZF8A00663AKgq68'

const GoogleMapComponent = ({ 
  routeData, 
  gpsPoints = [], 
  sharpTurns = [], 
  blindSpots = [], 
  emergencyServices = [], 
  accidentAreas = [], 
  roadConditions = [], 
  networkCoverage = [],
  visibleLayers
}) => {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef(null)

  // Helper function to safely extract coordinates
  const getCoordinates = (item) => {
    if (item.latitude !== undefined && item.longitude !== undefined) {
      return { lat: item.latitude, lng: item.longitude }
    }
    if (item.coordinates && item.coordinates.latitude !== undefined && item.coordinates.longitude !== undefined) {
      return { lat: item.coordinates.latitude, lng: item.coordinates.longitude }
    }
    if (item.lat !== undefined && item.lng !== undefined) {
      return { lat: item.lat, lng: item.lng }
    }
    return null
  }

  // Helper function to validate coordinates
  const isValidCoordinate = (coords) => {
    return coords && 
           typeof coords.lat === 'number' && 
           typeof coords.lng === 'number' && 
           !isNaN(coords.lat) && 
           !isNaN(coords.lng) &&
           coords.lat >= -90 && coords.lat <= 90 &&
           coords.lng >= -180 && coords.lng <= 180
  }

  // Filter out items with invalid coordinates
  const getValidItems = (items) => {
    return items.filter(item => {
      const coords = getCoordinates(item)
      return isValidCoordinate(coords)
    })
  }

  // Clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
  }

  // Create custom marker
  const createMarker = (position, title, content, color) => {
    const marker = new window.google.maps.Marker({
      position,
      map: googleMapRef.current,
      title,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    })

    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding: 10px; max-width: 300px;">${content}</div>`
    })

    marker.addListener('click', () => {
      infoWindow.open(googleMapRef.current, marker)
    })

    markersRef.current.push(marker)
    return marker
  }

  // Initialize Google Map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    // Set default center based on route data or GPS points
    let center = { lat: 19.0760, lng: 72.8777 } // Default to Mumbai
    
    if (routeData?.fromCoordinates) {
      center = {
        lat: routeData.fromCoordinates.latitude,
        lng: routeData.fromCoordinates.longitude
      }
    } else if (gpsPoints.length > 0) {
      const firstPoint = getCoordinates(gpsPoints[0])
      if (isValidCoordinate(firstPoint)) {
        center = firstPoint
      }
    }

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 10,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Draw route polyline if GPS points are available
    if (gpsPoints.length > 0) {
      const validPoints = gpsPoints
        .map(point => getCoordinates(point))
        .filter(coords => isValidCoordinate(coords))

      if (validPoints.length > 1) {
        polylineRef.current = new window.google.maps.Polyline({
          path: validPoints,
          geodesic: true,
          strokeColor: getRiskColor(routeData?.riskLevel) || '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 4
        })
        polylineRef.current.setMap(googleMapRef.current)

        // Fit map to route bounds
        const bounds = new window.google.maps.LatLngBounds()
        validPoints.forEach(point => bounds.extend(point))
        googleMapRef.current.fitBounds(bounds)
      }
    }

    updateMarkers()
  }, [routeData, gpsPoints])

  // Update markers based on visible layers
  const updateMarkers = useCallback(() => {
    if (!googleMapRef.current) return

    clearMarkers()

    // Sharp Turns
    if (visibleLayers[LAYER_TYPES.SHARP_TURNS]) {
      getValidItems(sharpTurns).forEach((turn, index) => {
        const coords = getCoordinates(turn)
        if (isValidCoordinate(coords)) {
          const content = `
            <h4 style="color: #ea580c; font-weight: bold; margin-bottom: 8px;">Sharp Turn</h4>
            <p><strong>Angle:</strong> ${turn.turnAngle}°</p>
            <p><strong>Direction:</strong> ${turn.turnDirection}</p>
            <p><strong>Risk Score:</strong> ${turn.riskScore}</p>
            <p><strong>Distance:</strong> ${formatDistance(turn.distanceFromStartKm)}</p>
            ${turn.recommendedSpeed ? `<p><strong>Recommended Speed:</strong> ${turn.recommendedSpeed} km/h</p>` : ''}
          `
          createMarker(coords, `Sharp Turn ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.SHARP_TURNS])
        }
      })
    }

    // Blind Spots
    if (visibleLayers[LAYER_TYPES.BLIND_SPOTS]) {
      getValidItems(blindSpots).forEach((spot, index) => {
        const coords = getCoordinates(spot)
        if (isValidCoordinate(coords)) {
          const content = `
            <h4 style="color: #dc2626; font-weight: bold; margin-bottom: 8px;">Blind Spot</h4>
            <p><strong>Type:</strong> ${spot.spotType}</p>
            <p><strong>Visibility:</strong> ${spot.visibilityDistance}m</p>
            <p><strong>Risk Score:</strong> ${spot.riskScore}</p>
            <p><strong>Distance:</strong> ${formatDistance(spot.distanceFromStartKm)}</p>
            ${spot.recommendations ? `<p><strong>Recommendations:</strong> ${spot.recommendations}</p>` : ''}
          `
          createMarker(coords, `Blind Spot ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.BLIND_SPOTS])
        }
      })
    }

    // Emergency Services
    if (visibleLayers[LAYER_TYPES.EMERGENCY_SERVICES]) {
      getValidItems(emergencyServices).forEach((service, index) => {
        const coords = getCoordinates(service)
        if (isValidCoordinate(coords)) {
          const content = `
            <h4 style="color: #16a34a; font-weight: bold; margin-bottom: 8px;">${service.name}</h4>
            <p><strong>Type:</strong> ${service.serviceType}</p>
            <p><strong>Distance:</strong> ${formatDistance(service.distanceFromRouteKm)}</p>
            ${service.phoneNumber ? `<p><strong>Phone:</strong> ${service.phoneNumber}</p>` : ''}
            ${service.operatingHours ? `<p><strong>Hours:</strong> ${service.operatingHours}</p>` : ''}
            <p><strong>Response Time:</strong> ${service.responseTimeMinutes} min</p>
          `
          createMarker(coords, service.name, content, MARKER_COLORS[LAYER_TYPES.EMERGENCY_SERVICES])
        }
      })
    }

    // Accident Areas
    if (visibleLayers[LAYER_TYPES.ACCIDENT_AREAS]) {
      getValidItems(accidentAreas).forEach((area, index) => {
        const coords = getCoordinates(area)
        if (isValidCoordinate(coords)) {
          const content = `
            <h4 style="color: #991b1b; font-weight: bold; margin-bottom: 8px;">Accident Prone Area</h4>
            <p><strong>Frequency:</strong> ${area.accidentFrequencyYearly}/year</p>
            <p><strong>Severity:</strong> ${area.accidentSeverity}</p>
            <p><strong>Risk Score:</strong> ${area.riskScore}</p>
            <p><strong>Distance:</strong> ${formatDistance(area.distanceFromStartKm)}</p>
            ${area.commonAccidentTypes ? `<p><strong>Common Types:</strong> ${area.commonAccidentTypes}</p>` : ''}
          `
          createMarker(coords, `Accident Area ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.ACCIDENT_AREAS])
        }
      })
    }

    // Road Conditions
    if (visibleLayers[LAYER_TYPES.ROAD_CONDITIONS]) {
      getValidItems(roadConditions).forEach((condition, index) => {
        const coords = getCoordinates(condition)
        if (isValidCoordinate(coords)) {
          const content = `
            <h4 style="color: #ca8a04; font-weight: bold; margin-bottom: 8px;">Road Condition</h4>
            <p><strong>Surface Quality:</strong> ${condition.surfaceQuality}</p>
            <p><strong>Condition:</strong> ${condition.condition}</p>
            <p><strong>Risk Score:</strong> ${condition.riskScore}</p>
            ${condition.description ? `<p><strong>Description:</strong> ${condition.description}</p>` : ''}
          `
          createMarker(coords, `Road Condition ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.ROAD_CONDITIONS])
        }
      })
    }

    // Network Coverage Dead Zones
    if (visibleLayers[LAYER_TYPES.NETWORK_COVERAGE]) {
      getValidItems(networkCoverage)
        .filter(coverage => coverage.isDeadZone)
        .forEach((deadZone, index) => {
          const coords = getCoordinates(deadZone)
          if (isValidCoordinate(coords)) {
            const content = `
              <h4 style="color: #6b7280; font-weight: bold; margin-bottom: 8px;">Network Dead Zone</h4>
              <p><strong>Severity:</strong> ${deadZone.deadZoneSeverity}</p>
              <p><strong>Radius:</strong> ${deadZone.deadZoneRadius}m</p>
              <p><strong>Duration:</strong> ${deadZone.deadZoneDuration}</p>
              <p><strong>Distance:</strong> ${formatDistance(deadZone.distanceFromStartKm)}</p>
              ${deadZone.alternativeMethods ? `<p><strong>Alternatives:</strong> ${deadZone.alternativeMethods}</p>` : ''}
            `
            createMarker(coords, `Network Dead Zone ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.NETWORK_COVERAGE])
          }
        })
    }
  }, [visibleLayers, sharpTurns, blindSpots, emergencyServices, accidentAreas, roadConditions, networkCoverage])

  useEffect(() => {
    initializeMap()
  }, [initializeMap])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  return <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
}

const RouteMap = ({ 
  routeData, 
  gpsPoints = [], 
  sharpTurns = [], 
  blindSpots = [], 
  emergencyServices = [], 
  accidentAreas = [], 
  roadConditions = [], 
  networkCoverage = [],
  onLayerToggle 
}) => {
  const [visibleLayers, setVisibleLayers] = useState({
    route: true, // Add route toggle
    [LAYER_TYPES.SHARP_TURNS]: true,
    [LAYER_TYPES.BLIND_SPOTS]: true,
    [LAYER_TYPES.EMERGENCY_SERVICES]: true,
    [LAYER_TYPES.ACCIDENT_AREAS]: true,
    [LAYER_TYPES.ROAD_CONDITIONS]: false,
    [LAYER_TYPES.NETWORK_COVERAGE]: false
  })

  const handleLayerToggle = (layerType, visible) => {
    const newVisibleLayers = { ...visibleLayers, [layerType]: visible }
    setVisibleLayers(newVisibleLayers)
    if (onLayerToggle) {
      onLayerToggle(layerType, visible)
    }
  }

  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        )
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load Google Maps</p>
              <p className="text-sm text-gray-500 mt-2">Please check your API key and internet connection</p>
            </div>
          </div>
        )
      case Status.SUCCESS:
        return (
          <GoogleMapComponent
            routeData={routeData}
            gpsPoints={gpsPoints}
            sharpTurns={sharpTurns}
            blindSpots={blindSpots}
            emergencyServices={emergencyServices}
            accidentAreas={accidentAreas}
            roadConditions={roadConditions}
            networkCoverage={networkCoverage}
            visibleLayers={visibleLayers}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Layer Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Map Layers
          </h3>
          <Badge variant="primary">{routeData?.routeName || 'Route View'}</Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Toggle
            checked={visibleLayers[LAYER_TYPES.SHARP_TURNS]}
            onChange={(checked) => handleLayerToggle(LAYER_TYPES.SHARP_TURNS, checked)}
            label="Sharp Turns"
            className="text-sm"
          />
          <Toggle
            checked={visibleLayers[LAYER_TYPES.BLIND_SPOTS]}
            onChange={(checked) => handleLayerToggle(LAYER_TYPES.BLIND_SPOTS, checked)}
            label="Blind Spots"
            className="text-sm"
          />
          <Toggle
            checked={visibleLayers[LAYER_TYPES.EMERGENCY_SERVICES]}
            onChange={(checked) => handleLayerToggle(LAYER_TYPES.EMERGENCY_SERVICES, checked)}
            label="Emergency Services"
            className="text-sm"
          />
          <Toggle
            checked={visibleLayers[LAYER_TYPES.ACCIDENT_AREAS]}
            onChange={(checked) => handleLayerToggle(LAYER_TYPES.ACCIDENT_AREAS, checked)}
            label="Accident Areas"
            className="text-sm"
          />
          <Toggle
            checked={visibleLayers[LAYER_TYPES.ROAD_CONDITIONS]}
            onChange={(checked) => handleLayerToggle(LAYER_TYPES.ROAD_CONDITIONS, checked)}
            label="Road Conditions"
            className="text-sm"
          />
          <Toggle
            checked={visibleLayers[LAYER_TYPES.NETWORK_COVERAGE]}
            onChange={(checked) => handleLayerToggle(LAYER_TYPES.NETWORK_COVERAGE, checked)}
            label="Network Coverage"
            className="text-sm"
          />
        </div>
      </Card>

      {/* Google Maps Container */}
      <Card className="p-0 overflow-hidden">
        <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render} />
      </Card>

      {/* Map Legend */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.SHARP_TURNS] }}></div>
            <span>Sharp Turns</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.BLIND_SPOTS] }}></div>
            <span>Blind Spots</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.EMERGENCY_SERVICES] }}></div>
            <span>Emergency Services</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.ACCIDENT_AREAS] }}></div>
            <span>Accident Areas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.NETWORK_COVERAGE] }}></div>
            <span>Network Dead Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.ROAD_CONDITIONS] }}></div>
            <span>Road Conditions</span>
          </div>
        </div>
      </Card>

      {/* Route Information */}
      {routeData && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Route Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>From:</strong> {routeData.fromName}</p>
              <p><strong>To:</strong> {routeData.toName}</p>
              <p><strong>Distance:</strong> {routeData.totalDistance} km</p>
            </div>
            <div>
              <p><strong>Duration:</strong> {Math.round(routeData.estimatedDuration / 60)} hours</p>
              <p><strong>Risk Level:</strong> <span className={`font-semibold ${routeData.riskLevel === 'High Risk' ? 'text-red-600' : routeData.riskLevel === 'Medium Risk' ? 'text-yellow-600' : 'text-green-600'}`}>{routeData.riskLevel}</span></p>
              <p><strong>GPS Points:</strong> {routeData.routePoints?.length || 0}</p>
            </div>
          </div>
          {routeData.liveMapLink && (
            <div className="mt-4">
              <a 
                href={routeData.liveMapLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Open in Google Maps
              </a>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default RouteMap

  // In the GoogleMapComponent, update the polyline creation:
  // Draw route polyline if GPS points are available AND route is visible
  if (gpsPoints.length > 0 && visibleLayers.route) {
    const validPoints = gpsPoints
      .map(point => getCoordinates(point))
      .filter(coords => isValidCoordinate(coords))

    if (validPoints.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({
        path: validPoints,
        geodesic: true,
        strokeColor: getRiskColor(routeData?.riskLevel) || '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 4
      })
      polylineRef.current.setMap(googleMapRef.current)

      // Fit map to route bounds
      const bounds = new window.google.maps.LatLngBounds()
      validPoints.forEach(point => bounds.extend(point))
      googleMapRef.current.fitBounds(bounds)
    }
  } else if (polylineRef.current) {
    // Hide route line if toggled off
    polylineRef.current.setMap(null)
  }

  // Add route toggle in the layer controls:
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    <Toggle
      checked={visibleLayers.route}
      onChange={(checked) => handleLayerToggle('route', checked)}
      label="Route Line"
      className="text-sm font-semibold"
    />
    <Toggle
      checked={visibleLayers[LAYER_TYPES.SHARP_TURNS]}
      onChange={(checked) => handleLayerToggle(LAYER_TYPES.SHARP_TURNS, checked)}
      label="Sharp Turns"
      className="text-sm"
    />
    <Toggle
      checked={visibleLayers[LAYER_TYPES.BLIND_SPOTS]}
      onChange={(checked) => handleLayerToggle(LAYER_TYPES.BLIND_SPOTS, checked)}
      label="Blind Spots"
      className="text-sm"
    />
    <Toggle
      checked={visibleLayers[LAYER_TYPES.EMERGENCY_SERVICES]}
      onChange={(checked) => handleLayerToggle(LAYER_TYPES.EMERGENCY_SERVICES, checked)}
      label="Emergency Services"
      className="text-sm"
    />
    <Toggle
      checked={visibleLayers[LAYER_TYPES.ACCIDENT_AREAS]}
      onChange={(checked) => handleLayerToggle(LAYER_TYPES.ACCIDENT_AREAS, checked)}
      label="Accident Areas"
      className="text-sm"
    />
    <Toggle
      checked={visibleLayers[LAYER_TYPES.ROAD_CONDITIONS]}
      onChange={(checked) => handleLayerToggle(LAYER_TYPES.ROAD_CONDITIONS, checked)}
      label="Road Conditions"
      className="text-sm"
    />
    <Toggle
      checked={visibleLayers[LAYER_TYPES.NETWORK_COVERAGE]}
      onChange={(checked) => handleLayerToggle(LAYER_TYPES.NETWORK_COVERAGE, checked)}
      label="Network Coverage"
      className="text-sm"
    />

   </div>
  )
}

export default RouteMap