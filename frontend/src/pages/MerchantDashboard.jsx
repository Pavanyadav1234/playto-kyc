import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function MerchantDashboard() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get('https://playto-kyc-backend-hw1z.onrender.com/api/v1/submissions/', {
        headers: { Authorization: 'Token ' + token }
      })
      setSubmissions(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const createNew = async () => {
    try {
      const res = await axios.post('https://playto-kyc-backend-hw1z.onrender.com/api/v1/submissions/', {
        full_name: 'New Submission',
        email: 'placeholder@email.com',
        phone: '0000000000'
      }, { headers: { Authorization: 'Token ' + token } })
      navigate('/merchant/kyc/' + res.data.id)
    } catch (err) {
      console.error(err)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const getStateBadge = (state) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      more_info_requested: 'bg-orange-100 text-orange-700',
    }
    return colors[state] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Playto KYC</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hi, {username}</span>
          <button onClick={logout} className="text-red-500 hover:underline text-sm">Logout</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My KYC Submissions</h2>
          <button
            onClick={createNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Submission
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <p className="text-gray-500 mb-4">No submissions yet</p>
            <button
              onClick={createNew}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start KYC
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{sub.full_name || 'Unnamed'}</h3>
                    <p className="text-gray-500 text-sm">{sub.business_name || 'No business name'}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Created: {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                    {sub.reviewer_note && (
                      <p className="text-orange-600 text-sm mt-2">
                        Reviewer note: {sub.reviewer_note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStateBadge(sub.state)}`}>
                      {sub.state.replace('_', ' ')}
                    </span>
                    {['draft', 'more_info_requested'].includes(sub.state) && (
                      <button
                        onClick={() => navigate('/merchant/kyc/' + sub.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}