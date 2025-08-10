import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import { Printer, Eye, Search, User, History, Clock, Trash2, Award, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'
import PerformanceMonitor from './PerformanceMonitor'
import AdminManager from './AdminManager'
import IndexPointsManager from './IndexPointsManager'
import ItemPointsManager from './ItemPointsManager'
import { 
  getAllCVsWithItemPoints, 
  getAllCVsWithCategorizedScores, 
  filterCVByYear, 
  calculateFilteredPoints, 
  getCVItemsWithPoints,
  getItemDisplayText,
  getSectionDisplayName
} from '../utils/itemPointsManager'

const AdminView = () => {
  const [cvs, setCvs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState({ from: '', to: '' })
  const [filteredPoints, setFilteredPoints] = useState({})
  const [calculatingFilteredPoints, setCalculatingFilteredPoints] = useState(false)
  const [selectedCV, setSelectedCV] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [cvHistory, setCvHistory] = useState([])
  const [selectedCVForHistory, setSelectedCVForHistory] = useState(null)
  // Change Log state removed per request
  const [showChangesModal, setShowChangesModal] = useState(false)
  const [selectedCVForChanges, setSelectedCVForChanges] = useState(null)
  const [contentChangeEntries, setContentChangeEntries] = useState([])
  const [changesLoading, setChangesLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20) // Show 20 CVs per page
  const printRef = useRef()
  const historyPrintRef = useRef()

  const loadAllCVs = useCallback(async (page = 1, search = '') => {
    setLoading(true)
    try {
      // Load CVs with item points data
      const cvsWithPointsData = await getAllCVsWithItemPoints()
      setCvsWithItemPoints(cvsWithPointsData)
      
      // Load CVs with categorized scores data
      const cvsWithCategorizedData = await getAllCVsWithCategorizedScores()
      setCvsWithCategorizedScores(cvsWithCategorizedData)

      let query = supabase
        .from('cvs')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      // Add search filter if provided
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        toast.error('Error loading CVs')
        return
      }

      setCvs(data || [])
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / pageSize))
      setCurrentPage(page)
    } catch (error) {
      toast.error('Error loading CVs')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    // Reset to page 1 when search term changes
    loadAllCVs(1, debouncedSearchTerm)
  }, [debouncedSearchTerm, loadAllCVs])

  // Periodic refresh removed per request

  const handlePageChange = (page) => {
    loadAllCVs(page, searchTerm)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    // Don't reset page here - it will be reset when debounced search triggers
  }

  const [cvToPrint, setCvToPrint] = useState(null)
  const [cvsWithItemPoints, setCvsWithItemPoints] = useState([])
  const [cvsWithCategorizedScores, setCvsWithCategorizedScores] = useState([])

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${selectedCV?.full_name || 'CV'} - CV Manager`,
  })

  const handleHistoryPrint = useReactToPrint({
    content: () => historyPrintRef.current,
    documentTitle: `${cvToPrint?.full_name || 'CV'} - CV Manager`,
  })

  const printHistoryVersion = (version) => {
    setCvToPrint(version)
    // Use setTimeout to ensure state update before printing
    setTimeout(() => {
      handleHistoryPrint()
      setCvToPrint(null)
    }, 100)
  }

  const openPrintModal = (cv) => {
    setSelectedCV(cv)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedCV(null)
  }

  const openHistoryModal = async (cv) => {
    setSelectedCVForHistory(cv)
    setShowHistoryModal(true)
    
    try {
      const { data, error } = await supabase
        .from('cv_history')
        .select('*')
        .eq('cv_id', cv.id)
        .order('version_number', { ascending: false })

      if (error) {
        console.error('Error loading CV history:', error)
        toast.error('Error loading CV history: ' + error.message)
        return
      }

      setCvHistory(data || [])
    } catch (error) {
      console.error('Exception loading CV history:', error)
      toast.error('Error loading CV history: ' + error.message)
    }
  }

  const closeHistoryModal = () => {
    setShowHistoryModal(false)
    setSelectedCVForHistory(null)
    setCvHistory([])
  }

  // Build a content change log from successive cv_history snapshots
  const buildContentChangeLog = (cvHistoryEntries = []) => {
    const entries = []

    const stableStringify = (obj) => {
      if (obj === null || obj === undefined) return String(obj)
      if (typeof obj !== 'object') return JSON.stringify(obj)
      if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`
      const keys = Object.keys(obj).sort()
      return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
    }

    const arraySections = [
      'education',
      'academic_employment',
      'teaching',
      'publications_research',
      'publications_books',
      'conference_presentations',
      'professional_service',
      'internal_activities',
    ]

    const scalarFields = ['full_name', 'phone', 'email', 'address']

    // Ensure ascending by version_number or created_at
    const sorted = [...cvHistoryEntries].sort((a, b) => {
      const av = a.version_number ?? 0
      const bv = b.version_number ?? 0
      if (av !== bv) return av - bv
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1]
      const current = sorted[i]
      const when = current.created_at || current.updated_at

      // Scalar field changes
      scalarFields.forEach((field) => {
        if (current[field] !== previous[field]) {
          entries.push({
            created_at: when,
            description: `Updated ${field.replace('_', ' ')} from "${previous[field] || ''}" to "${current[field] || ''}"`
          })
        }
      })

      // Array section changes at per-index level
      arraySections.forEach((section) => {
        const currArr = Array.isArray(current[section]) ? current[section] : []
        const prevArr = Array.isArray(previous[section]) ? previous[section] : []
        const maxLen = Math.max(currArr.length, prevArr.length)

        for (let idx = 0; idx < maxLen; idx++) {
          const prevItem = prevArr[idx]
          const currItem = currArr[idx]

          if (prevItem !== undefined && currItem === undefined) {
            entries.push({
              created_at: when,
              description: `Removed ${getSectionDisplayName(section)}: ${getItemDisplayText(section, prevItem)}`
            })
          } else if (prevItem === undefined && currItem !== undefined) {
            entries.push({
              created_at: when,
              description: `Added ${getSectionDisplayName(section)}: ${getItemDisplayText(section, currItem)}`
            })
          } else if (prevItem !== undefined && currItem !== undefined) {
            const prevStr = stableStringify(prevItem)
            const currStr = stableStringify(currItem)
            if (prevStr !== currStr) {
              const fieldNames = Array.from(new Set([...Object.keys(prevItem || {}), ...Object.keys(currItem || {})]))
              const changes = []
              for (const field of fieldNames) {
                const beforeVal = prevItem?.[field]
                const afterVal = currItem?.[field]
                if (stableStringify(beforeVal) !== stableStringify(afterVal)) {
                  changes.push(`${field.replaceAll('_', ' ')}: "${beforeVal ?? ''}" → "${afterVal ?? ''}"`)
                }
              }
              const itemLabel = getItemDisplayText(section, currItem)
              entries.push({
                created_at: when,
                description: `Updated ${getSectionDisplayName(section)} (${itemLabel}) — ${changes.join('; ')}`
              })
            }
          }
        }
      })
    }

    // Most recent first
    entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return entries
  }

  const openChangesModal = async (cv) => {
    setSelectedCVForChanges(cv)
    setShowChangesModal(true)
    setChangesLoading(true)
    try {
      const { data, error } = await supabase
        .from('cv_history')
        .select('*')
        .eq('cv_id', cv.id)
        .order('version_number', { ascending: true })

      if (error) {
        console.error('Error loading CV history for changes:', error)
        toast.error('Error loading CV changes')
        setContentChangeEntries([])
      } else {
        const entries = buildContentChangeLog(data || [])
        setContentChangeEntries(entries)
      }
    } catch (e) {
      console.error('Exception building CV changes:', e)
      toast.error('Error building CV changes')
      setContentChangeEntries([])
    } finally {
      setChangesLoading(false)
    }
  }

  const closeChangesModal = () => {
    setShowChangesModal(false)
    setSelectedCVForChanges(null)
    setContentChangeEntries([])
  }

  const handleDeleteCV = async (cv) => {
    if (!window.confirm(`Are you sure you want to delete ${cv.full_name}'s CV? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete CV history first (due to foreign key constraint)
      const { error: historyError } = await supabase
        .from('cv_history')
        .delete()
        .eq('cv_id', cv.id)

      if (historyError) {
        toast.error('Error deleting CV history')
        return
      }

      // Delete the CV
      const { error: cvError } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cv.id)

      if (cvError) {
        toast.error('Error deleting CV')
        return
      }

      toast.success(`${cv.full_name}'s CV deleted successfully`)
      
      // Refresh the CV list
      loadAllCVs(currentPage, searchTerm)
      
    } catch (error) {
      toast.error('Error deleting CV: ' + error.message)
    }
  }

  // Change Log builder removed per request

  // Change Log handlers removed per request

  const handlePointsUpdate = async () => {
    // Refresh points data
    try {
      const pointsData = await getAllCVsWithItemPoints();
      setCvsWithItemPoints(pointsData);
      
      // Refresh categorized scores data
      const categorizedData = await getAllCVsWithCategorizedScores();
      setCvsWithCategorizedScores(categorizedData);
    } catch (error) {
      console.error('Error refreshing points data:', error);
    }
    // Also refresh CVs to ensure everything is up to date
    loadAllCVs(currentPage, debouncedSearchTerm);
  }

  // (Removed) refreshCVData helper was unused

  // Calculate filtered points for all CVs
  const calculateFilteredPointsForAllCVs = useCallback(async () => {
    if (!yearFilter.from && !yearFilter.to) {
      setFilteredPoints({});
      setCalculatingFilteredPoints(false);
      return;
    }

    setCalculatingFilteredPoints(true);
    try {
      const newFilteredPoints = {};
      
      for (const cv of cvs) {
        // Get item points for this CV
        const itemPoints = await getCVItemsWithPoints(cv.id);
        
        // Calculate filtered points
        const points = calculateFilteredPoints(cv, itemPoints, yearFilter);
        newFilteredPoints[cv.id] = points;
      }
      
      setFilteredPoints(newFilteredPoints);
    } catch (error) {
      console.error('Error calculating filtered points:', error);
    } finally {
      setCalculatingFilteredPoints(false);
    }
  }, [cvs, yearFilter]);

  // Recalculate filtered points when year filter changes
  // This useEffect is placed after the function definition to avoid initialization order issues
  useEffect(() => {
    calculateFilteredPointsForAllCVs();
  }, [yearFilter, calculateFilteredPointsForAllCVs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">View and manage all professor CVs</p>
          </div>

          <div className="p-6">
            {/* Performance Monitor */}
            <div className="mb-6">
              <PerformanceMonitor />
            </div>

            {/* Admin Management */}
            <div className="mb-6">
              <AdminManager />
            </div>

            {/* Index Points Management */}
            <div className="mb-6">
              <IndexPointsManager />
            </div>

            {/* Points System Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">Points Management Guide</h3>
              </div>
              
              <div className="space-y-4 text-sm text-blue-700">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">🎯 How to Add/Subtract Points:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Click the <strong>settings icon (⚙️)</strong> next to any CV's points display</li>
                    <li>Click <strong>"Manage Points"</strong> to open the points management modal</li>
                    <li>Select an item from the dropdown (education, publications, etc.)</li>
                    <li>Enter the number of points and optional reason</li>
                    <li>Choose <strong>"Add Points"</strong> or <strong>"Subtract Points"</strong></li>
                    <li>Click the action button to apply the changes</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-blue-800 mb-2">⚡ Batch Mode (Recommended for Multiple Changes):</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Enable <strong>"Batch Mode"</strong> in the dropdown</li>
                    <li>Open the points management modal</li>
                    <li>Select items and click <strong>"Add to Queue"</strong> for each change</li>
                    <li>Review all pending changes in the queue</li>
                    <li>Click <strong>"Apply All Changes"</strong> to process everything at once</li>
                    <li>Use <strong>"Remove"</strong> to delete individual changes from the queue</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-blue-800 mb-2">📊 Understanding the Points System:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Individual Items:</strong> Each CV item (publication, education entry, etc.) can have points</li>
                    <li><strong>Total Points:</strong> Sum of all item points displayed next to the CV name</li>
                    <li><strong>Intellectual Score:</strong> Research Publications + Books + Education + Conference Presentations (Education always included)</li>
                    <li><strong>Professional Score:</strong> Teaching + Professional Service + Internal Activities</li>
                    <li><strong>History:</strong> Click the history icon (📜) to view all point changes</li>
                    <li><strong>Real-time Updates:</strong> Points update immediately after applying changes</li>
                  </ul>
                </div>

                <div className="bg-blue-100 p-3 rounded border border-blue-300">
                  <h4 className="font-medium text-blue-800 mb-1">💡 Pro Tips:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Use <strong>Batch Mode</strong> when adding points to multiple items</li>
                    <li>Add <strong>reasons</strong> to track why points were awarded/deducted</li>
                    <li>Check the <strong>history</strong> to see all point changes over time</li>
                    <li>Points are <strong>cumulative</strong> - they add up across all CV items</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">📊 Scoring Categories Explained:</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h5 className="font-semibold text-blue-700 mb-1">🧠 Intellectual Score (Blue)</h5>
                      <p className="text-gray-600 mb-2">Measures academic and research achievements:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-gray-600">
                        <li><strong>Research Publications:</strong> Journal articles, papers with index (SSCI, SCOPUS, KCI, Other)</li>
                        <li><strong>Books:</strong> Published books, monographs, textbooks</li>
                        <li><strong>Education:</strong> Degrees, certifications, academic qualifications (always included regardless of year filter)</li>
                        <li><strong>Conference Presentations:</strong> Oral presentations, posters, conference papers</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-green-700 mb-1">👔 Professional Score (Green)</h5>
                      <p className="text-gray-600 mb-2">Measures teaching and service contributions:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-gray-600">
                        <li><strong>Teaching Experience:</strong> Courses taught, student supervision, curriculum development</li>
                        <li><strong>Professional Service:</strong> Committee work, administrative roles, community service</li>
                        <li><strong>Internal Activities at Gachon:</strong> Any work or relevant experiences pursued at Gachon University</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-yellow-700 mb-1">🏆 Total Points (Yellow)</h5>
                      <p className="text-gray-600 mb-2">Combined score of all achievements:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-gray-600">
                        <li><strong>Sum of All:</strong> Intellectual Score + Professional Score</li>
                        <li><strong>Overall Assessment:</strong> Complete academic profile evaluation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Year Filter */}
            <div className="mb-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {/* Year Filter */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h3 className="font-medium text-gray-800">Year Filter</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      type="number"
                      placeholder="2020"
                      value={yearFilter.from || ''}
                      onChange={(e) => setYearFilter(prev => ({ ...prev, from: e.target.value }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      type="number"
                      placeholder="2024"
                      value={yearFilter.to || ''}
                      onChange={(e) => setYearFilter(prev => ({ ...prev, to: e.target.value }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => setYearFilter({ from: '', to: '' })}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    Clear Filter
                  </button>
                  <div className="text-xs text-gray-500">
                    {yearFilter.from && yearFilter.to ? 
                      `Showing items from ${yearFilter.from} to ${yearFilter.to} (including overlapping date ranges). Education always included.` :
                      yearFilter.from ? 
                        `Showing items from ${yearFilter.from} onwards. Education always included.` :
                      yearFilter.to ? 
                        `Showing items up to ${yearFilter.to}. Education always included.` :
                        'Showing all years'
                    }
                    {calculatingFilteredPoints && (
                      <div className="mt-1 text-blue-600">
                        🔄 Recalculating points...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

                         {/* CV List */}
             <div className="space-y-4">
               {cvs.length === 0 ? (
                 <div className="text-center py-8">
                   <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <p className="text-gray-500">
                     {searchTerm ? 'No CVs found matching your search.' : 'No CVs found.'}
                   </p>
                 </div>
               ) : (
                 <>
                   <div className="text-sm text-gray-600 mb-4">
                     Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} CVs
                   </div>
                                      {cvs.map((cv) => {
                     // Apply year filter to CV data
                     const filteredCV = filterCVByYear(cv, yearFilter)
                     
                     // Find the corresponding CV with item points data
                     const cvWithPoints = cvsWithItemPoints.find(c => c.cv_id === cv.id)
                     const cvWithCategorizedScores = cvsWithCategorizedScores.find(c => c.cv_id === cv.id)
                     
                     // Get filtered points if year filter is active
                     const filteredPointsData = filteredPoints[cv.id]
                     
                     // Use filtered CV for display
                     const displayCV = filteredCV
                     
                     return (
                       <div key={cv.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <h3 className="text-lg font-semibold text-gray-900">{cv.full_name || 'Unnamed'}</h3>
                               {/* Total Points Display */}
                               {(filteredPointsData || cvWithPoints) && (
                                 <div className="flex items-center gap-2">
                                   <Award className="h-4 w-4 text-yellow-500" />
                                   <span className="font-semibold text-gray-700">
                                     {filteredPointsData ? filteredPointsData.total_points : (cvWithPoints?.total_points || 0)} pts
                                   </span>
                                 </div>
                               )}
                               
                               {/* Categorized Scores Display */}
                               {(filteredPointsData || cvWithCategorizedScores) && (
                                 <div className="flex items-center gap-4 text-sm">
                                   <div className="flex items-center gap-1">
                                     <span className="text-blue-600 font-medium">Intellectual:</span>
                                     <span className="font-semibold text-blue-700">
                                       {filteredPointsData ? filteredPointsData.intellectual_score : (cvWithCategorizedScores?.intellectual_score || 0)} pts
                                     </span>
                                   </div>
                                   <div className="flex items-center gap-1">
                                     <span className="text-green-600 font-medium">Professional:</span>
                                     <span className="font-semibold text-green-700">
                                       {filteredPointsData ? filteredPointsData.professional_score : (cvWithCategorizedScores?.professional_score || 0)} pts
                                     </span>
                                   </div>
                                 </div>
                               )}
                             </div>
                             <p className="text-gray-600">{cv.email}</p>
                             <p className="text-gray-500 text-sm">
                               Last updated: {new Date(cv.updated_at).toLocaleDateString()}
                             </p>
                             <div className="mt-2 flex flex-wrap gap-2">
                               {displayCV.education?.length > 0 && (
                                 <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                   {displayCV.education.length} Education
                                 </span>
                               )}
                               {displayCV.academic_employment?.length > 0 && (
                                 <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                   {displayCV.academic_employment.length} Positions
                                 </span>
                               )}
                               {displayCV.publications_research?.length > 0 && (
                                 <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                   {displayCV.publications_research.length} Publications
                                 </span>
                               )}
                             </div>
                           </div>
                           <div className="flex space-x-2 ml-4">
                             <button
                               onClick={() => openPrintModal(cv)}
                               className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                             >
                               <Eye className="h-4 w-4 mr-1" />
                               View
                             </button>
                             <button
                               onClick={() => openHistoryModal(cv)}
                               className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                             >
                               <History className="h-4 w-4 mr-1" />
                               History
                              </button>
                              <button
                                onClick={() => openChangesModal(cv)}
                                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                View CV Changes
                              </button>
                             <button
                               onClick={() => handleDeleteCV(cv)}
                               className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                               title="Delete CV"
                             >
                               <Trash2 className="h-4 w-4 mr-1" />
                               Delete
                             </button>
                           </div>
                         </div>
                         
                         {/* Item Points Manager */}
                         <div className="mt-3 pt-3 border-t border-gray-200">
                           <ItemPointsManager 
                             key={`${cv.id}-${cv.updated_at}`}
                             cv={displayCV}
                             onPointsUpdate={handlePointsUpdate}
                           />
                         </div>
                       </div>
                     )
                   })}
                                  </>
               )}

               {/* Pagination */}
               {totalPages > 1 && (
                 <div className="flex justify-center items-center space-x-2 mt-6">
                   <button
                     onClick={() => handlePageChange(currentPage - 1)}
                     disabled={currentPage === 1}
                     className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                   >
                     Previous
                   </button>
                   
                   <span className="px-3 py-2 text-sm text-gray-600">
                     Page {currentPage} of {totalPages}
                   </span>
                   
                   <button
                     onClick={() => handlePageChange(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                   >
                     Next
                   </button>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showModal && selectedCV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedCV.full_name}'s CV</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </button>
                <button
                  onClick={closeModal}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                     <div ref={printRef}>
                         <CVPrintView cv={selectedCV} yearFilter={yearFilter} />
                       </div>
            </div>
          </div>
                 </div>
       )}

       {/* CV History Modal */}
       {showHistoryModal && selectedCVForHistory && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <h2 className="text-xl font-semibold">{selectedCVForHistory.full_name}'s CV History</h2>
               <button
                 onClick={closeHistoryModal}
                 className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
               >
                 Close
               </button>
             </div>
             <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
               {cvHistory.length === 0 ? (
                 <div className="text-center py-8">
                   <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <p className="text-gray-500">No previous versions found.</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {cvHistory.map((version) => (
                     <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                       <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-semibold">Version {version.version_number}</h3>
                         <div className="flex items-center space-x-2">
                           <span className="text-sm text-gray-500">
                             {new Date(version.created_at).toLocaleDateString()} at{' '}
                             {new Date(version.created_at).toLocaleTimeString()}
                           </span>
                           <button
                             onClick={() => printHistoryVersion(version)}
                             className="flex items-center px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                           >
                             <Printer className="h-3 w-3 mr-1" />
                             Print
                           </button>
                         </div>
                       </div>
                       <div ref={historyPrintRef}>
                         <CVPrintView cv={cvToPrint || version} yearFilter={yearFilter} />
                       </div>
                     </div>
                   ))}
                 </div>
                )}
             </div>
           </div>
         </div>
       )}

      {/* CV Content Changes Modal */}
      {showChangesModal && selectedCVForChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedCVForChanges.full_name}'s CV Changes</h2>
              <button
                onClick={closeChangesModal}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {changesLoading ? (
                <div className="text-center py-6 text-gray-600">Loading changes...</div>
              ) : contentChangeEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No changes found.</div>
              ) : (
                <div className="space-y-4">
                  {contentChangeEntries.map((entry, idx) => (
                    <div key={idx} className="border border-gray-200 rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">{new Date(entry.created_at).toLocaleString()}</div>
                      <div className="text-sm text-gray-800">{entry.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Log removed per request */}
     </div>
   )
 }

// CV Print View Component
const CVPrintView = ({ cv, yearFilter = { from: '', to: '' } }) => {
  // Apply year filter to CV data for printing
  const filteredCV = filterCVByYear(cv, yearFilter)
  return (
    <div className="print-content space-y-6">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{filteredCV.full_name}</h1>
        <div className="mt-2 space-y-1 text-gray-600">
          {filteredCV.phone && <p>{filteredCV.phone}</p>}
          {filteredCV.email && <p>{filteredCV.email}</p>}
          {filteredCV.address && <p>{filteredCV.address}</p>}
        </div>
      </div>



      {/* Education */}
      {filteredCV.education && filteredCV.education.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Education</h2>
          {filteredCV.education.map((edu, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{edu.degree}</p>
                  <p className="text-gray-600">{edu.institution}</p>
                  {edu.field && <p className="text-gray-500 text-sm">Field: {edu.field}</p>}
                </div>
                <p className="text-gray-600">{edu.year}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CV Content Changes Modal removed from CVPrintView */}
      {/* Employment History */}
      {filteredCV.academic_employment && filteredCV.academic_employment.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Employment History</h2>
          {filteredCV.academic_employment.map((job, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{job.position}</p>
                  <p className="text-gray-600">{job.institution}</p>
                </div>
                <p className="text-gray-600">
                  {job.start_date} - {job.current ? 'Present' : job.end_date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teaching Experience */}
      {filteredCV.teaching && filteredCV.teaching.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Teaching Experience</h2>
          {filteredCV.teaching.map((course, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{course.course}</p>
                  <p className="text-gray-600">{course.institution}</p>
                  {course.description && <p className="text-gray-500 text-sm mt-1">{course.description}</p>}
                </div>
                <p className="text-gray-600">{course.year}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Research Publications */}
      {filteredCV.publications_research && filteredCV.publications_research.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Research Publications</h2>
          {filteredCV.publications_research.map((pub, index) => (
            <div key={index} className="mb-4">
              <p className="font-semibold">{pub.title}</p>
              <p className="text-gray-600">{pub.authors}</p>
              <p className="text-gray-500">{pub.journal}, {pub.year}</p>
              {pub.index && <p className="text-gray-400 text-sm">Index: {pub.index}</p>}
              {pub.doi && <p className="text-gray-400 text-sm">DOI: {pub.doi}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Books */}
      {filteredCV.publications_books && filteredCV.publications_books.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Books</h2>
          {filteredCV.publications_books.map((book, index) => (
            <div key={index} className="mb-4">
              <p className="font-semibold">{book.title}</p>
              <p className="text-gray-600">{book.authors}</p>
              <p className="text-gray-500">{book.publisher}, {book.year}</p>
              {book.isbn && <p className="text-gray-400 text-sm">ISBN: {book.isbn}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Conference Presentations */}
      {filteredCV.conference_presentations && filteredCV.conference_presentations.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Conference Presentations</h2>
          {filteredCV.conference_presentations.map((presentation, index) => (
            <div key={index} className="mb-4">
              <p className="font-semibold">{presentation.title}</p>
              <p className="text-gray-600">{presentation.conference}</p>
              <p className="text-gray-500">{presentation.location}, {presentation.year}</p>
              {presentation.type && <p className="text-gray-400 text-sm">Type: {presentation.type}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Professional Service */}
      {filteredCV.professional_service && filteredCV.professional_service.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Professional Service</h2>
          {filteredCV.professional_service.map((service, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{service.role}</p>
                  <p className="text-gray-600">{service.organization}</p>
                  {service.description && <p className="text-gray-500 text-sm mt-1">{service.description}</p>}
                </div>
                <p className="text-gray-600">{service.year}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Internal Activities at Gachon */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Internal Activities at Gachon</h2>
        {filteredCV.internal_activities && filteredCV.internal_activities.length > 0 && (
          filteredCV.internal_activities.map((activity, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{activity.position_type}</p>
                  {activity.details && <p className="text-gray-600 mt-1">{activity.details}</p>}
                  {activity.current && <p className="text-green-600 text-sm mt-1">Current Activity</p>}
                </div>
                <p className="text-gray-600">{activity.year}</p>
              </div>
            </div>
          ))
        )}
      
      </div>
    </div>
  )
}

export default AdminView 