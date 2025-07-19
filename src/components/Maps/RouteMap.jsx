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
  Layers,
  Settings,
  Maximize,
  Minimize,
  RefreshCw,
  Download,
  Share,
  Filter,
  Search,
  RotateCcw,
  Zap,
  CloudRain,
  Car,
  Shield,
  BarChart3,
  Activity
} from 'lucide-react'
import { MARKER_COLORS, LAYER_TYPES } from '../../utils/constants'
import { formatDistance, getRiskColor } from '../../utils/helpers'
import Card from '../UI/Card'
import Toggle from '../UI/Toggle'
import Badge from '../UI/Badge'
import Button from '../UI/Button'

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
  visibleLayers,
  mapOptions,
  onMapClick,
  onMarkerClick
}) => {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const markersRef = useRef([])
  const polylinesRef = useRef([])
  const infoWindowRef = useRef(null)
  const directionsServiceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const placesServiceRef = useRef(null)

  // Enhanced coordinate extraction with better error handling
  const getCoordinates = (item) => {
    try {
      // Handle different coordinate formats from API
      if (item.latitude !== undefined && item.longitude !== undefined) {
        return { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) }
      }
      if (item.coordinates) {
        if (item.coordinates.latitude !== undefined && item.coordinates.longitude !== undefined) {
          return { lat: parseFloat(item.coordinates.latitude), lng: parseFloat(item.coordinates.longitude) }
        }
        if (item.coordinates.lat !== undefined && item.coordinates.lng !== undefined) {
          return { lat: parseFloat(item.coordinates.lat), lng: parseFloat(item.coordinates.lng) }
        }
        // Handle array format [lng, lat] (GeoJSON format)
        if (Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
          return { lat: parseFloat(item.coordinates[1]), lng: parseFloat(item.coordinates[0]) }
        }
      }
      if (item.lat !== undefined && item.lng !== undefined) {
        return { lat: parseFloat(item.lat), lng: parseFloat(item.lng) }
      }
      // Handle nested coordinate objects
      if (item.location) {
        if (item.location.latitude !== undefined && item.location.longitude !== undefined) {
          return { lat: parseFloat(item.location.latitude), lng: parseFloat(item.location.longitude) }
        }
        if (item.location.lat !== undefined && item.location.lng !== undefined) {
          return { lat: parseFloat(item.location.lat), lng: parseFloat(item.location.lng) }
        }
      }
      if (item.position && item.position.lat !== undefined && item.position.lng !== undefined) {
        return { lat: parseFloat(item.position.lat), lng: parseFloat(item.position.lng) }
      }
      
      console.warn('Unable to extract coordinates from:', item)
      return null
    } catch (error) {
      console.error('Error extracting coordinates:', error, item)
      return null
    }
  }

  // Enhanced data extraction function for different API response formats
  const extractArrayData = (apiResponse) => {
    console.log('🔍 RouteMap extracting data from:', apiResponse)
    
    if (!apiResponse) {
      console.warn('❌ No API response provided')
      return []
    }
    
    // If it's already an array, return as-is
    if (Array.isArray(apiResponse)) {
      console.log('✅ Direct array response:', apiResponse.length, 'items')
      return apiResponse
    }
    
    // Handle success wrapper with nested data
    if (apiResponse.success && apiResponse.data) {
      const dataObj = apiResponse.data
      console.log('🎯 Found success wrapper, data object keys:', Object.keys(dataObj))
      
      // Check for direct data array
      if (Array.isArray(dataObj)) {
        console.log('✅ Data object is array:', dataObj.length, 'items')
        return dataObj
      }
      
      // Extract specific arrays based on your API structure
      const dataKeys = [
        'roadConditions', 'sharpTurns', 'blindSpots', 'emergencyServices',
        'gpsPoints', 'weatherPoints', 'trafficPoints', 'accidentAreas',
        'networkCoverage', 'weatherData', 'trafficData', 'conditions', 
        'points', 'areas', 'services'
      ]
      
      for (const key of dataKeys) {
        if (dataObj[key] && Array.isArray(dataObj[key])) {
          console.log(`✅ Extracted ${key}:`, dataObj[key].length, 'items')
          return dataObj[key]
        }
      }
      
      // Generic fallbacks
      if (dataObj.results && Array.isArray(dataObj.results)) {
        console.log('✅ Extracted results:', dataObj.results.length, 'items')
        return dataObj.results
      }
      
      if (dataObj.items && Array.isArray(dataObj.items)) {
        console.log('✅ Extracted items:', dataObj.items.length, 'items')
        return dataObj.items
      }
      
      // If dataObj has coordinate properties, treat as single item
      if (dataObj.latitude || dataObj.coordinates || dataObj.lat) {
        console.log('✅ Single item with coordinates')
        return [dataObj]
      }
    }
    
    // Handle API error responses
    if (apiResponse.success === false) {
      console.warn('❌ API returned success: false', apiResponse.message || apiResponse.error)
      return []
    }
    
    // Handle direct response arrays (fallback)
    const directProps = [
      'roadConditions', 'sharpTurns', 'blindSpots', 'emergencyServices',
      'gpsPoints', 'weatherData', 'trafficData', 'accidentAreas', 'networkCoverage'
    ]
    
    for (const prop of directProps) {
      if (apiResponse[prop] && Array.isArray(apiResponse[prop])) {
        console.log(`✅ Direct ${prop}:`, apiResponse[prop].length, 'items')
        return apiResponse[prop]
      }
    }
    
    // If response has coordinate properties, treat as single item
    if (apiResponse.latitude || apiResponse.coordinates || apiResponse.lat) {
      console.log('✅ Single response item with coordinates')
      return [apiResponse]
    }
    
    // Final fallback: check for any array in the response
    if (typeof apiResponse === 'object' && apiResponse !== null) {
      const values = Object.values(apiResponse)
      const arrayValue = values.find(val => Array.isArray(val))
      if (arrayValue) {
        console.log('✅ Found array in object values:', arrayValue.length, 'items')
        return arrayValue
      }
    }
    
    console.warn('❌ No array data found, available keys:', Object.keys(apiResponse || {}))
    return []
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

  // Clear all markers and polylines
  const clearMapElements = () => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    
    polylinesRef.current.forEach(polyline => polyline.setMap(null))
    polylinesRef.current = []
    
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
    }
  }

  // Create custom marker with enhanced styling
  const createEnhancedMarker = (position, title, content, color, icon, category) => {
    const marker = new window.google.maps.Marker({
      position,
      map: googleMapRef.current,
      title,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: color,
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        strokeOpacity: 1
      },
      animation: window.google.maps.Animation.DROP,
      optimized: false
    })

    // Enhanced info window content
    const enhancedContent = `
      <div style="
        max-width: 350px; 
        padding: 16px; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        border: 1px solid #e2e8f0;
      ">
        <div style="
          display: flex; 
          align-items: center; 
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        ">
          <div style="
            width: 24px; 
            height: 24px; 
            background: ${color}; 
            border-radius: 50%; 
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="color: white; font-size: 12px; font-weight: bold;">${icon}</span>
          </div>
          <h4 style="
            margin: 0; 
            color: #1e293b; 
            font-size: 16px; 
            font-weight: 600;
          ">${title}</h4>
        </div>
        <div style="color: #475569; font-size: 14px; line-height: 1.5;">
          ${content}
        </div>
        <div style="
          margin-top: 12px; 
          padding-top: 8px; 
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="
            background: ${color}20; 
            color: ${color}; 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
            font-weight: 500;
          ">${category}</span>
          <button onclick="window.open('https://maps.google.com/maps?q=${position.lat},${position.lng}', '_blank')" 
                  style="
                    background: #3b82f6; 
                    color: white; 
                    border: none; 
                    padding: 6px 12px; 
                    border-radius: 6px; 
                    font-size: 12px; 
                    cursor: pointer;
                    transition: background 0.2s;
                  "
                  onmouseover="this.style.background='#2563eb'"
                  onmouseout="this.style.background='#3b82f6'">
            Open in Maps
          </button>
        </div>
      </div>
    `

    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.google.maps.InfoWindow()
    }

    marker.addListener('click', () => {
      infoWindowRef.current.setContent(enhancedContent)
      infoWindowRef.current.open(googleMapRef.current, marker)
      
      // Trigger callback if provided
      if (onMarkerClick) {
        onMarkerClick(category, position, title)
      }
    })

    // Add hover effects
    marker.addListener('mouseover', () => {
      marker.setIcon({
        ...marker.getIcon(),
        scale: 15,
        strokeWeight: 4
      })
    })

    marker.addListener('mouseout', () => {
      marker.setIcon({
        ...marker.getIcon(),
        scale: 12,
        strokeWeight: 3
      })
    })

    markersRef.current.push(marker)
    return marker
  }

  // Draw route with enhanced styling
  const drawEnhancedRoute = () => {
    if (!visibleLayers.route || gpsPoints.length < 2) return

    const validPoints = gpsPoints
      .map(point => getCoordinates(point))
      .filter(coords => isValidCoordinate(coords))

    if (validPoints.length > 1) {
      // Main route line
      const mainPolyline = new window.google.maps.Polyline({
        path: validPoints,
        geodesic: true,
        strokeColor: getRiskColor(routeData?.riskLevel) || '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: googleMapRef.current
      })

      // Route shadow/outline
      const shadowPolyline = new window.google.maps.Polyline({
        path: validPoints,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 0.3,
        strokeWeight: 10,
        map: googleMapRef.current,
        zIndex: 1
      })

      // Animated route (optional)
      if (mapOptions.showAnimatedRoute) {
        const animatedPolyline = new window.google.maps.Polyline({
          path: validPoints,
          geodesic: true,
          strokeColor: '#ffffff',
          strokeOpacity: 0.6,
          strokeWeight: 2,
          map: googleMapRef.current,
          zIndex: 3,
          icons: [{
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 4,
              strokeColor: '#ffffff'
            },
            offset: '0%',
            repeat: '20px'
          }]
        })
        
        polylinesRef.current.push(animatedPolyline)
      }

      polylinesRef.current.push(shadowPolyline, mainPolyline)

      // Auto-fit to route bounds after drawing
      setTimeout(() => {
        fitMapToRoute()
      }, 100)
    }
  }

  // Get directions from Google Directions API
  const getDirections = async () => {
    if (!routeData?.fromCoordinates || !routeData?.toCoordinates) return

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService()
    }

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#10b981',
          strokeWeight: 4,
          strokeOpacity: 0.7
        }
      })
    }

    try {
      const request = {
        origin: new window.google.maps.LatLng(
          routeData.fromCoordinates.latitude,
          routeData.fromCoordinates.longitude
        ),
        destination: new window.google.maps.LatLng(
          routeData.toCoordinates.latitude,
          routeData.toCoordinates.longitude
        ),
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      }

      const result = await directionsServiceRef.current.route(request)
      
      if (visibleLayers.googleDirections) {
        directionsRendererRef.current.setMap(googleMapRef.current)
        directionsRendererRef.current.setDirections(result)
      }
    } catch (error) {
      console.warn('Could not get directions:', error)
    }
  }

  // Calculate route bounds for proper map fitting
  const calculateRouteBounds = useCallback(() => {
    const bounds = new window.google.maps.LatLngBounds()
    let hasValidPoints = false

    // Add route start/end coordinates
    if (routeData?.fromCoordinates) {
      bounds.extend({
        lat: routeData.fromCoordinates.latitude,
        lng: routeData.fromCoordinates.longitude
      })
      hasValidPoints = true
    }

    if (routeData?.toCoordinates) {
      bounds.extend({
        lat: routeData.toCoordinates.latitude,
        lng: routeData.toCoordinates.longitude
      })
      hasValidPoints = true
    }

    // Add GPS points to bounds
    if (gpsPoints && gpsPoints.length > 0) {
      gpsPoints.forEach(point => {
        const coords = getCoordinates(point)
        if (isValidCoordinate(coords)) {
          bounds.extend(coords)
          hasValidPoints = true
        }
      })
    }

    // Add all marker points to bounds for comprehensive view
    const allPoints = [
      ...sharpTurns,
      ...blindSpots,
      ...emergencyServices,
      ...accidentAreas,
      ...roadConditions,
      ...networkCoverage
    ]

    allPoints.forEach(item => {
      const coords = getCoordinates(item)
      if (isValidCoordinate(coords)) {
        bounds.extend(coords)
        hasValidPoints = true
      }
    })

    return hasValidPoints ? bounds : null
  }, [routeData, gpsPoints, sharpTurns, blindSpots, emergencyServices, accidentAreas, roadConditions, networkCoverage])

  // Initialize Google Map with enhanced features
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    // Calculate optimal center and bounds
    const routeBounds = calculateRouteBounds()
    let center = { lat: 19.0760, lng: 72.8777 } // Default to Mumbai
    let zoom = 10

    // Set center based on route data priority
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
    } else if (routeBounds) {
      center = routeBounds.getCenter().toJSON()
    }

    // Enhanced map options
    const mapConfiguration = {
      center,
      zoom: mapOptions.zoom || zoom,
      mapTypeId: mapOptions.mapType || window.google.maps.MapTypeId.ROADMAP,
      gestureHandling: 'cooperative',
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      clickableIcons: false,
      styles: mapOptions.darkMode ? [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }]
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }]
        }
      ] : [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: mapOptions.showPOI ? 'on' : 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: mapOptions.showTransit ? 'on' : 'off' }]
        }
      ]
    }

    googleMapRef.current = new window.google.maps.Map(mapRef.current, mapConfiguration)

    // Initialize places service for suggestions
    placesServiceRef.current = new window.google.maps.places.PlacesService(googleMapRef.current)

    // Add click listener
    googleMapRef.current.addListener('click', (event) => {
      if (onMapClick) {
        onMapClick(event.latLng.toJSON())
      }
    })

    // Auto-fit map to show entire route area after a short delay
    setTimeout(() => {
      fitMapToRoute()
    }, 500)

    // Draw route and get directions
    drawEnhancedRoute()
    if (mapOptions.showGoogleDirections) {
      getDirections()
    }

    // Update markers
    updateMarkers()
  }, [routeData, gpsPoints, mapOptions, calculateRouteBounds])

  // Fit map to show entire route and all markers
  const fitMapToRoute = useCallback(() => {
    if (!googleMapRef.current) return

    const bounds = calculateRouteBounds()
    
    if (bounds) {
      // Add some padding around the route
      const padding = {
        top: 50,
        right: 50,
        bottom: 100, // Extra bottom padding for statistics overlay
        left: 50
      }
      
      googleMapRef.current.fitBounds(bounds, padding)
      
      // Ensure minimum zoom level for visibility
      const listener = window.google.maps.event.addListener(googleMapRef.current, 'zoom_changed', () => {
        if (googleMapRef.current.getZoom() > 18) {
          googleMapRef.current.setZoom(18)
        }
        if (googleMapRef.current.getZoom() < 8) {
          googleMapRef.current.setZoom(8)
        }
        window.google.maps.event.removeListener(listener)
      })
      
      console.log('Map fitted to route bounds with padding')
    } else {
      console.warn('No valid route bounds found, using default center')
    }
  }, [calculateRouteBounds])

  // Enhanced update markers function for road conditions
  const updateRoadConditionMarkers = (roadConditions, visibleLayers, googleMapRef, infoWindowRef, markersRef) => {
    console.log('Updating road condition markers:', roadConditions?.length || 0, 'conditions')
    console.log('Road conditions visible:', visibleLayers?.roadConditions)
    console.log('Sample road condition:', roadConditions?.[0])

    if (!visibleLayers?.roadConditions || !roadConditions || !Array.isArray(roadConditions)) {
      console.log('Skipping road conditions - not visible or no data')
      return
    }

    const validConditions = roadConditions.filter(condition => {
      const coords = getCoordinates(condition)
      const isValid = isValidCoordinate(coords)
      if (!isValid) {
        console.warn('Invalid road condition coordinates:', condition)
      }
      return isValid
    })

    console.log(`Creating ${validConditions.length} road condition markers`)

    validConditions.forEach((condition, index) => {
      try {
        const coords = getCoordinates(condition)
        const content = `
          <div>
            <p><strong>Surface Quality:</strong> ${condition.surfaceQuality}</p>
            <p><strong>Road Type:</strong> ${condition.roadType}</p>
            <p><strong>Condition:</strong> ${condition.condition}</p>
            <p><strong>Width:</strong> ${condition.width}m</p>
            <p><strong>Lanes:</strong> ${condition.lanes}</p>
            <p><strong>Risk Score:</strong> <span style="color: ${condition.riskScore >= 7 ? '#ef4444' : condition.riskScore >= 5 ? '#f59e0b' : '#22c55e'}">${condition.riskScore}</span></p>
            ${condition.description ? `<p><strong>Description:</strong> ${condition.description}</p>` : ''}
          </div>
        `
        createEnhancedMarker(coords, `Road Condition ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.ROAD_CONDITIONS], '🛣', 'Road Condition')
      } catch (error) {
        console.error(`Error creating road condition marker ${index}:`, error)
      }
    })

    console.log(`✅ Successfully created ${validConditions.length} road condition markers`)
  }

  // Update markers based on visible layers
  const updateMarkers = useCallback(() => {
    if (!googleMapRef.current) return

    clearMapElements()
    drawEnhancedRoute()

    // Sharp Turns
    if (visibleLayers[LAYER_TYPES.SHARP_TURNS]) {
      getValidItems(sharpTurns).forEach((turn, index) => {
        const coords = getCoordinates(turn)
        if (isValidCoordinate(coords)) {
          const content = `
            <div>
              <p><strong>Turn Angle:</strong> ${turn.turnAngle}°</p>
              <p><strong>Direction:</strong> ${turn.turnDirection}</p>
              <p><strong>Risk Score:</strong> <span style="color: ${turn.riskScore >= 7 ? '#ef4444' : turn.riskScore >= 5 ? '#f59e0b' : '#22c55e'}">${turn.riskScore}</span></p>
              <p><strong>Distance:</strong> ${formatDistance(turn.distanceFromStartKm)}</p>
              ${turn.recommendedSpeed ? `<p><strong>Recommended Speed:</strong> ${turn.recommendedSpeed} km/h</p>` : ''}
              ${turn.safetyTips ? `<p><strong>Safety Tips:</strong> ${turn.safetyTips}</p>` : ''}
            </div>
          `
          createEnhancedMarker(coords, `Sharp Turn ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.SHARP_TURNS], '⚠', 'Sharp Turn')
        }
      })
    }

    // Blind Spots
    if (visibleLayers[LAYER_TYPES.BLIND_SPOTS]) {
      getValidItems(blindSpots).forEach((spot, index) => {
        const coords = getCoordinates(spot)
        if (isValidCoordinate(coords)) {
          const content = `
            <div>
              <p><strong>Type:</strong> ${spot.spotType}</p>
              <p><strong>Visibility Distance:</strong> ${spot.visibilityDistance}m</p>
              <p><strong>Risk Score:</strong> <span style="color: ${spot.riskScore >= 7 ? '#ef4444' : spot.riskScore >= 5 ? '#f59e0b' : '#22c55e'}">${spot.riskScore}</span></p>
              <p><strong>Distance:</strong> ${formatDistance(spot.distanceFromStartKm)}</p>
              ${spot.recommendations ? `<p><strong>Recommendations:</strong> ${spot.recommendations}</p>` : ''}
              ${spot.weatherImpact ? `<p><strong>Weather Impact:</strong> ${spot.weatherImpact}</p>` : ''}
            </div>
          `
          createEnhancedMarker(coords, `Blind Spot ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.BLIND_SPOTS], '👁', 'Blind Spot')
        }
      })
    }

    // Emergency Services
    if (visibleLayers[LAYER_TYPES.EMERGENCY_SERVICES]) {
      getValidItems(emergencyServices).forEach((service, index) => {
        const coords = getCoordinates(service)
        if (isValidCoordinate(coords)) {
          const getServiceIcon = (type) => {
            switch (type?.toLowerCase()) {
              case 'hospital': return '🏥'
              case 'police': return '👮'
              case 'fire': return '🚒'
              case 'mechanic': return '🔧'
              default: return '🆘'
            }
          }
          
          const content = `
            <div>
              <p><strong>Type:</strong> ${service.serviceType}</p>
              <p><strong>Distance from Route:</strong> ${formatDistance(service.distanceFromRouteKm)}</p>
              ${service.phoneNumber ? `<p><strong>Phone:</strong> <a href="tel:${service.phoneNumber}" style="color: #3b82f6;">${service.phoneNumber}</a></p>` : ''}
              ${service.operatingHours ? `<p><strong>Operating Hours:</strong> ${service.operatingHours}</p>` : ''}
              <p><strong>Response Time:</strong> ${service.responseTimeMinutes} minutes</p>
              ${service.rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(Math.floor(service.rating))} (${service.rating})</p>` : ''}
            </div>
          `
          createEnhancedMarker(coords, service.name, content, MARKER_COLORS[LAYER_TYPES.EMERGENCY_SERVICES], getServiceIcon(service.serviceType), 'Emergency Service')
        }
      })
    }

    // Accident Areas
    if (visibleLayers[LAYER_TYPES.ACCIDENT_AREAS]) {
      getValidItems(accidentAreas).forEach((area, index) => {
        const coords = getCoordinates(area)
        if (isValidCoordinate(coords)) {
          const content = `
            <div>
              <p><strong>Annual Frequency:</strong> ${area.accidentFrequencyYearly} accidents/year</p>
              <p><strong>Severity Level:</strong> ${area.accidentSeverity}</p>
              <p><strong>Risk Score:</strong> <span style="color: ${area.riskScore >= 7 ? '#ef4444' : area.riskScore >= 5 ? '#f59e0b' : '#22c55e'}">${area.riskScore}</span></p>
              <p><strong>Distance:</strong> ${formatDistance(area.distanceFromStartKm)}</p>
              ${area.commonAccidentTypes ? `<p><strong>Common Types:</strong> ${area.commonAccidentTypes}</p>` : ''}
              ${area.peakDangerTimes ? `<p><strong>Peak Danger Times:</strong> ${area.peakDangerTimes}</p>` : ''}
            </div>
          `
          createEnhancedMarker(coords, `Accident Prone Area ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.ACCIDENT_AREAS], '💥', 'Accident Area')
        }
      })
    }

    // Road Conditions - Using enhanced function
    if (visibleLayers[LAYER_TYPES.ROAD_CONDITIONS]) {
      updateRoadConditionMarkers(roadConditions, visibleLayers, googleMapRef.current, infoWindowRef.current, markersRef)
    }

    // Network Coverage Dead Zones
    if (visibleLayers[LAYER_TYPES.NETWORK_COVERAGE]) {
      getValidItems(networkCoverage)
        .filter(coverage => coverage.isDeadZone)
        .forEach((deadZone, index) => {
          const coords = getCoordinates(deadZone)
          if (isValidCoordinate(coords)) {
            const content = `
              <div>
                <p><strong>Severity:</strong> ${deadZone.deadZoneSeverity}</p>
                <p><strong>Affected Radius:</strong> ${deadZone.deadZoneRadius}m</p>
                <p><strong>Expected Duration:</strong> ${deadZone.deadZoneDuration}</p>
                <p><strong>Distance:</strong> ${formatDistance(deadZone.distanceFromStartKm)}</p>
                ${deadZone.alternativeMethods ? `<p><strong>Alternative Communication:</strong> ${deadZone.alternativeMethods}</p>` : ''}
                ${deadZone.affectedOperators ? `<p><strong>Affected Operators:</strong> ${deadZone.affectedOperators.join(', ')}</p>` : ''}
              </div>
            `
            createEnhancedMarker(coords, `Network Dead Zone ${index + 1}`, content, MARKER_COLORS[LAYER_TYPES.NETWORK_COVERAGE], '📵', 'Network Dead Zone')
          }
        })
    }

    // Add route start/end markers
    if (routeData?.fromCoordinates && visibleLayers.route) {
      const startCoords = {
        lat: routeData.fromCoordinates.latitude,
        lng: routeData.fromCoordinates.longitude
      }
      createEnhancedMarker(
        startCoords, 
        'Route Start', 
        `<div><p><strong>From:</strong> ${routeData.fromName || routeData.fromAddress}</p></div>`,
        '#22c55e',
        '🚀',
        'Start Point'
      )
    }

    if (routeData?.toCoordinates && visibleLayers.route) {
      const endCoords = {
        lat: routeData.toCoordinates.latitude,
        lng: routeData.toCoordinates.longitude
      }
      createEnhancedMarker(
        endCoords, 
        'Route End', 
        `<div><p><strong>To:</strong> ${routeData.toName || routeData.toAddress}</p></div>`,
        '#ef4444',
        '🏁',
        'End Point'
      )
    }

  }, [visibleLayers, sharpTurns, blindSpots, emergencyServices, accidentAreas, roadConditions, networkCoverage, routeData])

  useEffect(() => {
    initializeMap()
  }, [initializeMap])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  return <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
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
  onLayerToggle,
  className = ''
}) => {
  const [visibleLayers, setVisibleLayers] = useState({
    route: true,
    googleDirections: false,
    [LAYER_TYPES.SHARP_TURNS]: true,
    [LAYER_TYPES.BLIND_SPOTS]: true,
    [LAYER_TYPES.EMERGENCY_SERVICES]: true,
    [LAYER_TYPES.ACCIDENT_AREAS]: true,
    [LAYER_TYPES.ROAD_CONDITIONS]: false,
    [LAYER_TYPES.NETWORK_COVERAGE]: false
  })

  const [mapOptions, setMapOptions] = useState({
    zoom: 12,
    mapType: 'roadmap',
    darkMode: false,
    showPOI: false,
    showTransit: false,
    showGoogleDirections: false,
    showAnimatedRoute: false
  })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mapStats, setMapStats] = useState({
    markersCount: 0,
    routeDistance: 0,
    riskLevel: 'low'
  })

  // Debug logging for incoming data
  useEffect(() => {
    console.log('🗺️ RouteMap received data:', {
      routeData: !!routeData,
      gpsPointsCount: Array.isArray(gpsPoints) ? gpsPoints.length : 'not array',
      sharpTurnsCount: Array.isArray(sharpTurns) ? sharpTurns.length : 'not array',
      blindSpotsCount: Array.isArray(blindSpots) ? blindSpots.length : 'not array',
      emergencyServicesCount: Array.isArray(emergencyServices) ? emergencyServices.length : 'not array',
      accidentAreasCount: Array.isArray(accidentAreas) ? accidentAreas.length : 'not array',
      roadConditionsCount: Array.isArray(roadConditions) ? roadConditions.length : 'not array',
      networkCoverageCount: Array.isArray(networkCoverage) ? networkCoverage.length : 'not array'
    })
    
    // Log sample data for debugging
    if (gpsPoints.length > 0) {
      console.log('📍 Sample GPS point:', gpsPoints[0])
    }
    if (sharpTurns.length > 0) {
      console.log('⚠️ Sample sharp turn:', sharpTurns[0])
    }
    if (blindSpots.length > 0) {
      console.log('👁️ Sample blind spot:', blindSpots[0])
    }
  }, [routeData, gpsPoints, sharpTurns, blindSpots, emergencyServices, accidentAreas, roadConditions, networkCoverage])

  const handleLayerToggle = (layerType, visible) => {
    const newVisibleLayers = { ...visibleLayers, [layerType]: visible }
    setVisibleLayers(newVisibleLayers)
    if (onLayerToggle) {
      onLayerToggle(layerType, visible)
    }
  }

  const handleMapOptionChange = (option, value) => {
    setMapOptions(prev => ({ ...prev, [option]: value }))
  }

  const handleMarkerClick = (category, position, title) => {
    console.log('Marker clicked:', { category, position, title })
  }

  const handleMapClick = (position) => {
    console.log('Map clicked at:', position)
  }

  const handleExportData = () => {
    const exportData = {
      route: routeData,
      layers: visibleLayers,
      statistics: mapStats,
      dataCount: {
        gpsPoints: gpsPoints.length,
        sharpTurns: sharpTurns.length,
        blindSpots: blindSpots.length,
        emergencyServices: emergencyServices.length,
        accidentAreas: accidentAreas.length,
        roadConditions: roadConditions.length,
        networkCoverage: networkCoverage.length
      },
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `route-${routeData?.routeName || 'data'}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateStats = () => {
    const totalMarkers = Object.values(visibleLayers).filter(Boolean).length - 1 // Exclude route layer
    const routeDistance = routeData?.totalDistance || 0
    const riskLevel = routeData?.riskLevel || 'low'
    
    setMapStats({
      markersCount: totalMarkers,
      routeDistance,
      riskLevel
    })
  }

  useEffect(() => {
    calculateStats()
  }, [visibleLayers, routeData])

  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading Google Maps...</p>
              <p className="text-sm text-gray-500 mt-1">Initializing interactive map features</p>
            </div>
          </div>
        )
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Failed to load Google Maps</p>
              <p className="text-sm text-gray-500 mt-2">Please check your API key and internet connection</p>
              <p className="text-xs text-gray-400 mt-1">API Key: {GOOGLE_MAPS_API_KEY ? '✓ Present' : '✗ Missing'}</p>
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
            mapOptions={mapOptions}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enhanced Control Panel */}
      <Card className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Interactive Route Map</h3>
              <p className="text-sm text-gray-600">{routeData?.routeName || 'Route Visualization'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="primary" className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>{mapStats.markersCount} Markers</span>
            </Badge>
            <Badge variant={mapStats.riskLevel === 'high' ? 'danger' : mapStats.riskLevel === 'medium' ? 'warning' : 'success'}>
              {mapStats.riskLevel} Risk
            </Badge>
            <Button
              variant="outline"
              size="sm"
              icon={Settings}
              onClick={() => setShowSettings(!showSettings)}
            >
              Settings
            </Button>
            <Button
              variant="outline" 
              size="sm"
              icon={isFullscreen ? Minimize : Maximize}
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? 'Exit' : 'Full'}
            </Button>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers.route}
              onChange={(checked) => handleLayerToggle('route', checked)}
              label="Route Line"
              className="text-sm font-medium"
            />
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers.googleDirections}
              onChange={(checked) => {
                handleLayerToggle('googleDirections', checked)
                handleMapOptionChange('showGoogleDirections', checked)
              }}
              label="Google Directions"
              className="text-sm"
            />
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers[LAYER_TYPES.SHARP_TURNS]}
              onChange={(checked) => handleLayerToggle(LAYER_TYPES.SHARP_TURNS, checked)}
              label="Sharp Turns"
              className="text-sm"
            />
            <div className="flex items-center mt-1">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.SHARP_TURNS] }}></div>
              <span className="text-xs text-gray-500">{sharpTurns.length} found</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers[LAYER_TYPES.BLIND_SPOTS]}
              onChange={(checked) => handleLayerToggle(LAYER_TYPES.BLIND_SPOTS, checked)}
              label="Blind Spots"
              className="text-sm"
            />
            <div className="flex items-center mt-1">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.BLIND_SPOTS] }}></div>
              <span className="text-xs text-gray-500">{blindSpots.length} found</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers[LAYER_TYPES.EMERGENCY_SERVICES]}
              onChange={(checked) => handleLayerToggle(LAYER_TYPES.EMERGENCY_SERVICES, checked)}
              label="Emergency Services"
              className="text-sm"
            />
            <div className="flex items-center mt-1">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.EMERGENCY_SERVICES] }}></div>
              <span className="text-xs text-gray-500">{emergencyServices.length} found</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers[LAYER_TYPES.ACCIDENT_AREAS]}
              onChange={(checked) => handleLayerToggle(LAYER_TYPES.ACCIDENT_AREAS, checked)}
              label="Accident Areas"
              className="text-sm"
            />
            <div className="flex items-center mt-1">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.ACCIDENT_AREAS] }}></div>
              <span className="text-xs text-gray-500">{accidentAreas.length} found</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers[LAYER_TYPES.ROAD_CONDITIONS]}
              onChange={(checked) => handleLayerToggle(LAYER_TYPES.ROAD_CONDITIONS, checked)}
              label="Road Conditions"
              className="text-sm"
            />
            <div className="flex items-center mt-1">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.ROAD_CONDITIONS] }}></div>
              <span className="text-xs text-gray-500">{roadConditions.length} found</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <Toggle
              checked={visibleLayers[LAYER_TYPES.NETWORK_COVERAGE]}
              onChange={(checked) => handleLayerToggle(LAYER_TYPES.NETWORK_COVERAGE, checked)}
              label="Network Dead Zones"
              className="text-sm"
            />
            <div className="flex items-center mt-1">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.NETWORK_COVERAGE] }}></div>
              <span className="text-xs text-gray-500">{networkCoverage.filter(nc => nc.isDeadZone).length} found</span>
            </div>
          </div>
        </div>

        {/* Advanced Settings Panel */}
        {showSettings && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Map Settings
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Map Type</label>
                <select
                  value={mapOptions.mapType}
                  onChange={(e) => handleMapOptionChange('mapType', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="roadmap">Roadmap</option>
                  <option value="satellite">Satellite</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="terrain">Terrain</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Level</label>
                <input
                  type="range"
                  min="8"
                  max="18"
                  value={mapOptions.zoom}
                  onChange={(e) => handleMapOptionChange('zoom', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{mapOptions.zoom}x</span>
              </div>

              <div className="space-y-2">
                <Toggle
                  checked={mapOptions.darkMode}
                  onChange={(checked) => handleMapOptionChange('darkMode', checked)}
                  label="Dark Mode"
                  className="text-sm"
                />
                <Toggle
                  checked={mapOptions.showPOI}
                  onChange={(checked) => handleMapOptionChange('showPOI', checked)}
                  label="Points of Interest"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Toggle
                  checked={mapOptions.showTransit}
                  onChange={(checked) => handleMapOptionChange('showTransit', checked)}
                  label="Transit Lines"
                  className="text-sm"
                />
                <Toggle
                  checked={mapOptions.showAnimatedRoute}
                  onChange={(checked) => handleMapOptionChange('showAnimatedRoute', checked)}
                  label="Animated Route"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={() => window.location.reload()}
              >
                Reset Map
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={MapPin}
                onClick={fitMapToRoute}
              >
                Fit to Route
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleExportData}
              >
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Share}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: routeData?.routeName || 'Route Map',
                      text: 'Check out this route analysis',
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
              >
                Share
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Google Maps Container */}
      <Card className={`p-0 overflow-hidden shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <div className={`${isFullscreen ? 'h-full' : 'h-[600px]'} relative`}>
          <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render} libraries={['places', 'geometry']} />
          
          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <div className="text-xs font-medium text-gray-700">Live Data</div>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Connected</span>
              </div>
            </div>
          </div>

          {/* Route Statistics Overlay */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Route Statistics
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{formatDistance(mapStats.routeDistance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk Level:</span>
                  <Badge variant={mapStats.riskLevel === 'high' ? 'danger' : mapStats.riskLevel === 'medium' ? 'warning' : 'success'} size="sm">
                    {mapStats.riskLevel}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Layers:</span>
                  <span className="font-medium">{Object.values(visibleLayers).filter(Boolean).length}</span>
                </div>
                {routeData?.estimatedDuration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{Math.round(routeData.estimatedDuration / 60)} min</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Legend */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Interactive Legend
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Start Point</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>End Point</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.SHARP_TURNS] }}></div>
            <span>Sharp Turns</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.BLIND_SPOTS] }}></div>
            <span>Blind Spots</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.EMERGENCY_SERVICES] }}></div>
            <span>Emergency Services</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.ACCIDENT_AREAS] }}></div>
            <span>Accident Areas</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.NETWORK_COVERAGE] }}></div>
            <span>Network Dead Zones</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: MARKER_COLORS[LAYER_TYPES.ROAD_CONDITIONS] }}></div>
            <span>Road Conditions</span>
          </div>
        </div>
      </Card>

      {/* Route Information */}
      {routeData && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Navigation className="w-4 h-4 mr-2" />
            Route Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">From:</span>
                <p className="font-medium text-gray-900">{routeData.fromName || routeData.fromAddress}</p>
              </div>
              <div>
                <span className="text-gray-600">To:</span>
                <p className="font-medium text-gray-900">{routeData.toName || routeData.toAddress}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Distance:</span>
                <p className="font-medium text-gray-900">{formatDistance(routeData.totalDistance)}</p>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <p className="font-medium text-gray-900">
                  {routeData.estimatedDuration ? `${Math.round(routeData.estimatedDuration / 60)} hours` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Risk Level:</span>
                <Badge variant={getRiskColor(routeData.riskLevel)} className="ml-2">
                  {routeData.riskLevel || 'Unknown'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">GPS Points:</span>
                <p className="font-medium text-gray-900">{gpsPoints.length}</p>
              </div>
            </div>
          </div>
          
          {routeData.liveMapLink && (
            <div className="mt-4 pt-3 border-t border-blue-200">
              <Button
                variant="primary"
                size="sm"
                icon={MapPin}
                onClick={() => window.open(routeData.liveMapLink, '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Open in Google Maps
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* API Status Indicator */}
      <Card className="p-3 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-green-800 font-medium">
              Interactive map with live Google Maps integration
            </p>
          </div>
          <Badge variant="success" size="sm">
            API Connected
          </Badge>
        </div>
      </Card>
    </div>
  )
}

export default RouteMap