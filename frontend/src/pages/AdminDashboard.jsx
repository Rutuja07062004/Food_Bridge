import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import {
  Users, Utensils, Activity, ShieldAlert, CheckCircle, AlertTriangle,
  ShieldCheck, Trash2, Search, Filter, Bell, Award, Calendar, Clock,
  Lock, Sun, Moon, LogOut, FileText, ChevronLeft, ChevronRight, BarChart3,
  TrendingUp, ThumbsUp, MapPin, Check, X, ShieldX, UserCheck, Compass
} from 'lucide-react';

// Recharts imports for beautiful charts
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

import { useNavigate } from 'react-router-dom';
import StatCard from '../components/Dashboard/StatCard';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Backend state
  const [summary, setSummary] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [listings, setListings] = useState([]);
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  const [ngoStatusFilter, setNgoStatusFilter] = useState('All');

  const [foodSearch, setFoodSearch] = useState('');
  const [foodStatusFilter, setFoodStatusFilter] = useState('All');

  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    console.log('[AdminDashboard] useEffect triggered. Fetching dashboard data. User:', user?.email);
    fetchData();
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const fetchData = async () => {
    console.log('[AdminDashboard] Fetching administrative metrics and records...');
    setLoading(true);
    setError('');
    try {
      const [dashRes, usersRes, ngosRes, listingsRes, claimsRes, notifRes, logsRes, analyticsRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getUsers(),
        adminService.getNGOs(),
        adminService.getFoodListings(),
        adminService.getClaims(),
        adminService.getNotifications(),
        adminService.getLogs(),
        adminService.getAnalytics()
      ]);

      if (dashRes.success) {
        console.log('[AdminDashboard] Dashboard summary loaded');
        setSummary(dashRes.data.summary);
        setWidgets(dashRes.data.widgets);
      }
      if (usersRes.success) {
        console.log('[AdminDashboard] Users loaded. Count:', usersRes.data?.length);
        setUsers(usersRes.data);
      }
      if (ngosRes.success) {
        console.log('[AdminDashboard] NGOs loaded. Count:', ngosRes.data?.length);
        setNgos(ngosRes.data);
      }
      if (listingsRes.success) {
        console.log('[AdminDashboard] Food listings loaded. Count:', listingsRes.data?.length);
        setListings(listingsRes.data);
      }
      if (claimsRes.success) {
        console.log('[AdminDashboard] Claims loaded. Count:', claimsRes.data?.length);
        setClaims(claimsRes.data);
      }
      if (notifRes.success) {
        console.log('[AdminDashboard] Notifications loaded. Count:', notifRes.data?.length);
        setNotifications(notifRes.data);
      }
      if (logsRes.success) {
        console.log('[AdminDashboard] Logs loaded. Count:', logsRes.data?.length);
        setLogs(logsRes.data);
      }
      if (analyticsRes.success) {
        console.log('[AdminDashboard] Analytics loaded');
        setAnalytics(analyticsRes.data);
      }

    } catch (err) {
      console.error('[AdminDashboard] Error loading admin dashboard metrics:', err);
      setError(err.response?.data?.message || 'Error loading administrator console.');
    } finally {
      console.log('[AdminDashboard] Setting loading to false');
      setLoading(false);
    }
  };

  const handleUserStatusUpdate = async (userId, newStatus) => {
    setActionLoading(userId);
    try {
      const res = await adminService.updateUserStatus(userId, newStatus);
      if (res.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
        setNgos(ngos.map(n => n._id === userId ? { ...n, status: newStatus } : n));
        fetchData(); // Refresh summary and logs
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account permanently?')) return;
    setActionLoading(userId);
    try {
      const res = await adminService.deleteUser(userId);
      if (res.success) {
        setUsers(users.filter(u => u._id !== userId));
        setNgos(ngos.filter(n => n._id !== userId));
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNgoApproval = async (id, approve) => {
    setActionLoading(id);
    try {
      const res = approve ? await adminService.approveNGO(id) : await adminService.rejectNGO(id);
      if (res.success) {
        setNgos(ngos.map(n => n._id === id ? { ...n, status: approve ? 'approved' : 'suspended' } : n));
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update NGO status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to moderate/delete this food listing?')) return;
    setActionLoading(id);
    try {
      const res = await adminService.deleteFoodListing(id);
      if (res.success) {
        setListings(listings.filter(l => l._id !== id));
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove listing.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaimStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const res = await adminService.updateClaimStatus(id, status);
      if (res.success) {
        setClaims(claims.map(c => c._id === id ? { ...c, claimStatus: status } : c));
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update claim.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkRead = async (id) => {
    setActionLoading(id);
    try {
      const res = await adminService.markNotificationRead(id);
      if (res.success) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update notification.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNotification = async (id) => {
    setActionLoading(id);
    try {
      const res = await adminService.deleteNotification(id);
      if (res.success) {
        setNotifications(notifications.filter(n => n._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete notification.');
    } finally {
      setActionLoading(null);
    }
  };

  // --- Filtering computations ---
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.phone.includes(userSearch);
    const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'All' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredNgos = ngos.filter(n => {
    return ngoStatusFilter === 'All' || n.status === ngoStatusFilter;
  });

  const filteredFood = listings.filter(l => {
    const matchesSearch = l.foodName.toLowerCase().includes(foodSearch.toLowerCase()) ||
                          l.description?.toLowerCase().includes(foodSearch.toLowerCase());
    const matchesStatus = foodStatusFilter === 'All' || l.status === foodStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- Chart Fallback Mock Data if DB seeding is light ---
  const defaultGrowthData = [
    { name: '01 Jun', count: 4 },
    { name: '02 Jun', count: 6 },
    { name: '03 Jun', count: 8 },
    { name: '04 Jun', count: 12 },
    { name: '05 Jun', count: 15 },
    { name: '06 Jun', count: 18 }
  ];

  const defaultMonthlyData = [
    { name: 'Jan', count: 22 },
    { name: 'Feb', count: 35 },
    { name: 'Mar', count: 48 },
    { name: 'Apr', count: 55 },
    { name: 'May', count: 68 },
    { name: 'Jun', count: 80 }
  ];

  const chartCategoryData = analytics?.categoryStats?.map(c => ({ name: c._id, value: c.count })) || [
    { name: 'Veg Meal', value: 40 },
    { name: 'Non-Veg Meal', value: 25 },
    { name: 'Bakery', value: 15 },
    { name: 'Groceries', value: 10 },
    { name: 'Other', value: 10 }
  ];

  const chartGrowthData = analytics?.growthTrend?.map(g => ({ name: g._id, count: g.count })) || defaultGrowthData;
  const chartMonthlyData = analytics?.monthlyDonations?.map(m => ({ name: `${m._id.month}/${m._id.year}`, count: m.count })) || defaultMonthlyData;

  const chartNgosServedData = analytics?.topNgosServed?.map(n => ({ name: n.name, count: n.count })) || [
    { name: 'Hope Kitchen', count: 12 },
    { name: 'Robin Hood NGO', count: 8 },
    { name: 'Care Food Center', count: 5 }
  ];

  const chartFoodSavedData = analytics?.monthlyFoodSaved?.map(f => ({ name: `${f._id.month}/${f._id.year}`, servings: f.servings })) || [
    { name: '1/2026', servings: 120 },
    { name: '2/2026', servings: 250 },
    { name: '3/2026', servings: 310 },
    { name: '4/2026', servings: 450 },
    { name: '5/2026', servings: 520 },
    { name: '6/2026', servings: 680 }
  ];

  const bgCls = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const cardCls = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
  const tableHeaderCls = darkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500';
  const inputBgCls = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgCls} flex flex-col justify-center items-center`}>
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold animate-pulse">Loading administration console...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgCls} flex flex-col md:flex-row transition-colors duration-200`}>
      
      {/* ─── SIDEBAR NAVIGATION ─── */}
      <div className={`w-full md:w-64 border-r ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-5 flex flex-col justify-between`}>
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              BridgeAdmin
            </span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'ngos', label: 'NGO Approvals', icon: UserCheck },
              { id: 'listings', label: 'Food Listings', icon: Utensils },
              { id: 'claims', label: 'Claims Lifecycle', icon: Award },
              { id: 'safety', label: 'Food Safety', icon: ShieldAlert },
              { id: 'map', label: 'Logistics Map', icon: Compass, isRoute: true },
              { id: 'notifications', label: 'Alert Center', icon: Bell },
              { id: 'logs', label: 'System Logs', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.isRoute ? navigate('/admin/map') : setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    active 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                      : darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {tab.label}
                  {tab.id === 'notifications' && notifications.filter(n => !n.read).length > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100/10 mt-6 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-500">Theme</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-800 text-amber-400' : 'border-slate-200 bg-slate-100 text-slate-600'} transition-all`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ─── MAIN PANEL AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className={`px-8 py-4 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} flex justify-between items-center`}>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">
            {activeTab === 'overview' ? 'Dashboard Overview' : activeTab.replace('_', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200/10">
              System Admin: {user?.name}
            </span>
          </div>
        </header>

        {/* Tab Contents */}
        <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* ─── TAB: OVERVIEW / DASHBOARD ─── */}
          {activeTab === 'overview' && summary && (
            <div className="space-y-8">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Total Users" value={summary.totalUsers} icon={Users} color="emerald" trend={`${summary.totalNgos} NGOs / ${summary.totalDonors} Donors`} />
                <StatCard title="Food Listings" value={summary.totalFoodListings} icon={Utensils} color="blue" trend={`${summary.activeListings} Active Available`} />
                <StatCard title="Claimed Listings" value={summary.claimedListings} icon={Award} color="amber" trend={`${summary.completedDonations} Completed`} />
                <StatCard title="Food Saved (kg)" value={summary.foodSavedKg} icon={ThumbsUp} color="teal" trend={`Feeds approx ${summary.servingsSaved} people`} />
              </div>

              {/* Recharts Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Total Food Donated */}
                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls}`}>
                  <h3 className="font-extrabold text-base mb-4 flex items-center gap-1.5"><TrendingUp className="w-5 h-5 text-emerald-500" /> Total Food Donated (Growth Trend)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartGrowthData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={0.1} fill="#10b981" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Total NGOs Served */}
                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls}`}>
                  <h3 className="font-extrabold text-base mb-4 flex items-center gap-1.5"><Users className="w-5 h-5 text-indigo-500" /> Total NGOs Served (Completed Claims)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartNgosServedData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Donations */}
                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls}`}>
                  <h3 className="font-extrabold text-base mb-4 flex items-center gap-1.5"><BarChart3 className="w-5 h-5 text-teal-500" /> Monthly Donations</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartMonthlyData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Food Saved From Waste */}
                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls}`}>
                  <h3 className="font-extrabold text-base mb-4 flex items-center gap-1.5"><ThumbsUp className="w-5 h-5 text-emerald-500" /> Food Saved From Waste (Monthly Servings Saved)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartFoodSavedData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="servings" stroke="#059669" fillOpacity={0.1} fill="#059669" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: USER MANAGEMENT ─── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search & Filter header */}
              <div className={`p-5 rounded-3xl border shadow-sm ${cardCls} flex flex-col md:flex-row gap-4 items-center justify-between`}>
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm focus:border-emerald-500 transition-all ${inputBgCls}`}
                  />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className={`px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-emerald-500 w-full md:w-auto ${inputBgCls}`}
                  >
                    <option value="All">All Roles</option>
                    <option value="Donor">Donors</option>
                    <option value="NGO">NGOs</option>
                    <option value="Admin">Admins</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className={`px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-emerald-500 w-full md:w-auto ${inputBgCls}`}
                  >
                    <option value="All">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className={`border rounded-3xl shadow-sm ${cardCls} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className={`border-b font-bold ${tableHeaderCls}`}>
                        <th className="py-4 px-6">Name & Email</th>
                        <th className="py-4 px-6">Phone</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredUsers.map(u => (
                        <tr key={u._id} className="hover:bg-slate-50/20 transition-colors font-medium">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{u.name}</div>
                            <div className="text-slate-400 text-xs mt-0.5">{u.email}</div>
                          </td>
                          <td className="py-4 px-6 text-slate-500">{u.phone}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'Donor' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-cyan-100 text-cyan-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
                              u.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              u.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              'bg-rose-50 border-rose-200 text-rose-700'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {u.role !== 'Admin' && (
                              <div className="inline-flex gap-2">
                                {u.status === 'suspended' ? (
                                  <button
                                    onClick={() => handleUserStatusUpdate(u._id, 'approved')}
                                    disabled={actionLoading === u._id}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Activate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUserStatusUpdate(u._id, 'suspended')}
                                    disabled={actionLoading === u._id}
                                    className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  disabled={actionLoading === u._id}
                                  className="p-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: NGO APPROVALS ─── */}
          {activeTab === 'ngos' && (
            <div className="space-y-6">
              {/* Filter */}
              <div className={`p-4 rounded-3xl border shadow-sm ${cardCls} flex justify-between items-center`}>
                <span className="font-bold text-sm">NGO Approvals Queue</span>
                <select
                  value={ngoStatusFilter}
                  onChange={(e) => setNgoStatusFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer ${inputBgCls}`}
                >
                  <option value="All">All NGOs</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved NGOs</option>
                  <option value="suspended">Suspended / Rejected</option>
                </select>
              </div>

              {/* Data Table */}
              <div className={`border rounded-3xl shadow-sm ${cardCls} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className={`border-b font-bold ${tableHeaderCls}`}>
                        <th className="py-4 px-6">NGO Details</th>
                        <th className="py-4 px-6">Reg Number</th>
                        <th className="py-4 px-6">Contact Person</th>
                        <th className="py-4 px-6">Address</th>
                        <th className="py-4 px-6">Verification Document</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Approve / Decline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredNgos.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-10 text-slate-400 font-medium">No NGOs found in approval queue.</td>
                        </tr>
                      ) : (
                        filteredNgos.map(ngo => (
                          <tr key={ngo._id} className="hover:bg-slate-50/20 transition-colors font-medium">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-800 dark:text-slate-100">{ngo.name}</div>
                              <div className="text-slate-400 text-xs mt-0.5">{ngo.email}</div>
                              <div className="text-slate-400 text-xs">{ngo.phone}</div>
                            </td>
                            <td className="py-4 px-6 text-slate-600 font-mono text-xs">{ngo.registrationNumber || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-700 dark:text-slate-200">{ngo.contactPerson || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-500 text-xs max-w-xs truncate" title={ngo.address}>{ngo.address || 'N/A'}</td>
                            <td className="py-4 px-6">
                              {ngo.verificationDocument?.url ? (
                                <a
                                  href={ngo.verificationDocument.url.startsWith('http') ? ngo.verificationDocument.url : `${API_BASE}${ngo.verificationDocument.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 transition-all cursor-pointer shadow-sm"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Doc</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs italic">No document</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                ngo.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                ngo.status === 'pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {ngo.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {ngo.status === 'pending' ? (
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => handleNgoApproval(ngo._id, true)}
                                    disabled={actionLoading === ngo._id}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleNgoApproval(ngo._id, false)}
                                    disabled={actionLoading === ngo._id}
                                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleUserStatusUpdate(ngo._id, ngo.status === 'approved' ? 'suspended' : 'approved')}
                                  disabled={actionLoading === ngo._id}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    ngo.status === 'approved' 
                                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                >
                                  {ngo.status === 'approved' ? 'Suspend' : 'Re-Approve'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: FOOD LISTINGS ─── */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {/* Search */}
              <div className={`p-5 rounded-3xl border shadow-sm ${cardCls} flex flex-col md:flex-row gap-4 items-center justify-between`}>
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by food listing name..."
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm focus:border-emerald-500 transition-all ${inputBgCls}`}
                  />
                </div>

                <select
                  value={foodStatusFilter}
                  onChange={(e) => setFoodStatusFilter(e.target.value)}
                  className={`px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-emerald-500 w-full md:w-auto ${inputBgCls}`}
                >
                  <option value="All">All Statuses</option>
                  <option value="available">Available (Active)</option>
                  <option value="claimed">Claimed</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Listings Table */}
              <div className={`border rounded-3xl shadow-sm ${cardCls} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className={`border-b font-bold ${tableHeaderCls}`}>
                        <th className="py-4 px-6">Food Item</th>
                        <th className="py-4 px-6">Donor</th>
                        <th className="py-4 px-6">Quantity / Servings</th>
                        <th className="py-4 px-6">Expiry</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Moderate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredFood.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">No food listings found.</td>
                        </tr>
                      ) : (
                        filteredFood.map(food => (
                          <tr key={food._id} className="hover:bg-slate-50/20 transition-colors font-medium">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-800 dark:text-slate-100">{food.foodName}</div>
                              <div className="text-slate-400 text-xs truncate max-w-xs">{food.description || 'No description.'}</div>
                            </td>
                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{food.donorId?.name || 'Deleted Donor'}</td>
                            <td className="py-4 px-6 text-slate-700 dark:text-slate-200">{food.quantity} · Serves {food.servings}</td>
                            <td className="py-4 px-6 text-slate-500 text-xs">{new Date(food.expiryTime).toLocaleString()}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                food.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                                food.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
                                food.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {food.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleDeleteListing(food._id)}
                                disabled={actionLoading === food._id}
                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: CLAIMS LIFECYCLE ─── */}
          {activeTab === 'claims' && (
            <div className="space-y-6">
              <div className={`border rounded-3xl shadow-sm ${cardCls} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className={`border-b font-bold ${tableHeaderCls}`}>
                        <th className="py-4 px-6">Food Item</th>
                        <th className="py-4 px-6">Claimed By NGO</th>
                        <th className="py-4 px-6">Donor</th>
                        <th className="py-4 px-6">Claim Date</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Moderate Claim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {claims.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">No claims logs found.</td>
                        </tr>
                      ) : (
                        claims.map(claim => (
                          <tr key={claim._id} className="hover:bg-slate-50/20 transition-colors font-medium">
                            <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100">{claim.foodId?.foodName || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-bold">{claim.ngoId?.name || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{claim.donorId?.name || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-500 text-xs">{new Date(claim.createdAt).toLocaleString()}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${
                                claim.claimStatus === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                claim.claimStatus === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                claim.claimStatus === 'approved' ? 'bg-sky-100 text-sky-700 border-sky-200' :
                                'bg-rose-100 text-rose-800 border-rose-200'
                              }`}>
                                {claim.claimStatus}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {claim.claimStatus !== 'completed' && claim.claimStatus !== 'rejected' && claim.claimStatus !== 'cancelled' && (
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => handleClaimStatus(claim._id, 'completed')}
                                    disabled={actionLoading === claim._id}
                                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all"
                                  >
                                    Mark Collected
                                  </button>
                                  <button
                                    onClick={() => handleClaimStatus(claim._id, 'cancelled')}
                                    disabled={actionLoading === claim._id}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: ALERT CENTER (NOTIFICATIONS) ─── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {notifications.length === 0 ? (
                  <div className={`p-12 text-center rounded-3xl border shadow-sm ${cardCls}`}>
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">Clear Horizon!</h3>
                    <p className="text-slate-500 text-sm">No new system alerts or registrations pending.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif._id}
                      className={`p-5 rounded-3xl border shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${cardCls} relative group ${
                        !notif.read 
                          ? darkMode ? 'border-l-4 border-l-emerald-500 bg-emerald-950/10' : 'border-l-4 border-l-emerald-500 bg-emerald-50/20' 
                          : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        notif.type === 'NGO_REGISTRATION' ? 'bg-amber-100 text-amber-600' :
                        notif.type === 'NEW_LISTING' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-bold">{new Date(notif.createdAt).toLocaleDateString()}</span>
                          {!notif.read && (
                            <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded tracking-wide animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                      <div className="flex items-center gap-2 self-center">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkRead(notif._id)}
                            disabled={actionLoading === notif._id}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 border border-emerald-200 dark:border-emerald-900/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notif._id)}
                          disabled={actionLoading === notif._id}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 border border-rose-200 dark:border-rose-900/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── TAB: SYSTEM ACTIVITY LOGS ─── */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className={`border rounded-3xl shadow-sm ${cardCls} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm font-medium">
                    <thead>
                      <tr className={`border-b font-bold ${tableHeaderCls}`}>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">User Account</th>
                        <th className="py-4 px-6">Operation</th>
                        <th className="py-4 px-6">Details</th>
                        <th className="py-4 px-6">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.map(log => (
                        <tr key={log._id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-4 px-6 text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                            {log.userId ? (
                              <div className="flex items-center gap-2">
                                <span>{log.userId.name}</span>
                                <span className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded tracking-wide">
                                  {log.userId.role}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold">Anonymous / System</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-emerald-700 font-bold dark:text-emerald-400">{log.action}</td>
                          <td className="py-4 px-6 text-slate-500 text-xs max-w-sm truncate" title={log.details}>{log.details}</td>
                          <td className="py-4 px-6 text-slate-400 text-xs font-mono">{log.ipAddress || 'unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: FOOD SAFETY REPORTS ─── */}
          {activeTab === 'safety' && (
            <div className="space-y-8">
              {/* Risk Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls} relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl animate-pulse" />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Fresh Listings
                  </div>
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                    {listings.filter(l => l.freshnessStatus === 'Fresh').length}
                  </div>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium">Optimal shelf integrity</p>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls} relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Consume Soon
                  </div>
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                    {listings.filter(l => l.freshnessStatus === 'Consume Soon').length}
                  </div>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium">Should be claimed quickly</p>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls} relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-xl" />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                    Near Expiry
                  </div>
                  <div className="text-3xl font-black text-orange-600">
                    {listings.filter(l => l.freshnessStatus === 'Near Expiry').length}
                  </div>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium">High waste risk alerts</p>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm ${cardCls} relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl" />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Expired Listings
                  </div>
                  <div className="text-3xl font-black text-rose-600">
                    {listings.filter(l => l.freshnessStatus === 'Expired').length}
                  </div>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium">Require moderation cleanup</p>
                </div>
              </div>

              {/* Chart & Category analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pie Chart of risk distribution */}
                <div className={`lg:col-span-1 p-6 rounded-3xl border shadow-sm ${cardCls} flex flex-col justify-between`}>
                  <div>
                    <h3 className="font-extrabold text-base mb-1 flex items-center gap-1.5">
                      <Activity className="w-5 h-5 text-purple-500" />
                      Risk Level Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Breakdown of current database items by freshness safety status</p>
                  </div>
                  <div className="h-56 flex items-center justify-center relative">
                    {listings.length === 0 ? (
                      <span className="text-slate-400 text-xs">No listing data</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Fresh', value: listings.filter(l => l.freshnessStatus === 'Fresh').length },
                              { name: 'Consume Soon', value: listings.filter(l => l.freshnessStatus === 'Consume Soon').length },
                              { name: 'Near Expiry', value: listings.filter(l => l.freshnessStatus === 'Near Expiry').length },
                              { name: 'Expired', value: listings.filter(l => l.freshnessStatus === 'Expired').length }
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#f97316" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  {/* Legend list */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Fresh</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Consume Soon</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Near Expiry</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expired</div>
                  </div>
                </div>

                {/* Category Freshness Levels Table */}
                <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-sm ${cardCls}`}>
                  <h3 className="font-extrabold text-base mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5 text-emerald-500" />
                    Food Safety Risk Alerts (Near Expiry)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">List of active food donations that are within critical shelf life bounds and need rapid NGO claim.</p>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b font-bold ${tableHeaderCls}`}>
                          <th className="py-2.5 px-4">Food Item</th>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4">Prep Date/Time</th>
                          <th className="py-2.5 px-4">Storage Mode</th>
                          <th className="py-2.5 px-4">Temp</th>
                          <th className="py-2.5 px-4 text-right">Expiry Window</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {listings.filter(l => l.freshnessStatus === 'Near Expiry').length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-slate-400 italic">No food items flagged as high risk (Near Expiry) currently.</td>
                          </tr>
                        ) : (
                          listings.filter(l => l.freshnessStatus === 'Near Expiry').map(food => (
                            <tr key={food._id} className="hover:bg-slate-50/20 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{food.foodName}</td>
                              <td className="py-3 px-4 text-slate-500">{food.category}</td>
                              <td className="py-3 px-4 text-slate-500">
                                {food.preparationDate ? new Date(food.preparationDate).toLocaleDateString() : 'N/A'}{' '}
                                {food.preparationTime || ''}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{food.storageType || 'Room Temp'}</td>
                              <td className="py-3 px-4 text-slate-500 font-mono">{food.currentTemperature || 20}°C</td>
                              <td className="py-3 px-4 text-right font-bold text-orange-600">
                                {food.predictedExpiryTime ? new Date(food.predictedExpiryTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Expired'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Expired and Waste Moderation Area */}
              <div className={`p-6 rounded-3xl border shadow-sm ${cardCls}`}>
                <h3 className="font-extrabold text-base mb-1 flex items-center gap-1.5 text-rose-600">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                  Expired Listing Cleanup Queue
                </h3>
                <p className="text-xs text-slate-400 mb-4">Items marked as Expired by the AI freshness engine. We recommend moderating/deleting these listings to keep the NGO portal clean.</p>

                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left border-collapse text-xs font-medium">
                    <thead>
                      <tr className={`border-b font-bold ${tableHeaderCls}`}>
                        <th className="py-3 px-6">Food Item</th>
                        <th className="py-3 px-6">Donor Info</th>
                        <th className="py-3 px-6">Storage Conditions</th>
                        <th className="py-3 px-6">Final Freshness</th>
                        <th className="py-3 px-6">Calculated Expiration</th>
                        <th className="py-3 px-6 text-right">Moderation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {listings.filter(l => l.freshnessStatus === 'Expired' || l.status === 'EXPIRED').length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-slate-400 italic">No expired items requiring database moderation cleanup.</td>
                        </tr>
                      ) : (
                        listings.filter(l => l.freshnessStatus === 'Expired' || l.status === 'EXPIRED').map(food => (
                          <tr key={food._id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{food.foodName}</div>
                              <div className="text-slate-400 text-[10px] mt-0.5">{food.category}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-slate-700 dark:text-slate-300 font-bold">{food.donorId?.name || 'Deleted Donor'}</div>
                              <div className="text-slate-400 text-[10px]">{food.donorId?.email || ''}</div>
                            </td>
                            <td className="py-4 px-6 text-slate-500 text-[11px]">
                              {food.storageType || 'Room Temp'} · {food.currentTemperature || 20}°C
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[10px] font-extrabold uppercase">
                                {food.freshnessScore}% EXPIRED
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-400 font-mono">
                              {food.predictedExpiryTime ? new Date(food.predictedExpiryTime).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleDeleteListing(food._id)}
                                disabled={actionLoading === food._id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-1 ml-auto cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Post</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
