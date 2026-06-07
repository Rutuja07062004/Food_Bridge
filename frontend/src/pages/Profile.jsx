import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import foodService from '../services/foodService';
import ngoService from '../services/ngoService';
import { User, Phone, Mail, Shield, Award, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import ProfilePhotoUploader from '../components/Upload/ProfilePhotoUploader';

const Profile = () => {
  const { user, setUser } = useAuth();
  
  // Profile form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    registrationNumber: user?.registrationNumber || '',
    contactPerson: user?.contactPerson || '',
    address: user?.address || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // User Stats state
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        registrationNumber: user.registrationNumber || '',
        contactPerson: user.contactPerson || '',
        address: user.address || ''
      });
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      if (user.role === 'Donor') {
        const res = await foodService.getListings({ donorId: user._id });
        if (res.success) {
          const list = res.data || [];
          setStats({
            total: list.length,
            completed: list.filter(item => item.status === 'completed').length,
            active: list.filter(item => item.status === 'available' || item.status === 'claimed').length
          });
        }
      } else if (user.role === 'NGO') {
        const res = await foodService.getClaims();
        if (res.success) {
          const list = res.data || [];
          setStats({
            total: list.length,
            completed: list.filter(item => item.claimStatus === 'completed').length,
            active: list.filter(item => item.claimStatus === 'claimed' || item.claimStatus === 'picked_up').length
          });
        }
      }
    } catch (err) {
      console.error('Failed to load user stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setProfileLoading(true);

    try {
      let res;
      if (user.role === 'NGO') {
        res = await ngoService.updateProfile({
          ngoName: profileForm.name,
          contactPerson: profileForm.contactPerson,
          phone: profileForm.phone,
          address: profileForm.address,
          registrationNumber: profileForm.registrationNumber
        });
      } else {
        res = await authService.updateProfile({
          name: profileForm.name,
          phone: profileForm.phone
        });
      }

      if (res.success) {
        setUser(res.user);
        setProfileMessage({ type: 'success', text: 'Profile details updated successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: res.message || 'Failed to update profile' });
      }
    } catch (err) {
      setProfileMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Something went wrong. Please try again.' 
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
    }

    if (passwordForm.newPassword.length < 6) {
      return setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
    }

    setPasswordLoading(true);
    try {
      const res = await authService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ type: 'error', text: res.message || 'Failed to change password' });
      }
    } catch (err) {
      setPasswordMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Password update failed.' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Account Profile</h1>
            <p className="text-slate-400 mt-1">Manage your account credentials, preferences, and view your impacts</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-800 border border-slate-700/50 rounded-2xl p-4 self-start md:self-auto shadow-inner">
            {user?.profilePhoto?.url ? (
              <img
                src={user.profilePhoto.url.startsWith('http') ? user.profilePhoto.url : `${API_BASE}${user.profilePhoto.url}`}
                alt="Profile Avatar"
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white text-xl">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-extrabold text-white text-sm">{user?.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user?.role} Account</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        
        {/* Statistics Panels (Only for NGOs or Donors) */}
        {user?.role !== 'Admin' && !statsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="text-center p-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {user.role === 'Donor' ? 'Total Donated Listings' : 'Total Food Claims'}
              </div>
              <div className="text-3xl font-extrabold text-slate-800 mt-2">{stats.total}</div>
            </div>
            <div className="text-center p-4 border-y sm:border-y-0 sm:border-x border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Redistribution</div>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.completed}</div>
            </div>
            <div className="text-center p-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currently In Progress</div>
              <div className="text-3xl font-extrabold text-amber-500 mt-2">{stats.active}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Profile Form Column */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xl font-bold text-slate-800">Personal Details</h3>
            </div>

            <ProfilePhotoUploader
              initialPhotoUrl={user?.profilePhoto?.url}
              onUploadSuccess={(photo) => {
                setUser({ ...user, profilePhoto: photo });
              }}
              onRemoveSuccess={() => {
                setUser({ ...user, profilePhoto: { url: '', publicId: '' } });
              }}
            />

            {profileMessage.text && (
              <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${
                profileMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
                {profileMessage.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email (Read Only)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {user?.role === 'NGO' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Registration Number *</label>
                    <div className="relative">
                      <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={profileForm.registrationNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                        placeholder="Organization registration number"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contact Person *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={profileForm.contactPerson}
                        onChange={(e) => setProfileForm({ ...profileForm, contactPerson: e.target.value })}
                        placeholder="Contact person name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Head Office Address *</label>
                    <textarea
                      required
                      rows={2}
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Head office address"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                {profileLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Save Details'}
              </button>
            </form>
          </div>

          {/* Password Form Column */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xl font-bold text-slate-800">Security Credentials</h3>
            </div>

            {passwordMessage.text && (
              <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${
                passwordMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                {passwordLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
