export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

export const RISK_COLORS = {
  [RISK_LEVELS.LOW]: '#22c55e',
  [RISK_LEVELS.MEDIUM]: '#f59e0b',
  [RISK_LEVELS.HIGH]: '#f97316',
  [RISK_LEVELS.CRITICAL]: '#ef4444'
}

export const RISK_LABELS = {
  [RISK_LEVELS.LOW]: 'Low Risk',
  [RISK_LEVELS.MEDIUM]: 'Medium Risk',
  [RISK_LEVELS.HIGH]: 'High Risk',
  [RISK_LEVELS.CRITICAL]: 'Critical Risk'
}

export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

export const LAYER_TYPES = {
  SHARP_TURNS: 'sharpTurns',
  BLIND_SPOTS: 'blindSpots',
  EMERGENCY_SERVICES: 'emergencyServices',
  ACCIDENT_AREAS: 'accidentAreas',
  ROAD_CONDITIONS: 'roadConditions',
  NETWORK_COVERAGE: 'networkCoverage',
  TRAFFIC_DATA: 'trafficData',
  WEATHER_DATA: 'weatherData'
}

export const MARKER_COLORS = {
  [LAYER_TYPES.SHARP_TURNS]: '#f97316',
  [LAYER_TYPES.BLIND_SPOTS]: '#ef4444',
  [LAYER_TYPES.EMERGENCY_SERVICES]: '#22c55e',
  [LAYER_TYPES.ACCIDENT_AREAS]: '#7f1d1d',
  [LAYER_TYPES.ROAD_CONDITIONS]: '#3b82f6',
  [LAYER_TYPES.NETWORK_COVERAGE]: '#6b7280',
  [LAYER_TYPES.TRAFFIC_DATA]: '#8b5cf6',
  [LAYER_TYPES.WEATHER_DATA]: '#06b6d4'
}

export const OPERATOR_COLORS = {
  AIRTEL: '#e60026',
  JIO: '#0066cc',
  VI: '#e60000',
  BSNL: '#ff6600'
}

export const COVERAGE_TYPES = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  NO_COVERAGE: 'no_coverage'
}

export const ROUTE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived'
}

export const DATA_COLLECTION_OPTIONS = {
  SHARP_TURNS: 'includeSharpTurns',
  BLIND_SPOTS: 'includeBlindSpots',
  NETWORK_COVERAGE: 'includeNetworkCoverage',
  ROAD_CONDITIONS: 'includeRoadConditions',
  ACCIDENT_DATA: 'includeAccidentData',
  SEASONAL_WEATHER: 'includeSeasonalWeather',
  EMERGENCY_SERVICES: 'includeEmergencyServices',
  TRAFFIC_DATA: 'includeTrafficData'
}