import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

export default function KYCForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    business_name: '', business_type: '', monthly_volume: ''
  })
  const [files, setFiles] = useState({
    pan_document: null, aadhaar_document: null, bank_statement: null
  })

  useEffect(() => {
    fetchSubmission()
  }, [])

  const fetchSubmission = async () => {
    try {
      const res = await axios.get(`https://playto-kyc-backend-hw1z.onrender.com/api/v1/submissions/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      })
      const d = res.data
      setForm({
        full_name: d.full_name || '',
        email: d.email || '',
        phone: d.phone || '',
        business_name: d.business_name || '',
        business_type: d.business_type || '',
        monthly_volume: d.monthly_volume || ''
      })
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      Object.entries(files).forEach(([k, v]) => { if (v) data.append(k, v) })
      await axios.patch(`https://playto-kyc-backend-hw1z.onrender.com/api/v1/submissions/${id}/`, data, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      setMessage('Saved successfully!')
    } catch (err) {
      setMessage('Error saving. Check file types and sizes.')
    }
    setSaving(false)
  }

  const handleSubmit = async () => {
    await handleSave()
    try {
      await axios.post(`https://playto-kyc-backend-hw1z.onrender.com/api/v1/submissions/${id}/submit/`, {}, {
        headers: { Authorization: `Token ${token}` }
      })
      setMessage('Submitted for review!')
      setTimeout(() => navigate('/merchant'), 1500)
    } catch (err) {
      setMessage(err.response?.data?.error || 'Submit failed')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Playto KYC</h1>
        <button onClick={() => navigate('/merchant')} className="text-gray-500 hover:underline text-sm">
          ← Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">KYC Application</h2>

        {message && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4">{message}</div>
        )}

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Personal Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Business Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.business_name}
                  onChange={e => setForm({...form, business_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.business_type}
                  onChange={e => setForm({...form, business_type: e.target.value})}
                >
                  <option value="">Select type</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Agency">Agency</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Monthly Volume (USD)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.monthly_volume}
                  onChange={e => setForm({...form, monthly_volume: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">Documents</h3>
            <p className="text-sm text-gray-500 mb-3">PDF, JPG, PNG only. Max 5MB each.</p>
            <div className="space-y-3">
              {['pan_document', 'aadhaar_document', 'bank_statement'].map(doc => (
                <div key={doc}>
                  <label className="block text-sm font-medium mb-1">
                    {doc === 'pan_document' ? 'PAN Card' : doc === 'aadhaar_document' ? 'Aadhaar Card' : 'Bank Statement'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full border rounded-lg px-3 py-2"
                    onChange={e => setFiles({...files, [doc]: e.target.files[0]})}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Submit for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}