// Test script to check if route data exists
const routeId = '687a72b212446dc1bd6a7ec6';

console.log('Testing route ID:', routeId);
console.log('Route ID length:', routeId.length);
console.log('Route ID type:', typeof routeId);

// Test URLs
const baseUrl = 'http://localhost:3000/api';
const testUrls = [
  `${baseUrl}/routes/${routeId}`,
  `${baseUrl}/routes/${routeId}/gps-points`,
  `${baseUrl}/routes/${routeId}/emergency-services`,
  `${baseUrl}/routes/${routeId}/weather-data`,
  `${baseUrl}/routes/${routeId}/traffic-data`,
  `${baseUrl}/routes/${routeId}/accident-areas`,
  `${baseUrl}/routes/${routeId}/road-conditions`,
  `${baseUrl}/routes/${routeId}/blind-spots`,
  `${baseUrl}/routes/${routeId}/sharp-turns`
];

console.log('Test URLs:');
testUrls.forEach(url => console.log(url));

// Test if we can fetch the main route
fetch(`${baseUrl}/routes/${routeId}`)
  .then(response => {
    console.log('Main route response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Main route data:', data);
  })
  .catch(error => {
    console.error('Error fetching main route:', error);
  });

// Test if we can fetch all routes
fetch(`${baseUrl}/routes`)
  .then(response => {
    console.log('All routes response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('All routes data:', data);
    if (data.data && data.data.routes) {
      console.log('Number of routes found:', data.data.routes.length);
      data.data.routes.forEach(route => {
        console.log('Route:', route._id || route.routeId, route.routeName || 'No name');
      });
    }
  })
  .catch(error => {
    console.error('Error fetching all routes:', error);
  });