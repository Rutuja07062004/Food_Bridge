import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import claimsService from '../../services/claimsService';
import { X, Calendar, FileText, Phone, User, Info } from 'lucide-react';

const ClaimRequestModal = ({ isOpen, onClose, foodListing, onSubmitSuccess }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [pickupPreference, setPickupPreference] = useState('NGO Pickup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !foodListing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await claimsService.createClaim({
        foodId: foodListing._id,
        notes,
        pickupPreference
      });

      if (res.success) {
        onSubmitSuccess(res.data);
      } else {
        setError(res.message || 'Failed to submit claim request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while submitting claim request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50/30">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800">Request Surplus Food Claim</h3>
            <p className="text-xs text-slate-500 mt-0.5">Confirm organization details and submit request</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex gap-2 font-medium">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Listing Summary */}
          <div className="p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">Food Item</span>
            <h4 className="font-bold text-slate-800 text-sm mt-1">{foodListing.foodName}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{foodListing.quantity} · Serves {foodListing.servings} people</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NGO Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">NGO Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  value={user?.name || ''}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none text-sm font-semibold"
                />
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Person</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  value={user?.contactPerson || user?.name || ''}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  value={user?.phone || ''}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none text-sm font-semibold"
                />
              </div>
            </div>

            {/* Pickup Preference */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pickup Preference</label>
              <select
                value={pickupPreference}
                onChange={(e) => setPickupPreference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white outline-none text-sm font-bold focus:border-emerald-500 transition-colors"
              >
                <option value="NGO Pickup">NGO Pickup (Collect from Donor)</option>
                <option value="Donor Delivery">Donor Delivery (Request Delivery)</option>
              </select>
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Special Notes / Requirements</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                placeholder="Include special notes, diet instructions, preferred timing details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm font-semibold focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 shadow-md shadow-emerald-500/10 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-95 transition-all cursor-pointer"
            >
              {loading ? 'Submitting Request...' : 'Confirm & Request Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimRequestModal;
