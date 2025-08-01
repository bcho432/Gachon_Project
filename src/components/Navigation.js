import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, ChevronDown, Shield } from 'lucide-react'
import { checkIsAdmin } from '../utils/adminConfig'

const Navigation = () => {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        setAdminLoading(true)
        try {
          const adminStatus = await checkIsAdmin(user.id)
          setIsAdmin(adminStatus)
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        } finally {
          setAdminLoading(false)
        }
      } else {
        setIsAdmin(false)
        setAdminLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">CV Manager</h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {/* Admin Link - Only show for admin users */}
              {!adminLoading && isAdmin && (
                <a
                  href="/admin"
                  className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin Dashboard
                </a>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <User className="h-5 w-5" />
                  <span>{user.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {isAdmin ? 'Admin User' : 'Regular User'}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation 