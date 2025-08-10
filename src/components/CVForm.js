import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { Save, Plus, Trash2, GraduationCap, Briefcase, BookOpen, Users, Award, User, Building } from 'lucide-react'
import { setPublicationIndexPoints } from '../utils/itemPointsManager'
import toast from 'react-hot-toast'

const CVForm = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    education: [{ degree: '', institution: '', year: '', field: '' }],
    academic_employment: [{ position: '', institution: '', start_date: '', end_date: '', current: false }],
    teaching: [{ course: '', institution: '', year: '', description: '' }],
    publications_research: [{ title: '', journal: '', year: '', authors: '', doi: '', index: '' }],
    publications_books: [{ title: '', publisher: '', year: '', authors: '', isbn: '' }],
    conference_presentations: [{ title: '', conference: '', year: '', location: '', type: '' }],
    professional_service: [{ role: '', organization: '', year: '', description: '' }],
    internal_activities: [{ year: '', position_type: '', details: '', current: false }]
  })

  const loadCV = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        toast.error('Error loading CV')
        return
      }

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          education: data.education || [{ degree: '', institution: '', year: '', field: '' }],
          academic_employment: data.academic_employment || [{ position: '', institution: '', start_date: '', end_date: '', current: false }],
          teaching: data.teaching || [{ course: '', institution: '', year: '', description: '' }],
          publications_research: data.publications_research || [{ title: '', journal: '', year: '', authors: '', doi: '', index: '' }],
          publications_books: data.publications_books || [{ title: '', publisher: '', year: '', authors: '', isbn: '' }],
          conference_presentations: data.conference_presentations || [{ title: '', conference: '', year: '', location: '', type: '' }],
          professional_service: data.professional_service || [{ role: '', organization: '', year: '', description: '' }],
          internal_activities: data.internal_activities || [{ year: '', position_type: '', details: '', current: false }]
        })
      }
    } catch (error) {
      toast.error('Error loading CV')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadCV()
  }, [loadCV])

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // First, get the current CV to check if it exists (full record for snapshot)
      const { data: existingCVFull } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      let cvId = existingCVFull?.id

      // Only record the NEW snapshot after saving (no pre-update snapshot)

      // Update or insert the current CV
      const { data, error } = await supabase
        .from('cvs')
        .upsert({
          id: cvId, // Use existing ID if available
          user_id: user.id,
          email: user.email, // Use current user's email
          ...formData,
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        toast.error('Error saving CV')
      } else {
        // Save NEW snapshot after upsert
        if (data?.[0]?.id) {
          const { data: latestAfter, error: latestAfterErr } = await supabase
            .from('cv_history')
            .select('version_number')
            .eq('cv_id', data[0].id)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (latestAfterErr && latestAfterErr.code !== 'PGRST116') {
            console.error('Error fetching cv_history latest (after):', latestAfterErr)
          }
          const versionNew = (latestAfter?.version_number ?? 0) + 1

          const { error: newErr } = await supabase
            .from('cv_history')
            .insert({
              cv_id: data[0].id,
              user_id: user.id,
              email: user.email,
              ...formData,
              version_number: versionNew
            })

          if (newErr) {
            console.error('Error inserting new history snapshot:', newErr)
            toast.error('Failed to write history snapshot')
          } else {
            toast.success(`History saved (v${versionNew})`)
          }
        }
        toast.success('CV saved successfully!')
      }
    } catch (error) {
      toast.error('Error saving CV')
    } finally {
      setSaving(false)
    }
  }

  const updateArrayField = (field, index, key, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [key]: value } : item
      )
    }))
  }

  const addArrayItem = (field) => {
    const defaultItems = {
      education: { degree: '', institution: '', year: '', field: '' },
      academic_employment: { position: '', institution: '', start_date: '', end_date: '', current: false },
      teaching: { course: '', institution: '', year: '', description: '' },
      publications_research: { title: '', journal: '', year: '', authors: '', doi: '', index: '' },
      publications_books: { title: '', publisher: '', year: '', authors: '', isbn: '' },
      conference_presentations: { title: '', conference: '', year: '', location: '', type: '' },
      professional_service: { role: '', organization: '', year: '', description: '' },
      internal_activities: { year: '', position_type: '', details: '', current: false }
    }

    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultItems[field]]
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">CV Manager</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save CV'}
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Education */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education
                </h2>
                <button
                  onClick={() => addArrayItem('education')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Education
                </button>
              </div>
              {formData.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Education #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('education', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => updateArrayField('education', index, 'degree', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateArrayField('education', index, 'institution', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={edu.year}
                      onChange={(e) => updateArrayField('education', index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Field of Study"
                      value={edu.field}
                      onChange={(e) => updateArrayField('education', index, 'field', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Employment History */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Employment History
                </h2>
                <button
                  onClick={() => addArrayItem('academic_employment')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Position
                </button>
              </div>
              {formData.academic_employment.map((job, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Position #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('academic_employment', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Position"
                      value={job.position}
                      onChange={(e) => updateArrayField('academic_employment', index, 'position', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Institution"
                      value={job.institution}
                      onChange={(e) => updateArrayField('academic_employment', index, 'institution', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={job.start_date}
                      onChange={(e) => updateArrayField('academic_employment', index, 'start_date', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="End Date"
                      value={job.end_date}
                      onChange={(e) => updateArrayField('academic_employment', index, 'end_date', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={job.current}
                      onChange={(e) => updateArrayField('academic_employment', index, 'current', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-600">Current Position</label>
                  </div>
                </div>
              ))}
            </div>

            {/* Teaching Experience */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Teaching Experience
                </h2>
                <button
                  onClick={() => addArrayItem('teaching')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Course
                </button>
              </div>
              {formData.teaching.map((course, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Course #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('teaching', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Course Name"
                      value={course.course}
                      onChange={(e) => updateArrayField('teaching', index, 'course', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Institution"
                      value={course.institution}
                      onChange={(e) => updateArrayField('teaching', index, 'institution', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={course.year}
                      onChange={(e) => updateArrayField('teaching', index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <textarea
                    placeholder="Course Description"
                    value={course.description}
                    onChange={(e) => updateArrayField('teaching', index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="3"
                  />
                </div>
              ))}
            </div>

            {/* Research Publications */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Research Publications
                </h2>
                <button
                  onClick={() => addArrayItem('publications_research')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Publication
                </button>
              </div>
              {formData.publications_research.map((pub, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Publication #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('publications_research', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Title"
                      value={pub.title}
                      onChange={(e) => updateArrayField('publications_research', index, 'title', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Journal"
                      value={pub.journal}
                      onChange={(e) => updateArrayField('publications_research', index, 'journal', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={pub.year}
                      onChange={(e) => updateArrayField('publications_research', index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Authors"
                      value={pub.authors}
                      onChange={(e) => updateArrayField('publications_research', index, 'authors', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="DOI"
                      value={pub.doi}
                      onChange={(e) => updateArrayField('publications_research', index, 'doi', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                      <select
                       value={pub.index}
                       onChange={async (e) => {
                         const newIndex = e.target.value
                         updateArrayField('publications_research', index, 'index', newIndex)
                         try {
                           // If CV exists, apply index points immediately
                           // Fetch or infer cvId by saving if needed; here we try immediate update if user has a CV row
                           const { data: existingCV } = await supabase
                             .from('cvs')
                             .select('id')
                             .eq('user_id', user.id)
                             .maybeSingle()
                           if (existingCV?.id) {
                             await setPublicationIndexPoints({
                               userId: user.id,
                               cvId: existingCV.id,
                               itemIndex: index,
                               indexName: newIndex || 'Other'
                             })
                           }
                         } catch (err) {
                           // Non-blocking
                         }
                       }}
                       className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                     >
                      <option value="">Select Index</option>
                      <option value="SSCI">SSCI</option>
                      <option value="SCOPUS">SCOPUS</option>
                      <option value="KCI">KCI</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Books */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Books
                </h2>
                <button
                  onClick={() => addArrayItem('publications_books')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Book
                </button>
              </div>
              {formData.publications_books.map((book, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Book #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('publications_books', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Title"
                      value={book.title}
                      onChange={(e) => updateArrayField('publications_books', index, 'title', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Publisher"
                      value={book.publisher}
                      onChange={(e) => updateArrayField('publications_books', index, 'publisher', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={book.year}
                      onChange={(e) => updateArrayField('publications_books', index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Authors"
                      value={book.authors}
                      onChange={(e) => updateArrayField('publications_books', index, 'authors', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="ISBN"
                      value={book.isbn}
                      onChange={(e) => updateArrayField('publications_books', index, 'isbn', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Conference Presentations */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Conference Presentations
                </h2>
                <button
                  onClick={() => addArrayItem('conference_presentations')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Presentation
                </button>
              </div>
              {formData.conference_presentations.map((presentation, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Presentation #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('conference_presentations', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Title"
                      value={presentation.title}
                      onChange={(e) => updateArrayField('conference_presentations', index, 'title', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Conference"
                      value={presentation.conference}
                      onChange={(e) => updateArrayField('conference_presentations', index, 'conference', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={presentation.year}
                      onChange={(e) => updateArrayField('conference_presentations', index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={presentation.location}
                      onChange={(e) => updateArrayField('conference_presentations', index, 'location', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Type (Oral/Poster)"
                      value={presentation.type}
                      onChange={(e) => updateArrayField('conference_presentations', index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Professional Service */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Professional Service
                </h2>
                <button
                  onClick={() => addArrayItem('professional_service')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </button>
              </div>
              {formData.professional_service.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Service #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('professional_service', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Role"
                      value={service.role}
                      onChange={(e) => updateArrayField('professional_service', index, 'role', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Organization"
                      value={service.organization}
                      onChange={(e) => updateArrayField('professional_service', index, 'organization', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={service.year}
                      onChange={(e) => updateArrayField('professional_service', index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={service.description}
                    onChange={(e) => updateArrayField('professional_service', index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="3"
                  />
                </div>
              ))}
            </div>

            {/* Internal Activities */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Internal Activities at Gachon
                </h2>
                <button
                  onClick={() => addArrayItem('internal_activities')}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Activity
                </button>
              </div>
              {formData.internal_activities.map((activity, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Activity #{index + 1}</h3>
                    <button
                      onClick={() => removeArrayItem('internal_activities', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Year"
                      value={activity.year}
                      onChange={(e) => updateArrayField('internal_activities', index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                                                              <select
                       value={activity.position_type}
                       onChange={(e) => updateArrayField('internal_activities', index, 'position_type', e.target.value)}
                       className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                     >
                       <option value="">Select Service Type</option>
                       <option value="Admin Position">Admin Position</option>
                       <option value="Dept Committee">Dept Committee</option>
                       <option value="HQ Committee">HQ Committee</option>
                       <option value="Student Advising">Student Advising</option>
                       <option value="Others">Others</option>
                     </select>
                     <textarea
                       placeholder="Details"
                       value={activity.details}
                       onChange={(e) => updateArrayField('internal_activities', index, 'details', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                       rows="4"
                     />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activity.current}
                        onChange={(e) => updateArrayField('internal_activities', index, 'current', e.target.checked)}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Current Activity</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CVForm 