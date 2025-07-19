import React from 'react'
import { BrowserRouter as Router, Routes as RouterRoutes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BulkProcessor from './pages/BulkProcessor'
import RoutesPage from './pages/Routes'
import RouteDetails from './pages/RouteDetails'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <RouterRoutes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bulk-processor" element={<BulkProcessor />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="routes/:_id" element={<RouteDetails />} />
            <Route path="" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </RouterRoutes>
      </Router>
    </AuthProvider>
  )
}

export default App