import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

const PasswordResetForm = () => {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('request') // 'request' or 'reset'
  
  const { resetPassword, updatePassword } = useAuth()
  const location = useLocation()

  // Check if user came from a password reset link
  useEffect(() => {
    if (location.state?.fromResetLink) {
      setStep('reset')
      if (location.state?.email) {
        setEmail(location.state.email)
      }
      toast.success('Password reset link verified! Please set your new password.')
    }
  }, [location.state])

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password reset email sent! Please check your email and click the link to reset your password.')
        setStep('reset')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await updatePassword(newPassword)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated successfully! You can now sign in with your new password.')
        // Reset form and redirect to login
        setNewPassword('')
        setConfirmPassword('')
        setStep('request')
        setEmail('')
        // Redirect to login page
        window.location.href = '/auth'
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setStep('request')
    setEmail('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'request' ? 'Reset your password' : 'Set new password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            CV Manager for Professors
          </p>
        </div>

        {/* Password reset instructions */}
        {step === 'request' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* New password instructions */}
        {step === 'reset' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Great! Now set your new password. Make sure it's secure and easy to remember.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact information */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                If you have any questions, please email gachonhelper018@gmail.com or sungguri@gachon.ac.kr.
              </p>
            </div>
          </div>
        </div>
        
        {step === 'request' ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Send reset email'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/auth'}
                className="text-primary-600 hover:text-primary-500 text-sm"
              >
                Back to sign in
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Update password'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={goBack}
                className="text-primary-600 hover:text-primary-500 text-sm flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to email request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PasswordResetForm 