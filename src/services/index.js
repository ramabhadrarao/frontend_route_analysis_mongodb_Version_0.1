/**
 * Services Index - Central export point for all services
 * Provides easy access to all service modules
 */

// Authentication services
export { authService } from './authService'
export { api } from './authService'

// API services (legacy - for backward compatibility)
export { apiService } from './apiService'

// Route-specific services (new organized structure)
import RouteController, { routeController } from './routeController'
import RouteService, { routeService } from './routeService'

export { RouteController, routeController }
export { RouteService, routeService }

// Re-export commonly used services with aliases for convenience
export {
  routeController as routes,
  routeService as routeManager
}

/**
 * Service Usage Guide:
 * 
 * 1. RouteController (routeController):
 *    - Low-level API calls
 *    - Direct endpoint interactions
 *    - Error handling
 *    - Data fetching from all models
 * 
 * 2. RouteService (routeService):
 *    - High-level business logic
 *    - Data validation
 *    - Enhanced operations
 *    - Bulk processing
 *    - Risk analysis integration
 * 
 * 3. ApiService (apiService):
 *    - Legacy service (maintained for compatibility)
 *    - Contains all API endpoints organized by category
 * 
 * Examples:
 * 
 * // Using RouteController for direct API calls
 * import { routeController } from '@/services'
 * const routes = await routeController.getAllRoutes({ page: 1, limit: 10 })
 * 
 * // Using RouteService for enhanced operations
 * import { routeService } from '@/services'
 * const routeDetails = await routeService.getRouteDetails(routeId, {
 *   includeRiskAnalysis: true
 * })
 * 
 * // Using aliases for convenience
 * import { routes, routeManager } from '@/services'
 * const gpsPoints = await routes.getGPSPoints(routeId)
 * const analysis = await routeManager.analyzeRoute(routeId)
 */