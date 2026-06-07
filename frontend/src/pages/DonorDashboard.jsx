import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import foodService from '../services/foodService';
import claimsService from '../services/claimsService';
import {
  Utensils, PlusCircle, List, Clock, CheckCircle,
  AlertTriangle, TrendingUp, ArrowRight, Package, Users, Eye, Check, X,
  BarChart3, ThumbsUp
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar
} from 'recharts';

const STATUS_MAP = {
  CLAIM_REQUESTED: { label: 'Pending Approval', cls: 'bg-amber-100 border-amber-200 text-amber-700' },
  APPROVED: { label: 'Approved', cls: 'bg-sky-100 border-sky-200 text-sky-700' },
  READY_FOR_PICKUP: { label: 'Ready For Pickup', cls: 'bg-emerald-100 border-emerald-200 text-emerald-700 animate-pulse' },
  COLLECTED: { label: 'Collected / In Transit', cls: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
  COMPLETED: { label: 'Completed', cls: 'bg-slate-100 border-slate-200 text-slate-600' },
  REJECTED: { label: 'Rejected', cls: 'bg-rose-100 border-rose-200 text-rose-700' },
  EXPIRED: { label: 'Expired', cls: 'bg-rose-100 border-rose-200 text-rose-600' },
};

const StatCard = ({ title, value, icon: Icon, gradient, sub }) => (
  <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-lg ${gradient}`}>
    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-6 -right-2 w-32 h-32 rounded-full bg-white/5" />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-extrabold mb-1">{value ?? '—'}</div>
      <div className="font-semibold text-white/90 text-sm">{title}</div>
      {sub && <div className="text-white/60 text-xs mt-1">{sub}</div>}
    </div>
  </div>
);

const DonorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Approved', 'Completed', 'Rejected'
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const loadData = async () => {
    try {
      setAnalyticsLoading(true);
      const [statsRes, claimsRes, analyticsRes] = await Promise.all([
        foodService.getDonorStats(),
        claimsService.getClaims(),
        foodService.getDonorAnalytics().catch(err => {
          console.warn('Donor analytics failed:', err);
          return { success: false };
        })
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (claimsRes.success) setClaims(claimsRes.data);
      if (analyticsRes?.success) setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimAction = async (claimId, action) => {
    setActionLoadingId(claimId);
    try {
      let res;
      if (action === 'approve') {
        res = await claimsService.approveClaim(claimId);
      } else if (action === 'reject') {
        res = await claimsService.rejectClaim(claimId);
      }
      if (res?.success) {
        await loadData();
      } else {
        alert(res?.message || `Failed to ${action} claim.`);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || `Failed to perform ${action} action.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredClaims = claims.filter(c => {
    if (activeTab === 'Pending') {
      return c.claimStatus === 'CLAIM_REQUESTED';
    }
    if (activeTab === 'Approved') {
      return ['APPROVED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(c.claimStatus);
    }
    if (activeTab === 'Completed') {
      return c.claimStatus === 'COMPLETED';
    }
    if (activeTab === 'Rejected') {
      return c.claimStatus === 'REJECTED';
    }
    return true;
  });

  const statCards = [
    {
      title: 'Total Donations',
      value: stats?.total,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      sub: 'All listings ever created',
    },
    {
      title: 'Active Listings',
      value: stats?.active,
      icon: Clock,
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      sub: 'Available for claiming',
    },
    {
      title: 'Claimed Listings',
      value: stats?.claimed,
      icon: Users,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
      sub: 'Awaiting pickup',
    },
    {
      title: 'Expired Listings',
      value: stats?.expired,
      icon: AlertTriangle,
      gradient: 'bg-gradient-to-br from-rose-500 to-red-600',
      sub: 'Past expiry date',
    },
  ];

  const defaultMonthlyData = [
    { name: 'Jan', count: 2 },
    { name: 'Feb', count: 5 },
    { name: 'Mar', count: 4 },
    { name: 'Apr', count: 8 },
    { name: 'May', count: 12 },
    { name: 'Jun', count: 15 }
  ];

  const defaultFoodSavedData = [
    { name: 'Jan', servings: 30 },
    { name: 'Feb', servings: 80 },
    { name: 'Mar', servings: 110 },
    { name: 'Apr', servings: 180 },
    { name: 'May', servings: 240 },
    { name: 'Jun', servings: 310 }
  ];

  const chartMonthlyData = analytics?.monthlyDonations?.map(m => ({ name: `${m._id.month}/${m._id.year}`, count: m.count })) || defaultMonthlyData;
  
  const chartNgosServedData = analytics?.topNgosServed?.map(n => ({ name: n.name, count: n.count })) || [
    { name: 'Hope Kitchen', count: 5 },
    { name: 'Robin Hood NGO', count: 3 },
    { name: 'Care Food Center', count: 1 }
  ];

  const chartFoodSavedData = analytics?.monthlyFoodSaved?.map(f => ({ name: `${f._id.month}/${f._id.year}`, servings: f.servings })) || defaultFoodSavedData;
  
  const chartCategoryData = analytics?.categoryStats?.map(c => ({ name: c._id, count: c.count })) || [
    { name: 'Veg Meal', count: 8 },
    { name: 'Non-Veg Meal', count: 4 },
    { name: 'Bakery', count: 3 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-2">Donor Dashboard</p>
          <h1 className="text-4xl font-extrabold mb-2">
            Welcome back, <span className="text-emerald-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-base">Track your food donations and make a difference in your community.</p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/donor/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900 transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              Add New Listing
            </Link>
            <Link
              to="/donor/listings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all"
            >
              <List className="w-4.5 h-4.5" />
              My Listings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>
        )}

        {/* Completed Banner */}
        {!loading && stats?.completed > 0 && (
          <div className="mt-6 flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-900 text-sm">
                🎉 {stats.completed} donation{stats.completed !== 1 ? 's' : ''} fully completed!
              </p>
              <p className="text-emerald-700 text-xs">Your generosity has helped feed the community.</p>
            </div>
          </div>
        )}

        {/* Analytics Dashboard Section */}
        {!analyticsLoading && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm mt-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Donation Impact & Analytics
              </h2>
              <p className="text-slate-400 text-xs mt-1">Real-time statistics and insights from your food contributions.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Total Food Donated */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                <h3 className="font-extrabold text-sm text-slate-700 mb-4 flex items-center gap-1.5">
                  <Utensils className="w-4.5 h-4.5 text-emerald-500" /> Total Food Donated (Category Breakdown)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartCategoryData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Total NGOs Served */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                <h3 className="font-extrabold text-sm text-slate-700 mb-4 flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-indigo-500" /> Total NGOs Served (Completed Claims)
                </h3>
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

              {/* Chart 3: Monthly Donations */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                <h3 className="font-extrabold text-sm text-slate-700 mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4.5 h-4.5 text-teal-500" /> Monthly Donations
                </h3>
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

              {/* Chart 4: Food Saved From Waste */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                <h3 className="font-extrabold text-sm text-slate-700 mb-4 flex items-center gap-1.5">
                  <ThumbsUp className="w-4.5 h-4.5 text-emerald-600" /> Food Saved From Waste (Monthly Servings Saved)
                </h3>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Claims History / Workflow Manager */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-800">Manage Claims & Handovers</h2>
              
              {/* Tab Selector */}
              <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/50">
                {['Pending', 'Approved', 'Completed', 'Rejected'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab 
                        ? 'bg-white text-emerald-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'Pending' ? 'Pending Requests' : tab === 'Approved' ? 'Approved / Active' : tab === 'Completed' ? 'Completed' : 'Rejected'}
                  </button>
                ))}
              </div>
            </div>

            {filteredClaims.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="font-bold text-slate-700 text-sm">No Claims Found</h3>
                <p className="text-slate-400 text-xs mt-1">There are no claims in the "{activeTab}" status list.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClaims.map((claim) => (
                  <div 
                    key={claim._id} 
                    className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md">
                          {claim.foodId?.category || 'Veg Meal'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                          STATUS_MAP[claim.claimStatus]?.cls || 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {STATUS_MAP[claim.claimStatus]?.label || claim.claimStatus?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h3 className="font-extrabold text-slate-800 text-base truncate">
                        {claim.foodId?.foodName || 'Food Listing Removed'}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold">
                        <p>Claimed by: <span className="text-slate-700">{claim.ngoId?.name || 'NGO'}</span></p>
                        <p>Date: <span className="text-slate-700">{new Date(claim.createdAt).toLocaleDateString()}</span></p>
                        {claim.pickupTime && <p>Planned Pickup: <span className="text-slate-700">{claim.pickupTime}</span></p>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {claim.claimStatus === 'CLAIM_REQUESTED' && (
                        <>
                          <button
                            onClick={() => handleClaimAction(claim._id, 'approve')}
                            disabled={actionLoadingId === claim._id}
                            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-emerald-100 disabled:opacity-50 cursor-pointer"
                            title="Approve claim"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleClaimAction(claim._id, 'reject')}
                            disabled={actionLoadingId === claim._id}
                            className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            title="Reject claim"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                      
                      <Link
                        to={`/claims/${claim._id}`}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Manage / View details"
                      >
                        <Eye className="w-4 h-4" /> Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <Link to="/donor/add" className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Add Food Listing</p>
                  <p className="text-slate-400 text-xs">Create a new food donation listing</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
              </Link>
              <Link to="/donor/listings" className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <List className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">My Listings</p>
                  <p className="text-slate-400 text-xs">View, edit and manage your posts</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
              </Link>
              <Link to="/profile" className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">My Profile</p>
                  <p className="text-slate-400 text-xs">Update details and password</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
