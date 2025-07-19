import { describe, it, expect } from 'vitest'
import { formatDistance, formatDuration, formatCoordinates } from '../../utils/helpers'

describe('Helper Functions', () => {
  describe('formatDistance', () => {
    it('should format distance in kilometers for values >= 1', () => {
      expect(formatDistance(1.5)).toBe('1.50km')
      expect(formatDistance(10.234)).toBe('10.23km')
      expect(formatDistance(100)).toBe('100.00km')
    })

    it('should format distance in meters for values < 1', () => {
      expect(formatDistance(0.5)).toBe('500m')
      expect(formatDistance(0.123)).toBe('123m')
      expect(formatDistance(0.001)).toBe('1m')
    })

    it('should handle edge cases and invalid inputs', () => {
      expect(formatDistance(null)).toBe('0km')
      expect(formatDistance(undefined)).toBe('0km')
      expect(formatDistance(NaN)).toBe('0km')
      expect(formatDistance(0)).toBe('0m')
    })
  })

  describe('formatDuration', () => {
    it('should format duration in hours and minutes for values >= 60', () => {
      expect(formatDuration(60)).toBe('1h 0min')
      expect(formatDuration(90)).toBe('1h 30min')
      expect(formatDuration(125)).toBe('2h 5min')
    })

    it('should format duration in minutes for values < 60', () => {
      expect(formatDuration(30)).toBe('30min')
      expect(formatDuration(1)).toBe('1min')
      expect(formatDuration(59)).toBe('59min')
    })

    it('should handle edge cases and invalid inputs', () => {
      expect(formatDuration(null)).toBe('0min')
      expect(formatDuration(undefined)).toBe('0min')
      expect(formatDuration(NaN)).toBe('0min')
      expect(formatDuration(0)).toBe('0min')
    })
  })

  describe('formatCoordinates', () => {
    it('should format valid coordinates with 6 decimal places', () => {
      expect(formatCoordinates(12.345678, 98.765432)).toBe('12.345678, 98.765432')
      expect(formatCoordinates(0, 0)).toBe('0.000000, 0.000000')
      expect(formatCoordinates(-12.345, 98.765)).toBe('-12.345000, 98.765000')
    })

    it('should handle edge cases and invalid inputs', () => {
      expect(formatCoordinates(null, null)).toBe('0.000000, 0.000000')
      expect(formatCoordinates(undefined, undefined)).toBe('0.000000, 0.000000')
      expect(formatCoordinates(NaN, NaN)).toBe('0.000000, 0.000000')
      expect(formatCoordinates(12.345, null)).toBe('0.000000, 0.000000')
      expect(formatCoordinates(null, 98.765)).toBe('0.000000, 0.000000')
    })
  })
})