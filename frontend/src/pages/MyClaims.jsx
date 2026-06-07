import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import claimsService from '../services/claimsService';
import {
  ArrowLeft, Search, Filter, Calendar, MapPin, Phone, Mail,
  Clock, CheckCircle, AlertCircle, X, Award, Package, Info, ArrowRight
} from 'lucide-react';

const STATUS_MAP = {
  CLAIM_REQUESTED: { label: 'Pending Approval', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  APPROVED: { label: 'Approved', cls: 'bg-sky-50 border-sky-200 text-sky-700' },
  READY_FOR_PICKUP: { label: 'Ready For Pickup', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse' },
  COLLECTED: { label: 'Collected / In Transit', cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  COMPLETED: { label: 'Completed', cls: 'bg-slate-50 border-slate-200 text-slate-600' },
  REJECTED: { label: 'Rejected', cls: 'bg-rose-50 border-rose-200 text-rose-700' },
  EXPIRED: { label: 'Expired', cls: 'bg-rose-50 border-rose-200 text-rose-600' },
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
};

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Completed', 'Rejected'
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await claimsService.getClaims();
      if (res.success) {
        setClaims(res.data);
      } else {
        setError('Failed to fetch claims.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching your claims.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter(c => {
    // Search filter
    const foodName = c.foodId?.foodName?.toLowerCase() || '';
    const donorName = c.donorId?.name?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    const matchesSearch = foodName.includes(searchLower) || donorName.includes(searchLower);

    // Tab filter
    if (activeTab === 'Completed') {
      return matchesSearch && c.claimStatus === 'COMPLETED';
    }
    if (activeTab === 'Rejected') {
      return matchesSearch && c.claimStatus === 'REJECTED';
    }
    return matchesSearch; // 'All'
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white pt-10 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">
            <Link to="/ngo" className="hover:text-emerald-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white/85">My Claims</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Food Claims</h1>
          <p className="text-slate-400 text-sm mt-1">Track collections, pickup timeline, and view details.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        
        {/* Filters Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto">
            {['All', 'Completed', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'All' ? 'All Claims' : tab === 'Completed' ? 'Completed Collections' : 'Rejected Requests'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search claims by food or donor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all font-semibold"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Claims Table / Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-200 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🗳️</div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">No Claims Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              {search || activeTab !== 'All'
                ? "Try adjusting your filters or search terms."
                : "You haven't claimed any food listings yet. Head to the dashboard to find available food!"}
            </p>
            {search || activeTab !== 'All' ? (
              <button
                onClick={() => { setSearch(''); setActiveTab('All'); }}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/ngo"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-md"
              >
                Browse Listings
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClaims.map((claim) => (
              <Link
                key={claim._id}
                to={`/claims/${claim._id}`}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-emerald-100 transition-all duration-300 flex flex-col justify-between h-full group"
              >
                <div>
                  {/* Card Cover */}
                  <div className="h-36 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden flex-shrink-0">
                    {claim.foodId?.image ? (
                      <img
                        src={getImageUrl(claim.foodId.image)}
                        alt={claim.foodId.foodName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🍛</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-0.5 rounded-full shadow-sm border border-white/50 text-[10px] font-bold text-slate-500">
                      Claim Date: {new Date(claim.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-md">
                        {claim.foodId?.category || 'Veg Meal'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                        STATUS_MAP[claim.claimStatus]?.cls || 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        {STATUS_MAP[claim.claimStatus]?.label || claim.claimStatus?.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 mb-2 truncate group-hover:text-emerald-600 transition-colors">
                      {claim.foodId?.foodName || 'Food Listing Removed'}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-3">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="truncate">Pickup: <span className="text-slate-700">{claim.foodId?.pickupLocation?.address}</span></span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="truncate">Scheduled Time: <span className="text-slate-700">{claim.pickupTime || 'Awaiting Schedule'}</span></span>
                      </p>
                      {claim.donorId && (
                        <p className="flex items-start gap-1.5">
                          <Award className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate">Donor: <span className="text-slate-700">{claim.donorId.name}</span></span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-1">
                  <div className="w-full py-2 bg-slate-50 group-hover:bg-emerald-50 rounded-xl text-center text-xs font-bold text-slate-600 group-hover:text-emerald-700 transition-colors flex items-center justify-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Track Claim Timeline <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClaims;
