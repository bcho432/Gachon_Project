import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Database, Users, FileText, Clock } from 'lucide-react'

const PerformanceMonitor = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Get CV count
      const { count: cvCount } = await supabase
        .from('cvs')
        .select('*', { count: 'exact', head: true })

      // Get history count
      const { count: historyCount } = await supabase
        .from('cv_history')
        .select('*', { count: 'exact', head: true })

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: recentActivity } = await supabase
        .from('cv_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

      setStats({
        cvCount: cvCount || 0,
        historyCount: historyCount || 0,
        recentActivity: recentActivity || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Database className="h-5 w-5 mr-2" />
        System Performance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Active CVs</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.cvCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Versions</p>
              <p className="text-2xl font-bold text-green-900">{stats?.historyCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Recent Activity</p>
              <p className="text-2xl font-bold text-purple-900">{stats?.recentActivity.toLocaleString()}</p>
              <p className="text-xs text-purple-500">Last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Pagination loads 20 CVs per page for optimal performance</li>
          <li>• Search uses database indexes for fast results</li>
          <li>• CV history stores unlimited versions for complete audit trail</li>
          <li>• Partial indexes optimize queries for recent data</li>
        </ul>
      </div>
    </div>
  )
}

export default PerformanceMonitor 