import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import { Toaster } from 'react-hot-toast'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default Layout