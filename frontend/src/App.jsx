import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Navbar from './components/Common/Navbar';
import Toast from './components/Common/Toast';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DonorDashboard from './pages/DonorDashboard';
import AddFoodListing from './pages/AddFoodListing';
import MyListings from './pages/MyListings';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FoodDetails from './pages/FoodDetails';
import Profile from './pages/Profile';
import NgoRegister from './pages/NgoRegister';
import NgoLogin from './pages/NgoLogin';
import MyClaims from './pages/MyClaims';
import AdminLogin from './pages/AdminLogin';
import ClaimDetails from './pages/ClaimDetails';
import NotificationCenter from './pages/NotificationCenter';
import NearbyFood from './pages/NearbyFood';
import AdminMapDashboard from './pages/AdminMapDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected General Routes */}
                <Route path="/food/:id" element={<ProtectedRoute><FoodDetails /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Donor Routes */}
                <Route path="/donor" element={
                  <ProtectedRoute allowedRoles={['Donor']}><DonorDashboard /></ProtectedRoute>
                } />
                <Route path="/donor/add" element={
                  <ProtectedRoute allowedRoles={['Donor']}><AddFoodListing /></ProtectedRoute>
                } />
                <Route path="/donor/listings" element={
                  <ProtectedRoute allowedRoles={['Donor']}><MyListings /></ProtectedRoute>
                } />

                {/* NGO & Admin Routes */}
                <Route path="/ngo" element={
                  <ProtectedRoute allowedRoles={['NGO']}><NgoDashboard /></ProtectedRoute>
                } />
                <Route path="/ngo/claims" element={
                  <ProtectedRoute allowedRoles={['NGO']}><MyClaims /></ProtectedRoute>
                } />
                <Route path="/ngo/nearby" element={
                  <ProtectedRoute allowedRoles={['NGO']}><NearbyFood /></ProtectedRoute>
                } />
                <Route path="/ngo/register" element={<NgoRegister />} />
                <Route path="/ngo/login" element={<NgoLogin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/admin/map" element={
                  <ProtectedRoute allowedRoles={['Admin']}><AdminMapDashboard /></ProtectedRoute>
                } />
                <Route path="/claims/:id" element={
                  <ProtectedRoute><ClaimDetails /></ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute><NotificationCenter /></ProtectedRoute>
                } />
              </Routes>
            </div>
            <Toast />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
