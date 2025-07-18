import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, LayersControl } from 'react-leaflet'
import { divIcon } from 'leaflet'
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
import 'leaflet/dist/leaflet.css'

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
    [LAYER_TYPES.SHARP_TURNS]: true,
    [LAYER_TYPES.BLIND_SPOTS]: true,
    [LAYER_TYPES.EMERGENCY_SERVICES]: true,
    [LAYER_TYPES.ACCIDENT_AREAS]: true,
    [LAYER_TYPES.ROAD_CONDITIONS]: false,
    [LAYER_TYPES.NETWORK_COVERAGE]: false
  })

  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]) // Default to Mumbai
  const [mapZoom, setMapZoom] = useState(10)

  useEffect(() => {
    if (gpsPoints.length > 0) {
      const firstPoint = gpsPoints[0]
      setMapCenter([firstPoint.latitude, firstPoint.longitude])
      setMapZoom(12)
    }
  }, [gpsPoints])

  const handleLayerToggle = (layerType, visible) => {
    const newVisibleLayers = { ...visibleLayers, [layerType]: visible }
    setVisibleLayers(newVisibleLayers)
    if (onLayerToggle) {
      onLayerToggle(layerType, visible)
    }
  }

  const createCustomIcon = (color, iconComponent) => {
    return divIcon({
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          ${iconComponent}
        </svg>
      </div>`,
      className: 'custom-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }

  const routePath = gpsPoints.map(point => [point.latitude, point.longitude])

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

      {/* Map Container */}
      <Card className="p-0 overflow-hidden">
        <div style={{ height: '600px', width: '100%' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route Path */}
            {routePath.length > 0 && (
              <Polyline
                positions={routePath}
                color={getRiskColor(routeData?.riskLevel)}
                weight={4}
                opacity={0.8}
              />
            )}

            {/* Sharp Turns */}
            {visibleLayers[LAYER_TYPES.SHARP_TURNS] && sharpTurns.map((turn, index) => (
              <Marker
                key={`sharp-turn-${index}`}
                position={[turn.latitude, turn.longitude]}
                icon={createCustomIcon(MARKER_COLORS[LAYER_TYPES.SHARP_TURNS], '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>')}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-orange-600 mb-2">Sharp Turn</h4>
                    <p><strong>Angle:</strong> {turn.turnAngle}°</p>
                    <p><strong>Direction:</strong> {turn.turnDirection}</p>
                    <p><strong>Risk Score:</strong> {turn.riskScore}</p>
                    <p><strong>Distance:</strong> {formatDistance(turn.distanceFromStartKm)}</p>
                    {turn.recommendedSpeed && (
                      <p><strong>Recommended Speed:</strong> {turn.recommendedSpeed} km/h</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Blind Spots */}
            {visibleLayers[LAYER_TYPES.BLIND_SPOTS] && blindSpots.map((spot, index) => (
              <Marker
                key={`blind-spot-${index}`}
                position={[spot.latitude, spot.longitude]}
                icon={createCustomIcon(MARKER_COLORS[LAYER_TYPES.BLIND_SPOTS], '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>')}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-red-600 mb-2">Blind Spot</h4>
                    <p><strong>Type:</strong> {spot.spotType}</p>
                    <p><strong>Visibility:</strong> {spot.visibilityDistance}m</p>
                    <p><strong>Risk Score:</strong> {spot.riskScore}</p>
                    <p><strong>Distance:</strong> {formatDistance(spot.distanceFromStartKm)}</p>
                    {spot.recommendations && (
                      <p><strong>Recommendations:</strong> {spot.recommendations}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Emergency Services */}
            {visibleLayers[LAYER_TYPES.EMERGENCY_SERVICES] && emergencyServices.map((service, index) => (
              <Marker
                key={`emergency-${index}`}
                position={[service.latitude, service.longitude]}
                icon={createCustomIcon(MARKER_COLORS[LAYER_TYPES.EMERGENCY_SERVICES], '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>')}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-green-600 mb-2">{service.name}</h4>
                    <p><strong>Type:</strong> {service.serviceType}</p>
                    <p><strong>Distance:</strong> {formatDistance(service.distanceFromRouteKm)}</p>
                    {service.phoneNumber && (
                      <p><strong>Phone:</strong> {service.phoneNumber}</p>
                    )}
                    {service.operatingHours && (
                      <p><strong>Hours:</strong> {service.operatingHours}</p>
                    )}
                    <p><strong>Response Time:</strong> {service.responseTimeMinutes} min</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Accident Areas */}
            {visibleLayers[LAYER_TYPES.ACCIDENT_AREAS] && accidentAreas.map((area, index) => (
              <Marker
                key={`accident-${index}`}
                position={[area.latitude, area.longitude]}
                icon={createCustomIcon(MARKER_COLORS[LAYER_TYPES.ACCIDENT_AREAS], '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>')}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-red-800 mb-2">Accident Prone Area</h4>
                    <p><strong>Frequency:</strong> {area.accidentFrequencyYearly}/year</p>
                    <p><strong>Severity:</strong> {area.accidentSeverity}</p>
                    <p><strong>Risk Score:</strong> {area.riskScore}</p>
                    <p><strong>Distance:</strong> {formatDistance(area.distanceFromStartKm)}</p>
                    {area.commonAccidentTypes && (
                      <p><strong>Common Types:</strong> {area.commonAccidentTypes}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Network Coverage Dead Zones */}
            {visibleLayers[LAYER_TYPES.NETWORK_COVERAGE] && networkCoverage
              .filter(coverage => coverage.isDeadZone)
              .map((deadZone, index) => (
                <Marker
                  key={`network-${index}`}
                  position={[deadZone.latitude, deadZone.longitude]}
                  icon={createCustomIcon(MARKER_COLORS[LAYER_TYPES.NETWORK_COVERAGE], '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>')}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold text-gray-600 mb-2">Network Dead Zone</h4>
                      <p><strong>Severity:</strong> {deadZone.deadZoneSeverity}</p>
                      <p><strong>Radius:</strong> {deadZone.deadZoneRadius}m</p>
                      <p><strong>Duration:</strong> {deadZone.deadZoneDuration}</p>
                      <p><strong>Distance:</strong> {formatDistance(deadZone.distanceFromStartKm)}</p>
                      {deadZone.alternativeMethods && (
                        <p><strong>Alternatives:</strong> {deadZone.alternativeMethods}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
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
    </div>
  )
}

export default RouteMap