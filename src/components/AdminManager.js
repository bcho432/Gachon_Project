import React, { useState, useEffect } from 'react'
import { FALLBACK_ADMIN_USER_IDS, addAdmin, removeAdmin, getAllAdmins } from '../utils/adminConfig'
import { UserPlus, UserMinus, Users, RefreshCw, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const AdminManager = () => {
  const { user } = useAuth()
  const [newAdminId, setNewAdminId] = useState('')
  const [adminList, setAdminList] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load admins from database
  const loadAdmins = async () => {
    setLoading(true)
    try {
      const admins = await getAllAdmins()
      setAdminList(admins)
    } catch (error) {
      console.error('Error loading admins:', error)
      toast.error('Failed to load admin list')
    } finally {
      setLoading(false)
    }
  }

  // Load admins on component mount
  useEffect(() => {
    loadAdmins()
  }, [])

  // Debug logging for admin list and current user
  useEffect(() => {
    console.log('Admin list:', adminList)
    console.log('Current user:', user)
    console.log('Is current user primary admin?', adminList[0]?.user_id === user?.id)
  }, [adminList, user])

  const handleAddAdmin = async () => {
    if (!newAdminId.trim()) {
      toast.error('Please enter a user ID')
      return
    }

    // Check if already an admin
    const isAlreadyAdmin = adminList.some(admin => admin.user_id === newAdminId.trim())
    if (isAlreadyAdmin) {
      toast.error('User is already an admin')
      return
    }

    setLoading(true)
    try {
      await addAdmin(newAdminId.trim())
      setNewAdminId('')
      await loadAdmins() // Reload the list
      toast.success('Admin added successfully!')
    } catch (error) {
      console.error('Error adding admin:', error)
      toast.error('Failed to add admin. Please check the user ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async (userId) => {
    if (adminList.length <= 1) {
      toast.error('Cannot remove the last admin')
      return
    }

    // Check if current user is the primary admin
    const isPrimaryAdmin = adminList[0]?.user_id === user?.id
    if (!isPrimaryAdmin) {
      toast.error('Only the Primary Admin can remove other admins')
      return
    }

    // Check if trying to remove the primary admin
    const isRemovingPrimary = adminList[0]?.user_id === userId
    if (isRemovingPrimary) {
      toast.error('Cannot remove the Primary Admin')
      return
    }

    setLoading(true)
    try {
      await removeAdmin(userId)
      await loadAdmins() // Reload the list
      toast.success('Admin removed successfully!')
    } catch (error) {
      console.error('Error removing admin:', error)
      toast.error('Failed to remove admin')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAdmins()
    setRefreshing(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Admin Management
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Add New Admin */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Add New Admin</h4>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter user UUID"
            value={newAdminId}
            onChange={(e) => setNewAdminId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleAddAdmin}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Get user UUID from Supabase Dashboard → Authentication → Users
        </p>
      </div>

      {/* Current Admins */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Current Admins ({adminList.length})
        </h4>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading admins...</p>
          </div>
        ) : adminList.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>No admins found. Add the first admin above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {adminList.map((admin, index) => {
              const isPrimaryAdmin = index === 0
              const isCurrentUser = user?.id === admin.user_id
              const isCurrentUserPrimaryAdmin = adminList[0]?.user_id === user?.id
              
              // Debug logging
              console.log('Admin entry:', {
                adminId: admin.user_id,
                adminEmail: admin.email,
                isPrimaryAdmin,
                isCurrentUser,
                isCurrentUserPrimaryAdmin,
                currentUserId: user?.id,
                firstAdminId: adminList[0]?.user_id
              })
              
              return (
                <div key={admin.user_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{admin.user_id}</p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                      <p className="text-xs text-gray-400">
                        {isPrimaryAdmin ? 'Primary Admin' : 'Additional Admin'} • {admin.admin_level}
                      </p>
                    </div>
                    {isPrimaryAdmin && (
                      <Shield className="h-4 w-4 ml-2 text-yellow-600" />
                    )}
                  </div>
                  {isCurrentUserPrimaryAdmin && !isPrimaryAdmin && adminList.length > 1 ? (
                    <button
                      onClick={() => handleRemoveAdmin(admin.user_id)}
                      disabled={loading}
                      className="flex items-center px-2 py-1 text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  ) : !isPrimaryAdmin && !isCurrentUserPrimaryAdmin ? (
                    <span className="text-xs text-gray-400 px-2 py-1">
                      Only Primary Admin can remove
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Important Notes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Admin changes are now persistent and stored in the database</li>
          <li>• At least one admin must remain in the system</li>
          <li>• Only the Primary Admin (first in list) can remove other admins</li>
          <li>• The Primary Admin cannot be removed</li>
          <li>• Use the Refresh button to reload the admin list</li>
          <li>• Admin status persists across page refreshes</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminManager 