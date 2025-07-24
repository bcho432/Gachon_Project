import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthForm from './components/AuthForm'
import CVForm from './components/CVForm'
import AdminView from './components/AdminView'
import Navigation from './components/Navigation'
import { checkIsAdmin } from './utils/adminConfig'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // For admin routes, check if user is admin
  if (adminOnly) {
    if (!checkIsAdmin(user.id)) {
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