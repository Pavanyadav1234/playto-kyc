import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import MerchantDashboard from './pages/MerchantDashboard'
import ReviewerDashboard from './pages/ReviewerDashboard'
import KYCForm from './pages/KYCForm'
import ReviewDetail from './pages/ReviewDetail'

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" />
  if (role && userRole !== role) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/merchant" element={
          <PrivateRoute role="merchant"><MerchantDashboard /></PrivateRoute>
        } />
        <Route path="/merchant/kyc/:id" element={
          <PrivateRoute role="merchant"><KYCForm /></PrivateRoute>
        } />
        <Route path="/reviewer" element={
          <PrivateRoute role="reviewer"><ReviewerDashboard /></PrivateRoute>
        } />
        <Route path="/reviewer/:id" element={
          <PrivateRoute role="reviewer"><ReviewDetail /></PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}