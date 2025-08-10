import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { Eye, Printer, Award, TrendingUp, BookOpen, Users, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { calculateUserTotalPoints, filterCVByYear, calculateFilteredPoints, getCVItemsWithPoints } from '../utils/itemPointsManager'

// CV Print View Component (same as in AdminView)
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

const UserDashboard = () => {
  const { user } = useAuth()
  const [cv, setCv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [intellectualScore, setIntellectualScore] = useState(0)
  const [professionalScore, setProfessionalScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [yearFilter, setYearFilter] = useState({ from: '', to: '' })
  const [filteredCV, setFilteredCV] = useState(null)
  const [filteredIntellectualScore, setFilteredIntellectualScore] = useState(0)
  const [filteredProfessionalScore, setFilteredProfessionalScore] = useState(0)
  const [filteredTotalScore, setFilteredTotalScore] = useState(0)

  // Load user's CV
  useEffect(() => {
    if (user) {
      loadUserCV()
    }
  }, [user])

  const loadUserCV = async () => {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading CV:', error)
        toast.error('Error loading your CV')
        return
      }

      setCv(data)
      
      if (data) {
        // Fetch actual points from database
        console.log('Loading points for user:', user.id)
        const points = await calculateUserTotalPoints(user.id)
        console.log('Calculated points:', points)
        
        setIntellectualScore(points.intellectual)
        setProfessionalScore(points.professional)
        setTotalScore(points.total)
        
        // Set initial filtered data
        setFilteredCV(data)
        setFilteredIntellectualScore(points.intellectual)
        setFilteredProfessionalScore(points.professional)
        setFilteredTotalScore(points.total)
      }
    } catch (error) {
      console.error('Error loading CV:', error)
      toast.error('Error loading your CV')
    } finally {
      setLoading(false)
    }
  }

  // Calculate filtered points when year filter changes
  const calculateFilteredPointsForUser = async () => {
    if (!cv) return

    try {
      // Get item points for this CV (same as admin view)
      const itemPoints = await getCVItemsWithPoints(cv.id)
      
      // Filter CV by year
      const filtered = filterCVByYear(cv, yearFilter)
      setFilteredCV(filtered)

      // Calculate filtered points using the same function as admin view
      const filteredPoints = calculateFilteredPoints(cv, itemPoints, yearFilter)
      
      setFilteredIntellectualScore(filteredPoints.intellectual_score)
      setFilteredProfessionalScore(filteredPoints.professional_score)
      setFilteredTotalScore(filteredPoints.total_points)
    } catch (error) {
      console.error('Error calculating filtered points:', error)
      // Fallback to original points on error
      const points = await calculateUserTotalPoints(user.id)
      setFilteredIntellectualScore(points.intellectual)
      setFilteredProfessionalScore(points.professional)
      setFilteredTotalScore(points.total)
    }
  }

  // Update filtered points when year filter changes
  useEffect(() => {
    if (cv) {
      calculateFilteredPointsForUser()
    }
  }, [yearFilter, cv])

  const openPrintModal = () => {
    setShowPrintModal(true)
  }

  const closePrintModal = () => {
    setShowPrintModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user?.email}</h1>
            <p className="text-gray-600 mb-6">You haven't created your CV yet. Click the button below to get started.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Create Your CV
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Print Warning Message - At the very top */}
        {!showPrintModal && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Print Notice:</strong> Currently, the print CV for this dashboard creates duplicates. Please be aware of this if or when you try to print out your own CV on this page. You can still adjust for this once you hit print by typing in which pages you would like to print out.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{cv.full_name}</h1>
              <p className="text-gray-600">{cv.email}</p>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(cv.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={openPrintModal}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                View CV
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Edit CV
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content - Hidden when print modal is open */}
        {!showPrintModal && (
          <>
        {/* Year Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Year Filter
            </h2>
            <button
              onClick={() => setYearFilter({ from: '', to: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filter
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Year
              </label>
              <input
                type="number"
                placeholder="e.g., 2020"
                value={yearFilter.from}
                onChange={(e) => setYearFilter(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Year
              </label>
              <input
                type="number"
                placeholder="e.g., 2024"
                value={yearFilter.to}
                onChange={(e) => setYearFilter(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Filter CV items by year range. Education items are always included regardless of filter.
          </p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Score
                  {yearFilter.from || yearFilter.to ? (
                    <span className="ml-2 text-xs text-blue-600">(Filtered)</span>
                  ) : null}
                </p>
                <p className="text-3xl font-bold text-primary-600">{filteredTotalScore}</p>
                {(yearFilter.from || yearFilter.to) && filteredTotalScore !== totalScore && (
                  <p className="text-xs text-gray-500">Total: {totalScore}</p>
                )}
              </div>
              <Award className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          {/* Intellectual Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Intellectual Score
                  {yearFilter.from || yearFilter.to ? (
                    <span className="ml-2 text-xs text-blue-600">(Filtered)</span>
                  ) : null}
                </p>
                <p className="text-3xl font-bold text-blue-600">{filteredIntellectualScore}</p>
                <p className="text-xs text-gray-500">Research, Books, Education, Conferences</p>
                {(yearFilter.from || yearFilter.to) && filteredIntellectualScore !== intellectualScore && (
                  <p className="text-xs text-gray-500">Total: {intellectualScore}</p>
                )}
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Professional Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Professional Score
                  {yearFilter.from || yearFilter.to ? (
                    <span className="ml-2 text-xs text-blue-600">(Filtered)</span>
                  ) : null}
                </p>
                <p className="text-3xl font-bold text-green-600">{filteredProfessionalScore}</p>
                    <p className="text-xs text-gray-500">Teaching, Service, Internal Activities</p>
                {(yearFilter.from || yearFilter.to) && filteredProfessionalScore !== professionalScore && (
                  <p className="text-xs text-gray-500">Total: {professionalScore}</p>
                )}
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* CV Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            CV Summary
            {yearFilter.from || yearFilter.to ? (
              <span className="ml-2 text-sm text-blue-600">(Filtered)</span>
            ) : null}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredCV?.education?.length > 0 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-900">{filteredCV.education.length}</p>
                <p className="text-sm text-blue-700">Education</p>
              </div>
            )}
            {filteredCV?.academic_employment?.length > 0 && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-900">{filteredCV.academic_employment.length}</p>
                <p className="text-sm text-green-700">Positions</p>
              </div>
            )}
            {filteredCV?.publications_research?.length > 0 && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold text-purple-900">{filteredCV.publications_research.length}</p>
                <p className="text-sm text-purple-700">Publications</p>
              </div>
            )}
            {filteredCV?.teaching?.length > 0 && (
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="font-semibold text-orange-900">{filteredCV.teaching.length}</p>
                <p className="text-sm text-orange-700">Teaching</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}

      {/* Print Modal */}
      {showPrintModal && filteredCV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {filteredCV.full_name}'s CV
                {yearFilter.from || yearFilter.to ? (
                  <span className="ml-2 text-sm text-blue-600">(Filtered)</span>
                ) : null}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={closePrintModal}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <CVPrintView cv={filteredCV} yearFilter={yearFilter} />
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  )
}

export default UserDashboard 