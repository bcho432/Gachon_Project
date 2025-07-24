import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'
import { Printer, Eye, Search, User, History, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useReactToPrint } from 'react-to-print'
import PerformanceMonitor from './PerformanceMonitor'
import AdminManager from './AdminManager'

const AdminView = () => {
  const [cvs, setCvs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCV, setSelectedCV] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [cvHistory, setCvHistory] = useState([])
  const [selectedCVForHistory, setSelectedCVForHistory] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20) // Show 20 CVs per page
  const printRef = useRef()
  const historyPrintRef = useRef()

  const loadAllCVs = useCallback(async (page = 1, search = '') => {
    setLoading(true)
    try {
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

  useEffect(() => {
    loadAllCVs(1, searchTerm)
  }, [searchTerm, loadAllCVs])

  const handlePageChange = (page) => {
    loadAllCVs(page, searchTerm)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  const [cvToPrint, setCvToPrint] = useState(null)

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
        toast.error('Error loading CV history')
        return
      }

      setCvHistory(data || [])
    } catch (error) {
      toast.error('Error loading CV history')
    }
  }

  const closeHistoryModal = () => {
    setShowHistoryModal(false)
    setSelectedCVForHistory(null)
    setCvHistory([])
  }

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

            {/* Search */}
            <div className="mb-6">
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
                                      {cvs.map((cv) => (
                     <div key={cv.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start">
                         <div className="flex-1">
                           <h3 className="text-lg font-semibold text-gray-900">{cv.full_name || 'Unnamed'}</h3>
                           <p className="text-gray-600">{cv.email}</p>
                           <p className="text-gray-500 text-sm">
                             Last updated: {new Date(cv.updated_at).toLocaleDateString()}
                           </p>
                           <div className="mt-2 flex flex-wrap gap-2">
                             {cv.education?.length > 0 && (
                               <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                 {cv.education.length} Education
                               </span>
                             )}
                             {cv.academic_employment?.length > 0 && (
                               <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                 {cv.academic_employment.length} Positions
                               </span>
                             )}
                             {cv.publications_research?.length > 0 && (
                               <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                 {cv.publications_research.length} Publications
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
                         </div>
                       </div>
                     </div>
                   ))}
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
                <CVPrintView cv={selectedCV} />
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
                         <CVPrintView cv={cvToPrint || version} />
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }

// CV Print View Component
const CVPrintView = ({ cv }) => {
  return (
    <div className="print-content space-y-6 px-4 py-2">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{cv.full_name}</h1>
        <div className="mt-2 space-y-1 text-gray-600">
          {cv.phone && <p>{cv.phone}</p>}
          {cv.email && <p>{cv.email}</p>}
          {cv.address && <p>{cv.address}</p>}
        </div>
      </div>

      {/* Education */}
      {cv.education && cv.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Education</h2>
          {cv.education.map((edu, index) => (
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

      {/* Academic Employment */}
      {cv.academic_employment && cv.academic_employment.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Academic Employment</h2>
          {cv.academic_employment.map((job, index) => (
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
      {cv.teaching && cv.teaching.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Teaching Experience</h2>
          {cv.teaching.map((course, index) => (
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
      {cv.publications_research && cv.publications_research.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Research Publications</h2>
          {cv.publications_research.map((pub, index) => (
            <div key={index} className="mb-4">
              <p className="font-semibold">{pub.title}</p>
              <p className="text-gray-600">{pub.authors}</p>
              <p className="text-gray-500">{pub.journal}, {pub.year}</p>
              {pub.doi && <p className="text-gray-400 text-sm">DOI: {pub.doi}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Books */}
      {cv.publications_books && cv.publications_books.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Books</h2>
          {cv.publications_books.map((book, index) => (
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
      {cv.conference_presentations && cv.conference_presentations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Conference Presentations</h2>
          {cv.conference_presentations.map((presentation, index) => (
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
      {cv.professional_service && cv.professional_service.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Professional Service</h2>
          {cv.professional_service.map((service, index) => (
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
    </div>
  )
}

export default AdminView 