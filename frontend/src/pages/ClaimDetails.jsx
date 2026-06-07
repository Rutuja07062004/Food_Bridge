import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import claimsService from '../services/claimsService';
import ClaimTimeline from '../components/Dashboard/ClaimTimeline';
import {
  ArrowLeft, Calendar, Clock, MapPin, Phone, Mail, User, Info,
  CheckCircle, AlertTriangle, Play, Check, X, Truck, Clipboard, Building
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
};

const ClaimDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Scheduling Form State
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    fetchClaimDetails();
  }, [id]);

  const fetchClaimDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await claimsService.getClaim(id);
      if (res.success) {
        setClaim(res.data);
        if (res.data.pickupDate) {
          setPickupDate(new Date(res.data.pickupDate).toISOString().split('T')[0]);
        }
        setPickupTime(res.data.pickupTime || '');
        setPickupInstructions(res.data.pickupInstructions || '');
      } else {
        setError(res.message || 'Failed to load claim details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while loading claim details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType, payload = null) => {
    setActionLoading(true);
    setError('');
    try {
      let res;
      if (actionType === 'approve') {
        res = await claimsService.approveClaim(id);
      } else if (actionType === 'reject') {
        res = await claimsService.rejectClaim(id);
      } else if (actionType === 'schedule') {
        res = await claimsService.schedulePickup(id, payload);
      } else if (actionType === 'collect') {
        res = await claimsService.markCollected(id);
      } else if (actionType === 'complete') {
        res = await claimsService.confirmCompletion(id);
      }

      if (res?.success) {
        setClaim(res.data);
        setShowScheduleForm(false);
        fetchClaimDetails(); // Refresh populated fields
      } else {
        setError(res?.message || 'Action failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Workflow transition failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!pickupDate || !pickupTime) {
      return alert('Please provide date and time.');
    }
    handleAction('schedule', { pickupDate, pickupTime, pickupInstructions });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-semibold">Retrieving workflow state...</p>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-slate-50">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 flex gap-2 font-bold mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold text-sm text-slate-600 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const food = claim.foodId;
  const ngo = claim.ngoId;
  const donor = claim.donorId;

  const isNgo = user?.role === 'NGO';
  const isDonor = user?.role === 'Donor';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Back Link */}
        <div className="flex justify-between items-center">
          <Link to={isNgo ? "/ngo/claims" : isDonor ? "/donor" : "/admin"} className="flex items-center gap-2 font-extrabold text-sm text-slate-500 hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
            <ArrowLeft className="w-4.5 h-4.5" /> Back to Dashboard
          </Link>
          <span className="text-xs text-slate-400 font-bold">Claim ID: {claim._id}</span>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 flex gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT: Details & Contacts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Food Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Surplus Donation</span>
                  <h2 className="text-xl font-extrabold text-slate-800 mt-2">{food?.foodName || 'Food Listing'}</h2>
                  <p className="text-xs text-slate-500 mt-1">Quantity: {food?.quantity} · Servings: Serves {food?.servings} people</p>
                </div>
                {food?.image && (
                  <img src={getImageUrl(food.image)} alt={food.foodName} className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                {food?.description || 'No description provided.'}
              </p>
            </div>

            {/* NGO & Donor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Donor Contact Details */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Building className="w-4 h-4 text-emerald-500" /> Donor Organization</h4>
                <div className="space-y-3.5 text-xs">
                  <div className="font-bold text-slate-800 text-sm">{donor?.name}</div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5" /> <span>{donor?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5" /> <span>{donor?.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span className="leading-normal">{food?.pickupLocation?.address || donor?.address}</span>
                  </div>
                </div>
              </div>

              {/* NGO Contact Details */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><User className="w-4 h-4 text-emerald-500" /> Claiming NGO</h4>
                <div className="space-y-3.5 text-xs">
                  <div className="font-bold text-slate-800 text-sm">{ngo?.name}</div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5" /> <span>{ngo?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5" /> <span>{ngo?.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-500">
                    <Clipboard className="w-3.5 h-3.5 mt-0.5" /> <span>Preference: {claim.pickupPreference}</span>
                  </div>
                  {claim.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 mt-1">
                      <span className="font-semibold text-slate-600 block mb-0.5">NGO Notes:</span>
                      <p className="text-slate-500 leading-relaxed italic">"{claim.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Contextual Actions Panel */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Available Workflow Actions</h4>
              
              {/* Loading indicator for actions */}
              {actionLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold animate-pulse">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  Processing state changes...
                </div>
              )}

              {/* Donor Actions */}
              {isDonor && !actionLoading && (
                <div className="space-y-4">
                  {claim.claimStatus === 'CLAIM_REQUESTED' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction('approve')}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => handleAction('reject')}
                        className="px-6 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Reject Request
                      </button>
                    </div>
                  )}

                  {claim.claimStatus === 'APPROVED' && !showScheduleForm && (
                    <div>
                      <button
                        onClick={() => setShowScheduleForm(true)}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" /> Schedule Pickup
                      </button>
                      <p className="text-xs text-slate-400 mt-2">Claim request approved! Set date and time guidelines to notify NGO collection.</p>
                    </div>
                  )}

                  {claim.claimStatus === 'COLLECTED' && (
                    <div>
                      <button
                        onClick={() => handleAction('complete')}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Confirm Collection Completion
                      </button>
                      <p className="text-xs text-slate-400 mt-2">Verify that the NGO has successfully collected the surplus servings, completing the donation.</p>
                    </div>
                  )}

                  {/* Empty state action */}
                  {['READY_FOR_PICKUP', 'COMPLETED', 'REJECTED'].includes(claim.claimStatus) && (
                    <p className="text-xs text-slate-400 font-semibold italic">No actions pending. Awaiting NGO pickup status updates.</p>
                  )}
                </div>
              )}

              {/* NGO Actions */}
              {isNgo && !actionLoading && (
                <div>
                  {claim.claimStatus === 'READY_FOR_PICKUP' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAction('collect')}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-4.5 h-4.5" /> Mark As Collected
                      </button>
                      <p className="text-xs text-slate-400">Click once you have arrived and collected the surplus food container.</p>
                    </div>
                  )}

                  {claim.claimStatus === 'CLAIM_REQUESTED' && (
                    <div>
                      <button
                        onClick={() => handleAction('reject')} // rejection on claims controller resets AVAILABLE
                        className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel Claim Request
                      </button>
                    </div>
                  )}

                  {['APPROVED', 'COLLECTED', 'COMPLETED', 'REJECTED'].includes(claim.claimStatus) && (
                    <p className="text-xs text-slate-400 font-semibold italic">
                      {claim.claimStatus === 'APPROVED' ? 'Awaiting donor pickup scheduling.' :
                       claim.claimStatus === 'COLLECTED' ? 'Awaiting donor handover completion verification.' :
                       'Workflow terminated. No further actions required.'}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && !actionLoading && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Admin Controls</span>
                  <div className="flex gap-3">
                    {claim.claimStatus !== 'COMPLETED' && claim.claimStatus !== 'REJECTED' && (
                      <button
                        onClick={() => handleAction('reject')}
                        className="px-5 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel Claim (Override)
                      </button>
                    )}
                    {claim.claimStatus === 'COLLECTED' && (
                      <button
                        onClick={() => handleAction('complete')}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Confirm Completion (Override)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Donor Scheduling Form (In-line block) */}
            {showScheduleForm && (
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800">Set Pickup Details</h4>
                  <button onClick={() => setShowScheduleForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pickup Date</label>
                      <input
                        type="date"
                        required
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pickup Time</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5:00 PM - 6:00 PM"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pickup Instructions</label>
                    <textarea
                      placeholder="Security code, backdoor address, parking guidelines..."
                      rows={2.5}
                      value={pickupInstructions}
                      onChange={(e) => setPickupInstructions(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setShowScheduleForm(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
                      Submit & Ready for Pickup
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* RIGHT: Visual Timeline tracker */}
          <div className="lg:col-span-1">
            <ClaimTimeline
              status={claim.claimStatus}
              pickupDate={claim.pickupDate}
              pickupTime={claim.pickupTime}
              pickupInstructions={claim.pickupInstructions}
              collectedAt={claim.collectedAt}
              completedAt={claim.completedAt}
              createdAt={claim.createdAt}
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default ClaimDetails;
