import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { Eye, Printer, Award, TrendingUp, BookOpen, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { calculateUserTotalPoints } from '../utils/itemPointsManager'

const UserDashboard = () => {
  const { user } = useAuth()
  const [cv, setCv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [intellectualScore, setIntellectualScore] = useState(0)
  const [professionalScore, setProfessionalScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)

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
        const points = await calculateUserTotalPoints(user.id)
        
        setIntellectualScore(points.intellectual)
        setProfessionalScore(points.professional)
        setTotalScore(points.total)
      }
    } catch (error) {
      console.error('Error loading CV:', error)
      toast.error('Error loading your CV')
    } finally {
      setLoading(false)
    }
  }

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

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Score</p>
                <p className="text-3xl font-bold text-primary-600">{totalScore}</p>
              </div>
              <Award className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          {/* Intellectual Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Intellectual Score</p>
                <p className="text-3xl font-bold text-blue-600">{intellectualScore}</p>
                <p className="text-xs text-gray-500">Research, Books, Education, Conferences</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Professional Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Professional Score</p>
                <p className="text-3xl font-bold text-green-600">{professionalScore}</p>
                <p className="text-xs text-gray-500">Teaching, Service</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* CV Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CV Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cv.education?.length > 0 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-900">{cv.education.length}</p>
                <p className="text-sm text-blue-700">Education</p>
              </div>
            )}
            {cv.academic_employment?.length > 0 && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-900">{cv.academic_employment.length}</p>
                <p className="text-sm text-green-700">Positions</p>
              </div>
            )}
            {cv.publications_research?.length > 0 && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="font-semibold text-purple-900">{cv.publications_research.length}</p>
                <p className="text-sm text-purple-700">Publications</p>
              </div>
            )}
            {cv.teaching?.length > 0 && (
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="font-semibold text-orange-900">{cv.teaching.length}</p>
                <p className="text-sm text-orange-700">Teaching</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && cv && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{cv.full_name}'s CV</h2>
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
              <div className="print-content space-y-6">
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
                  <div>
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
                  <div>
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
                  <div>
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
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Research Publications</h2>
                    {cv.publications_research.map((pub, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{pub.title}</p>
                            <p className="text-gray-600">{pub.journal}</p>
                            {pub.authors && <p className="text-gray-500 text-sm">Authors: {pub.authors}</p>}
                            {pub.index && <p className="text-gray-500 text-sm">Index: {pub.index}</p>}
                          </div>
                          <p className="text-gray-600">{pub.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Books */}
                {cv.publications_books && cv.publications_books.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Books</h2>
                    {cv.publications_books.map((book, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{book.title}</p>
                            <p className="text-gray-600">{book.publisher}</p>
                            {book.authors && <p className="text-gray-500 text-sm">Authors: {book.authors}</p>}
                          </div>
                          <p className="text-gray-600">{book.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conference Presentations */}
                {cv.conference_presentations && cv.conference_presentations.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Conference Presentations</h2>
                    {cv.conference_presentations.map((conf, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{conf.title}</p>
                            <p className="text-gray-600">{conf.conference}</p>
                            {conf.location && <p className="text-gray-500 text-sm">Location: {conf.location}</p>}
                          </div>
                          <p className="text-gray-600">{conf.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Professional Service */}
                {cv.professional_service && cv.professional_service.length > 0 && (
                  <div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboard 