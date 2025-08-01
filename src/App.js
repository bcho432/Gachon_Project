import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthForm from './components/AuthForm'
import CVForm from './components/CVForm'
import AdminView from './components/AdminView'
import UserDashboard from './components/UserDashboard'
import Navigation from './components/Navigation'
import { checkIsAdmin } from './utils/adminConfig'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(adminOnly)
  
  useEffect(() => {
    if (adminOnly && user) {
      const checkAdmin = async () => {
        try {
          const adminStatus = await checkIsAdmin(user.id)
          setIsAdmin(adminStatus)
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        } finally {
          setLoading(false)
        }
      }
      checkAdmin()
    }
  }, [user, adminOnly])
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // For admin routes, check if user is admin
  if (adminOnly) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )
    }
    
    if (!isAdmin) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

// Main App Content
const AppContent = () => {
  const { user } = useAuth()

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navigation />}
        
        <Routes>
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/" replace /> : <AuthForm />} 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <CVForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminView />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </AuthProvider>
  )
}

export default App 