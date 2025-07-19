import { RISK_LEVELS, RISK_COLORS, RISK_LABELS } from './constants'
import { format } from 'date-fns'

export const getRiskColor = (riskLevel) => {
  return RISK_COLORS[riskLevel?.toLowerCase()] || RISK_COLORS[RISK_LEVELS.LOW]
}

export const getRiskLabel = (riskLevel) => {
  return RISK_LABELS[riskLevel?.toLowerCase()] || RISK_LABELS[RISK_LEVELS.LOW]
}

export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '0km'
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(1)}km`
}

export const formatDuration = (durationMinutes) => {
  if (durationMinutes === null || durationMinutes === undefined || isNaN(durationMinutes)) {
    return '0min'
  }
  if (durationMinutes < 60) {
    return `${Math.round(durationMinutes)}min`
  }
  const hours = Math.floor(durationMinutes / 60)
  const minutes = Math.round(durationMinutes % 60)
  return `${hours}h ${minutes}min`
}

export const formatDate = (date) => {
  if (!date) {
    return 'N/A'
  }
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    return format(dateObj, 'MMM dd, yyyy')
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Invalid Date'
  }
}

export const formatDateTime = (date) => {
  if (!date) {
    return 'N/A'
  }
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    return format(dateObj, 'MMM dd, yyyy HH:mm')
  } catch (error) {
    console.error('DateTime formatting error:', error)
    return 'Invalid Date'
  }
}

export const calculateRiskScore = (factors) => {
  const weights = {
    sharpTurns: 0.2,
    blindSpots: 0.25,
    accidentAreas: 0.2,
    roadConditions: 0.15,
    networkCoverage: 0.1,
    trafficData: 0.1
  }

  let totalScore = 0
  let totalWeight = 0

  Object.entries(factors).forEach(([key, value]) => {
    if (weights[key] && value !== null && value !== undefined) {
      totalScore += value * weights[key]
      totalWeight += weights[key]
    }
  })

  return totalWeight > 0 ? totalScore / totalWeight : 0
}

export const getRiskLevel = (riskScore) => {
  if (riskScore >= 80) return RISK_LEVELS.CRITICAL
  if (riskScore >= 60) return RISK_LEVELS.HIGH
  if (riskScore >= 40) return RISK_LEVELS.MEDIUM
  return RISK_LEVELS.LOW
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export const validateCSVFile = (file) => {
  const errors = []
  
  if (!file) {
    errors.push('Please select a file')
    return errors
  }

  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    errors.push('Please select a CSV file')
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    errors.push('File size should be less than 10MB')
  }

  return errors
}

export const generateCSVTemplate = () => {
  const headers = [
    'routeName',
    'fromAddress',
    'toAddress',
    'fromLatitude',
    'fromLongitude',
    'toLatitude',
    'toLongitude'
  ]
  
  const sampleData = [
    'Sample Route 1',
    'Mumbai, Maharashtra',
    'Pune, Maharashtra',
    '19.0760',
    '72.8777',
    '18.5204',
    '73.8567'
  ]

  return [headers, sampleData].map(row => row.join(',')).join('\n')
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

export const getCoordinatesFromString = (coordsString) => {
  if (!coordsString) return null
  
  const coords = coordsString.split(',').map(c => parseFloat(c.trim()))
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    return { lat: coords[0], lng: coords[1] }
  }
  return null
}

export const formatCoordinates = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return '0.000000, 0.000000'
  }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}