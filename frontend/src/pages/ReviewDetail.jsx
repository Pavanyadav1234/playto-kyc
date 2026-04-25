import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [sub, setSub] = useState(null)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmission()
  }, [])

  const fetchSubmission = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/reviewer/queue/' + id + '/', {
        headers: { Authorization: 'Token ' + token }
      })
      setSub(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const doAction = async (action) => {
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/api/v1/reviewer/queue/' + id + '/action/',
        { action, note },
        { headers: { Authorization: 'Token ' + token } }
      )
      setMessage(res.data.message)
      fetchSubmission()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Action failed')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!sub) return <div className="min-h-screen flex items-center justify-center">Not found</div>

  const docUrl = (path) => 'http://127.0.0.1:8000' + path

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Playto KYC — Reviewer</h1>
        <button onClick={() => navigate('/reviewer')} className="text-gray-500 hover:underline text-sm">
          Back to Queue
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{sub.full_name || 'Unnamed'}</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            {sub.state.replace('_', ' ')}
          </span>
        </div>

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{message}</div>
        )}

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Personal Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-gray-500 text-sm">Full Name</p><p className="font-medium">{sub.full_name}</p></div>
            <div><p className="text-gray-500 text-sm">Email</p><p className="font-medium">{sub.email}</p></div>
            <div><p className="text-gray-500 text-sm">Phone</p><p className="font-medium">{sub.phone}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Business Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-gray-500 text-sm">Business Name</p><p className="font-medium">{sub.business_name}</p></div>
            <div><p className="text-gray-500 text-sm">Business Type</p><p className="font-medium">{sub.business_type}</p></div>
            <div><p className="text-gray-500 text-sm">Monthly Volume</p><p className="font-medium">${sub.monthly_volume}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Documents</h3>
          <div className="space-y-2">
            {['pan_document', 'aadhaar_document', 'bank_statement'].map(doc => (
              <div key={doc} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {doc === 'pan_document' ? 'PAN Card' : doc === 'aadhaar_document' ? 'Aadhaar' : 'Bank Statement'}
                </span>
                {sub[doc] ? (
                  <a href={docUrl(sub[doc])} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                    View Document
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">Not uploaded</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {['submitted', 'under_review'].includes(sub.state) && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">Take Action</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Note (optional)</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note for the merchant..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sub.state === 'submitted' && (
                <button onClick={() => doAction('under_review')} className="bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600">
                  Start Review
                </button>
              )}
              {sub.state === 'under_review' && (
                <>
                  <button onClick={() => doAction('approved')} className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    Approve
                  </button>
                  <button onClick={() => doAction('rejected')} className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                    Reject
                  </button>
                  <button onClick={() => doAction('more_info_requested')} className="col-span-2 border border-orange-500 text-orange-500 py-2 rounded-lg hover:bg-orange-50">
                    Request More Info
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}