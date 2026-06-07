import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import foodService from '../services/foodService';
import claimsService from '../services/claimsService';
import MapView from '../components/Map/MapView';
import DirectionsMap from '../components/Map/DirectionsMap';
import ClaimRequestModal from '../components/Dashboard/ClaimRequestModal';
import FreshnessMeter from '../components/Freshness/FreshnessMeter';
import PredictionCard from '../components/Freshness/PredictionCard';
import { 
  ArrowLeft, Utensils, Calendar, Users, MapPin, Phone, Mail, 
  Clock, CheckCircle, ShieldAlert, Award, ChevronRight, AlertTriangle, Navigation,
  Sparkles
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const StatusBadge = ({ status }) => {
  const map = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLAIM_REQUESTED: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    READY_FOR_PICKUP: 'bg-sky-100 text-sky-700 border-sky-200 border-sky-300',
    COLLECTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
    EXPIRED: 'bg-rose-100 text-rose-600 border-rose-200',
  };
  return (
    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize inline-block ${map[status?.toUpperCase()] || map.EXPIRED}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const FoodDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimId, setClaimId] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchListing();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await foodService.getListing(id);
      if (res.success) {
        setListing(res.data);
        startCountdown(res.data.expiryTime);
        
        // Find associated active claim if the listing is claimed/approved/etc.
        if (res.data.status !== 'AVAILABLE') {
          try {
            const claimsRes = await claimsService.getClaims();
            if (claimsRes.success) {
              const activeClaim = claimsRes.data.find(
                c => c.foodId?._id === res.data._id && c.claimStatus !== 'REJECTED' && c.claimStatus !== 'CANCELLED'
              );
              if (activeClaim) {
                setClaimId(activeClaim._id);
              }
            }
          } catch (claimsErr) {
            console.error('Correlation claims check failed:', claimsErr);
          }
        }

        // Initialize pickupTime default to 1 hour from now
        const defaultPickup = new Date();
        defaultPickup.setHours(defaultPickup.getHours() + 1);
        setPickupTime(defaultPickup.toISOString().slice(0, 16));
      } else {
        setError(res.message || 'Failed to retrieve food details');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching listing details.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (expiryDateString) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const calculateTime = () => {
      const diff = new Date(expiryDateString) - new Date();
      if (diff <= 0) {
        setTimeRemaining('Expired');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeStr = '';
      if (hours > 0) timeStr += `${hours}h `;
      timeStr += `${minutes}m ${seconds}s`;
      setTimeRemaining(timeStr);
    };

    calculateTime();
    timerRef.current = setInterval(calculateTime, 1000);
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!pickupTime) return alert('Please enter estimated pickup time');
    
    setClaimLoading(true);
    setError('');
    try {
      const res = await foodService.claimListing(listing._id, pickupTime);
      if (res.success) {
        setClaimSuccess(true);
        // Refresh listing details
        await fetchListing();
      } else {
        setError(res.message || 'Claim failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim this listing.');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to mark this listing as Completed?')) return;
    setClaimLoading(true);
    try {
      const res = await foodService.completeListing(listing._id);
      if (res.success) {
        await fetchListing();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete listing');
    } finally {
      setClaimLoading(false);
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'Admin') return '/admin';
    if (user.role === 'Donor') return '/donor';
    return '/ngo';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Fetching listing details...</p>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center text-rose-500 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Listing</h2>
        <p className="text-slate-500 max-w-md mb-6">{error}</p>
        <Link to={getDashboardPath()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold transition-all hover:bg-slate-800">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const displayImages = listing.images && listing.images.length > 0
    ? listing.images.map(img => img.url)
    : (listing.image ? [listing.image] : []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Detail Header / Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to={getDashboardPath()} className="hover:text-slate-600 capitalize">{user?.role} Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600">Food Listing</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-700 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {claimSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-emerald-800 flex items-start gap-4 shadow-sm">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-base mb-1">Food Listing Claimed Successfully!</h4>
              <p className="text-emerald-700 text-sm">
                The food donor has been notified of your claim. Please arrive at the scheduled pickup address within the expiration time limit.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ─── LEFT COLUMN: FOOD DETAILS & SPECIFICATIONS (2/3 cols) ─── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Listing Card */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              {/* Image Gallery */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden flex flex-col">
                <div className="h-96 md:h-[420px] relative w-full overflow-hidden bg-slate-100">
                  {displayImages.length > 0 ? (
                    <img 
                      src={displayImages[activeImageIndex].startsWith('http') ? displayImages[activeImageIndex] : `${API_BASE}${displayImages[activeImageIndex]}`} 
                      alt={listing.foodName} 
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">🍱</div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-1 rounded-2xl shadow-md border border-white/50">
                    <StatusBadge status={listing.status} />
                  </div>
                </div>

                {/* Thumbnails Row */}
                {displayImages.length > 1 && (
                  <div className="flex gap-2 p-4 bg-white border-t border-slate-100 overflow-x-auto">
                    {displayImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          idx === activeImageIndex ? 'border-emerald-500 scale-105 shadow-sm' : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`}
                          alt={`thumbnail-${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Stats */}
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{listing.foodName}</h1>
                  <div className="flex flex-wrap gap-2.5 items-center mt-3.5">
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                      {listing.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-semibold text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Listed {new Date(listing.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-6">
                  <div className="text-center md:text-left">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</div>
                    <div className="text-lg md:text-xl font-extrabold text-slate-800 mt-1 flex items-center gap-1.5 justify-center md:justify-start">
                      <Utensils className="w-4.5 h-4.5 text-emerald-500" />
                      {listing.quantity}
                    </div>
                  </div>
                  <div className="text-center md:text-left border-x border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Servings</div>
                    <div className="text-lg md:text-xl font-extrabold text-slate-800 mt-1 flex items-center gap-1.5 justify-center md:justify-start">
                      <Users className="w-4.5 h-4.5 text-teal-500" />
                      Feeds {listing.servings}
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Countdown</div>
                    <div className={`text-lg md:text-xl font-extrabold mt-1 flex items-center gap-1.5 justify-center md:justify-start ${
                      timeRemaining === 'Expired' ? 'text-rose-600' : 'text-amber-500 animate-pulse'
                    }`}>
                      <Clock className="w-4.5 h-4.5" />
                      {timeRemaining}
                    </div>
                  </div>
                </div>

                {/* AI Freshness Insights Section */}
                {listing.preparationDate && (
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" /> Food Safety & Freshness Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      <div className="md:col-span-1 flex items-stretch">
                        <FreshnessMeter score={listing.freshnessScore} />
                      </div>
                      <div className="md:col-span-2">
                        <PredictionCard
                          score={listing.freshnessScore}
                          status={listing.freshnessStatus}
                          expiryTime={listing.predictedExpiryTime}
                          storageType={listing.storageType}
                          currentTemperature={listing.currentTemperature}
                          preparationDate={listing.preparationDate}
                          preparationTime={listing.preparationTime}
                          category={listing.category}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Description & Care Instructions</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    {listing.description || 'No additional instructions provided.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: DONOR DETAILS & MAP / ACTION PANEL (1/3 cols) ─── */}
          <div className="space-y-6">
            
            {/* NGO Claim Action Card (If role is NGO) */}
            {user?.role === 'NGO' && listing.status === 'AVAILABLE' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl" />
                <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  Claim Food Listing
                </h3>
                <p className="text-slate-500 text-xs mb-5">Submit a redistribution claim request for this surplus food.</p>
                <button
                  onClick={() => setIsClaimModalOpen(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Request Surplus Claim
                </button>
              </div>
            )}

            {/* NGO Viewing Active Claim Progress */}
            {user?.role === 'NGO' && listing.status !== 'AVAILABLE' && listing.status !== 'EXPIRED' && claimId && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Claim Status: Active</h3>
                <p className="text-slate-500 text-xs mb-5">
                  You have requested/claimed this listing. View the tracking timeline and scheduling instructions.
                </p>
                <Link
                  to={`/claims/${claimId}`}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  Track Claim & Timeline
                </Link>
              </div>
            )}

            {/* Donor / Admin Viewing Claim Progress */}
            {(((user?.role === 'Donor' && listing.donorId?._id === user._id) || user?.role === 'Admin')) && listing.status !== 'AVAILABLE' && listing.status !== 'EXPIRED' && claimId && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Claim Status: Active Claim</h3>
                <p className="text-slate-500 text-xs mb-5">
                  This surplus food listing has been claimed. View the NGO details and schedule pickup times.
                </p>
                <Link
                  to={`/claims/${claimId}`}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  Manage Active Claim
                </Link>
              </div>
            )}

            {/* Donor / Business Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-lg bg-emerald-500" />
                Donor Information
              </h3>
              
              <div className="space-y-4 text-sm font-medium">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Business Name</div>
                    <div className="text-slate-800 font-bold mt-0.5">{listing.donorId?.name || 'Private Donor'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Contact Phone</div>
                    <div className="text-slate-800 font-bold mt-0.5">
                      {listing.donorId?.phone || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Email Address</div>
                    <div className="text-slate-800 font-bold mt-0.5">{listing.donorId?.email || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Pickup Address</div>
                    <div className="text-slate-800 font-bold mt-0.5 leading-relaxed">
                      {listing.pickupLocation?.address || 'No address specified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map Widget */}
            {listing.pickupLocation && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    Exact Pickup Location
                  </span>
                  {user?.role === 'NGO' && (
                    <button
                      onClick={() => setShowDirections(!showDirections)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{showDirections ? 'Hide Directions' : 'Get Directions'}</span>
                    </button>
                  )}
                </h3>
                
                {showDirections && user?.role === 'NGO' ? (
                  <DirectionsMap
                    ngoCoords={{
                      lat: user.latitude || 28.6139,
                      lng: user.longitude || 77.2090
                    }}
                    donorCoords={{
                      lat: listing.pickupLocation.latitude || listing.pickupLocation.lat,
                      lng: listing.pickupLocation.longitude || listing.pickupLocation.lng
                    }}
                    ngoName={user.name}
                    donorName={listing.donorId?.name || 'Donor Location'}
                  />
                ) : (
                  <MapView 
                    latitude={listing.pickupLocation.latitude || listing.pickupLocation.lat || 28.6139} 
                    longitude={listing.pickupLocation.longitude || listing.pickupLocation.lng || 77.2090} 
                    address={listing.pickupLocation.address}
                    zoom={15}
                  />
                )}
              </div>
            )}

          </div>

        </div>
      </div>
      <ClaimRequestModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        foodListing={listing}
        onSubmitSuccess={(newClaim) => {
          setIsClaimModalOpen(false);
          navigate(`/claims/${newClaim._id}`);
        }}
      />
    </div>
  );
};

export default FoodDetails;
