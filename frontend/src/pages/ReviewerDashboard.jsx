import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function ReviewerDashboard() {
  const [queue, setQueue] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [queueRes, metricsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/v1/reviewer/queue/', {
          headers: { Authorization: `Token ${token}` }
        }),
        axios.get('http://127.0.0.1:8000/api/v1/reviewer/metrics/', {
          headers: { Authorization: `Token ${token}` }
        })
      ])
      setQueue(queueRes.data)
      setMetrics(metricsRes.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const getStateBadge = (state) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
    }
    return colors[state] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Playto KYC — Reviewer</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hi, {username}</span>
          <button onClick={logout} className="text-red-500 hover:underline text-sm">Logout</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {metrics && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{metrics.total_in_queue}</p>
              <p className="text-gray-500 text-sm mt-1">In Queue</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{metrics.avg_hours_in_queue}h</p>
              <p className="text-gray-500 text-sm mt-1">Avg Time in Queue</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{metrics.approval_rate_7days}%</p>
              <p className="text-gray-500 text-sm mt-1">Approval Rate (7d)</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{metrics.at_risk_count}</p>
              <p className="text-gray-500 text-sm mt-1">At Risk (&gt;24h)</p>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4">Review Queue</h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : queue.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <p className="text-gray-500">Queue is empty! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map(sub => (
              <div
                key={sub.id}
                className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/reviewer/${sub.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{sub.full_name || 'Unnamed'}</h3>
                    <p className="text-gray-500 text-sm">{sub.business_name} — {sub.business_type}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStateBadge(sub.state)}`}>
                      {sub.state.replace('_', ' ')}
                    </span>
                    {sub.is_at_risk && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                        ⚠️ At Risk
                      </span>
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