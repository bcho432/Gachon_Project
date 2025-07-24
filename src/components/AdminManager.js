import React, { useState } from 'react'
import { ADMIN_USER_IDS, addAdmin, removeAdmin } from '../utils/adminConfig'
import { UserPlus, UserMinus, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminManager = () => {
  const [newAdminId, setNewAdminId] = useState('')
  const [adminList, setAdminList] = useState(ADMIN_USER_IDS)

  const handleAddAdmin = () => {
    if (!newAdminId.trim()) {
      toast.error('Please enter a user ID')
      return
    }

    if (adminList.includes(newAdminId.trim())) {
      toast.error('User is already an admin')
      return
    }

    addAdmin(newAdminId.trim())
    setAdminList([...ADMIN_USER_IDS])
    setNewAdminId('')
    toast.success('Admin added successfully!')
  }

  const handleRemoveAdmin = (userId) => {
    if (adminList.length <= 1) {
      toast.error('Cannot remove the last admin')
      return
    }

    removeAdmin(userId)
    setAdminList([...ADMIN_USER_IDS])
    toast.success('Admin removed successfully!')
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Users className="h-5 w-5 mr-2" />
        Admin Management
      </h3>

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
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Get user UUID from Supabase Dashboard → Authentication → Users
        </p>
      </div>

      {/* Current Admins */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Admins</h4>
        <div className="space-y-2">
          {adminList.map((userId, index) => (
            <div key={userId} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-900">{userId}</p>
                <p className="text-xs text-gray-500">
                  {index === 0 ? 'Primary Admin' : 'Additional Admin'}
                </p>
              </div>
              {adminList.length > 1 && (
                <button
                  onClick={() => handleRemoveAdmin(userId)}
                  className="flex items-center px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Important Notes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Changes require a page refresh to take effect</li>
          <li>• At least one admin must remain in the system</li>
          <li>• You'll also need to update the SQL policies in Supabase</li>
          <li>• Admin changes are stored in the browser (not persistent)</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminManager 