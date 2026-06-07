import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatCard from '../components/Dashboard/StatCard';
import foodService from '../services/foodService';
import ngoService from '../services/ngoService';
import claimsService from '../services/claimsService';
import FoodHealthIndicator from '../components/Freshness/FoodHealthIndicator';
import {
  Search, Filter, MapPin, Clock, Users, Award, CheckCircle, X,
  AlertCircle, ChevronLeft, ChevronRight, Map, List, Bell, Calendar,
  TrendingUp, Package, Info, ExternalLink, ArrowRight, Shield, RefreshCw, Compass, Navigation
} from 'lucide-react';

const LeafletMap = lazy(() => import('../components/Map/LeafletMap'));

const CATEGORIES = ['All', 'Veg Meal', 'Non-Veg Meal', 'Bakery', 'Groceries', 'Fruits & Vegetables', 'Other'];
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
};

const STATUS_MAP = {
  CLAIM_REQUESTED: { label: 'Pending Approval', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', cls: 'bg-sky-100 text-sky-700' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', cls: 'bg-emerald-100 text-emerald-700 animate-pulse' },
  COLLECTED: { label: 'Collected / In Transit', cls: 'bg-indigo-100 text-indigo-700' },
  COMPLETED: { label: 'Completed', cls: 'bg-slate-100 text-slate-600' },
  REJECTED: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700' },
  EXPIRED: { label: 'Expired', cls: 'bg-rose-100 text-rose-600' },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_MAP[status] || { label: status?.replace('_', ' '), cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${meta.cls}`}>{meta.label}</span>;
};

const CountdownTimer = ({ expiryTime }) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiryTime) - new Date();
      if (diff <= 0) return setRemaining('Expired');
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m left`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [expiryTime]);
  const isUrgent = remaining && remaining !== 'Expired' && parseInt(remaining) < 3;
  return (
    <span className={`text-xs font-semibold flex items-center gap-1 ${remaining === 'Expired' ? 'text-rose-500' : isUrgent ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`}>
      <Clock className="w-3.5 h-3.5" />
      {remaining}
    </span>
  );
};

// --- NGO Dashboard Page ---
const NgoDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, removeNotification } = useSocket();

  const [listings, setListings] = useState([]);
  const [claims, setClaims] = useState([]);
  
  // Filtering & Sorting
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' or 'expiryTime'
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);

  // Notifications Menu state
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        status: 'AVAILABLE',
        page,
        limit: 6,
        category: category !== 'All' ? category : undefined,
        sortBy
      };

      if (search.trim()) {
        params.search = search;
      }
      
      const [foodRes, claimRes] = await Promise.all([
        foodService.getListings(params),
        claimsService.getClaims()
      ]);

      if (foodRes.success) {
        setListings(foodRes.data);
        setPages(foodRes.pages || 1);
        setTotalListings(foodRes.total || 0);
      }
      if (claimRes.success) {
        setClaims(claimRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.status === 'approved') {
      fetchData();
    }
  }, [page, category, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setLocationSearch('');
    setSortBy('createdAt');
    setPage(1);
  };

  // Metrics counts
  const availableCount = totalListings;
  const claimedCount = claims.length;
  const completedCount = claims.filter(c => c.claimStatus === 'COMPLETED' || c.claimStatus === 'COLLECTED').length;
  const pendingCount = claims.filter(c => c.claimStatus === 'CLAIM_REQUESTED' || c.claimStatus === 'APPROVED' || c.claimStatus === 'READY_FOR_PICKUP').length;

  const mapMarkers = listings
    .filter(l => l.pickupLocation?.lat && l.pickupLocation?.lng)
    .map(l => ({
      lat: l.pickupLocation.lat,
      lng: l.pickupLocation.lng,
      address: l.pickupLocation.address,
      title: l.foodName
    }));

  // Filtering listings locally by location search if specified
  const displayedListings = locationSearch
    ? listings.filter(l => l.pickupLocation?.address?.toLowerCase().includes(locationSearch.toLowerCase()))
    : listings;

  if (user?.status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-amber-100 shadow-xl p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">NGO Account Pending</h2>
          <p className="text-slate-500 text-sm">Your organization account is awaiting administrator approval. You'll receive email notification once approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Header Section */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white pt-10 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
              <Award className="w-4 h-4" />
              NGO Control Panel
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Welcome back, <span className="text-emerald-400">{user?.name}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Search, claim, and distribute surplus food donations locally.</p>
          </div>

          {/* Action buttons & Bell notification center */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-white transition-all relative"
                title="Notifications center"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 text-slate-800 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-800">Alerts & Updates</span>
                    <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-slate-50/50 transition-colors relative flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-800 truncate">{n.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{n.message}</p>
                          </div>
                          <button onClick={() => removeNotification(n.id)} className="p-1 text-slate-300 hover:text-slate-500 rounded"><X className="w-3 h-3" /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/ngo/nearby"
                className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-950 transform hover:-translate-y-0.5 text-sm flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>Nearby Map Search</span>
              </Link>
              <Link
                to="/ngo/claims"
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950 transform hover:-translate-y-0.5 text-sm"
              >
                My Claim Collections
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Available Food Listings" value={availableCount} icon={Package} color="emerald" trend="Active food bridge" />
          <StatCard title="Total Claimed Listings" value={claimedCount} icon={Award} color="blue" trend="All claims made" />
          <StatCard title="Completed Collections" value={completedCount} icon={CheckCircle} color="teal" trend="Delivered successfully" />
          <StatCard title="Pending Collections" value={pendingCount} icon={Clock} color="amber" trend="Collections in progress" />
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed Column (2/3 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filters */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Search query */}
                  <div className="relative md:col-span-5">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search food name, description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Location Filter */}
                  <div className="relative md:col-span-4">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by city / location..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="md:col-span-3 flex gap-2 w-full">
                    <button type="submit" className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
                      Search
                    </button>
                    {(search || locationSearch || category !== 'All') && (
                      <button type="button" onClick={handleClearFilters} className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all">
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Category Select */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 outline-none cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Sorting Select */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 outline-none cursor-pointer"
                      >
                        <option value="createdAt">Listed: Newest First</option>
                        <option value="expiryTime">Expiry: Soonest First</option>
                      </select>
                    </div>
                  </div>

                  {/* View mode toggle */}
                  <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" /> Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('map')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Map className="w-3.5 h-3.5" /> Map View
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Map Toggle View */}
            {viewMode === 'map' && (
              <div className="h-96 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                <Suspense fallback={<div className="h-full bg-slate-100 rounded-3xl animate-pulse" />}>
                  <LeafletMap lat={20.5937} lng={78.9629} zoom={5} markers={mapMarkers} />
                </Suspense>
              </div>
            )}

            {/* Listings Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Available Surplus Donations</h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{displayedListings.length} items available</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-80 bg-white rounded-3xl animate-pulse border border-slate-100" />
                  ))}
                </div>
              ) : displayedListings.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                  <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-1">No Surplus Food Available</h3>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-normal">
                    {search || locationSearch
                      ? "No items match your active search filter options."
                      : "We don't have any surplus food listed currently. Check back later!"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {displayedListings.map(item => (
                      <div key={item._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between h-full group">
                        <div>
                          {/* Image Cover */}
                          <div className="h-44 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.foodName}
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl">🍲</div>
                            )}
                            <div className="absolute top-3 left-3">
                              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-emerald-700 shadow-sm">{item.category}</span>
                            </div>
                            {item.freshnessStatus && (
                              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-1.5 py-0.5 rounded-lg shadow-sm border border-white/55">
                                <FoodHealthIndicator status={item.freshnessStatus} showText={true} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Link to={`/food/${item._id}`} className="font-extrabold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-1 flex-1 text-base">
                                {item.foodName}
                              </Link>
                              <CountdownTimer expiryTime={item.expiryTime} />
                            </div>

                            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                              {item.description || 'No description provided.'}
                            </p>

                            <div className="space-y-2 text-xs font-semibold text-slate-500 border-t border-slate-50 pt-3">
                              <p className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <span>Quantity: <strong className="text-slate-800">{item.quantity}</strong></span>
                              </p>
                              <p className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                <span>Servings: <strong className="text-slate-800">Feeds {item.servings} people</strong></span>
                              </p>
                              <p className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">Address: <strong className="text-slate-800">{item.pickupLocation?.address}</strong></span>
                              </p>
                              <p className="text-[10px] text-slate-400">Listed by: {item.donorId?.name || 'Private Donor'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Claim action */}
                        <div className="px-5 pb-5">
                          <Link
                            to={`/food/${item._id}`}
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-50 flex items-center justify-center gap-1 text-center"
                          >
                            View Details & Claim
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-bold text-slate-700">Page {page} of {pages}</span>
                      <button
                        onClick={() => setPage(p => Math.min(pages, p + 1))}
                        disabled={page === pages}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar Panel (1/3 cols) */}
          <div className="space-y-6">
            {/* Quick Actions Panel */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-lg">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/ngo/claims"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all group border border-slate-100 hover:border-emerald-100"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">🗳️</div>
                  <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-800">My Claim History</div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 ml-auto" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all group border border-slate-100 hover:border-emerald-100"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">👤</div>
                  <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-800">Edit NGO Profile</div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 ml-auto" />
                </Link>
              </div>
            </div>

            {/* Recent claims listing */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-lg">Recent Claims</h3>
                <Link to="/ngo/claims" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700">View All</Link>
              </div>

              {claims.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl text-xs font-medium text-slate-400 border border-slate-100/50">
                  No claims registered yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {claims.slice(0, 3).map(c => (
                    <Link
                      key={c._id}
                      to={`/claims/${c._id}`}
                      className="p-3 bg-slate-50 border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/20 rounded-2xl flex items-center gap-3 shadow-inner transition-all block cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm font-bold">🥣</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{c.foodId?.foodName || 'N/A'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{c.foodId?.donorId?.name || 'Private Donor'}</p>
                      </div>
                      <StatusBadge status={c.claimStatus} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NgoDashboard;
