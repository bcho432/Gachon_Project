import React, { useState, useEffect } from 'react'
import { 
  runArchiveProcess, 
  getArchiveStats, 
  getCVsForArchiving 
} from '../utils/archiveManager'
import { Archive, Database, Clock, RefreshCw, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const ArchiveManager = () => {
  const [stats, setStats] = useState(null)
  const [cvsForArchiving, setCvsForArchiving] = useState([])
  const [isArchiving, setIsArchiving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadArchiveData()
  }, [])

  const loadArchiveData = async () => {
    setIsLoading(true)
    try {
      const [statsData, cvsData] = await Promise.all([
        getArchiveStats(),
        getCVsForArchiving()
      ])
      
      setStats(statsData)
      setCvsForArchiving(cvsData)
    } catch (error) {
      console.error('Error loading archive data:', error)
      toast.error('Error loading archive data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunArchive = async () => {
    if (!window.confirm('Are you sure you want to run the archive process? This will move old CV versions to the archive table.')) {
      return
    }

    setIsArchiving(true)
    try {
      const result = await runArchiveProcess()
      
      if (result.success) {
        toast.success(`Archive process completed! Archived ${result.totalArchived} versions`)
        // Reload data to show updated stats
        await loadArchiveData()
      } else {
        toast.error('Archive process failed')
      }
    } catch (error) {
      console.error('Archive process error:', error)
      toast.error('Error running archive process')
    } finally {
      setIsArchiving(false)
    }
  }

  if (isLoading) {
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
        <Archive className="h-5 w-5 mr-2" />
        CV History Archive Manager
      </h3>

      <div className="space-y-6">
        {/* Archive Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Active History</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.mainCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">Archived History</p>
                <p className="text-2xl font-bold text-green-900">{stats?.archiveCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Versions</p>
                <p className="text-2xl font-bold text-purple-900">{stats?.totalCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CVs Ready for Archiving */}
        {cvsForArchiving.length > 0 && (
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  CVs Ready for Archiving
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  {cvsForArchiving.length} CVs have more than 50 versions and can be archived to improve performance.
                </p>
                <div className="space-y-2">
                  {cvsForArchiving.slice(0, 5).map((cv, index) => (
                    <div key={index} className="text-xs text-yellow-600">
                      CV {index + 1}: {cv.version_count} versions
                    </div>
                  ))}
                  {cvsForArchiving.length > 5 && (
                    <div className="text-xs text-yellow-500">
                      ... and {cvsForArchiving.length - 5} more CVs
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Actions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Archive Actions
          </h4>
          
          <div className="space-y-3">
            <button
              onClick={handleRunArchive}
              disabled={isArchiving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isArchiving ? 'Running Archive Process...' : 'Run Archive Process'}
            </button>
            
            <button
              onClick={loadArchiveData}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Archive Data
            </button>
          </div>
        </div>

        {/* Archive Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Archive Configuration:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Keeps the most recent 50 versions per CV in active history</li>
            <li>• Archives versions older than 1 year automatically</li>
            <li>• Archived versions are still accessible but moved to separate table</li>
            <li>• Archive process runs in batches to avoid timeouts</li>
            <li>• Archived versions can be restored if needed</li>
          </ul>
        </div>

        {/* Performance Benefits */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">Performance Benefits:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Faster CV history queries (smaller active table)</li>
            <li>• Reduced database storage costs</li>
            <li>• Better search performance</li>
            <li>• Improved overall application responsiveness</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ArchiveManager 