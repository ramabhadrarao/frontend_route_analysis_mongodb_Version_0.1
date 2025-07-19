export const config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Route Analysis System',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.1',
    AUTH_TOKEN_KEY: import.meta.env.VITE_AUTH_TOKEN_KEY || 'route_analysis_token',
    REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || 'route_analysis_refresh',
    ENV: import.meta.env.VITE_ENV || 'development'
}