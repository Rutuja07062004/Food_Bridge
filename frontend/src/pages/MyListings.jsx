import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import foodService from '../services/foodService';
import LocationPicker from '../components/Map/LocationPicker';
import ImageUploader from '../components/Upload/ImageUploader';
import PredictionCard from '../components/Freshness/PredictionCard';
import FoodHealthIndicator from '../components/Freshness/FoodHealthIndicator';
import {
  PlusCircle, Edit, Trash2, CheckCircle, Calendar, MapPin,
  Users, Package, Clock, ArrowLeft, Tag, AlertTriangle,
  Search, Filter, X, ChevronLeft, ChevronRight, Upload,
  Utensils, Phone, Mail, Info, FileText, Sparkles, Thermometer
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const CATEGORIES = ['Veg Meal', 'Non-Veg Meal', 'Bakery', 'Groceries', 'Fruits & Vegetables', 'Other'];

// Helper to get image URL safely (supporting local and Cloudinary absolute URLs)
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
};

const StatusBadge = ({ status }) => {
  const map = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLAIM_REQUESTED: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-sky-100 text-sky-700 border-sky-200',
    READY_FOR_PICKUP: 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse',
    COLLECTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
    EXPIRED: 'bg-rose-100 text-rose-600 border-rose-200',
  };
  const key = status?.toUpperCase();
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize inline-block ${map[key] || map.EXPIRED}`}>
      {status?.toLowerCase()?.replace('_', ' ')}
    </span>
  );
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

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all";

// --- Edit Listing Modal ---
const EditListingModal = ({ food, onClose, onSave }) => {
  const [form, setForm] = useState({
    foodName: food.foodName || '',
    category: food.category || '',
    quantity: food.quantity || '',
    servings: food.servings || '',
    description: food.description || '',
    address: food.pickupLocation?.address || '',
    lat: food.pickupLocation?.lat || food.pickupLocation?.latitude || '',
    lng: food.pickupLocation?.lng || food.pickupLocation?.longitude || '',
    latitude: food.pickupLocation?.latitude || food.pickupLocation?.lat || '',
    longitude: food.pickupLocation?.longitude || food.pickupLocation?.lng || '',
    expiryTime: '',
    status: food.status || 'AVAILABLE',
    preparationDate: '',
    preparationTime: '',
    storageType: food.storageType || 'Room Temperature',
    currentTemperature: food.currentTemperature !== undefined ? food.currentTemperature : 20
  });

  const [images, setImages] = useState(food.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    // Format datetime-local from DB Date string
    if (food.expiryTime) {
      const date = new Date(food.expiryTime);
      const pad = (num) => String(num).padStart(2, '0');
      const yyyy = date.getFullYear();
      const MM = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const mm = pad(date.getMinutes());
      setForm(f => ({ ...f, expiryTime: `${yyyy}-${MM}-${dd}T${hh}:${mm}` }));
    }

    if (food.preparationDate) {
      const date = new Date(food.preparationDate);
      const pad = (num) => String(num).padStart(2, '0');
      const yyyy = date.getFullYear();
      const MM = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      setForm(f => ({
        ...f,
        preparationDate: `${yyyy}-${MM}-${dd}`,
        preparationTime: food.preparationTime || '12:00'
      }));
    } else {
      const date = new Date();
      const pad = (num) => String(num).padStart(2, '0');
      const yyyy = date.getFullYear();
      const MM = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const mm = pad(date.getMinutes());
      setForm(f => ({
        ...f,
        preparationDate: `${yyyy}-${MM}-${dd}`,
        preparationTime: `${hh}:${mm}`
      }));
    }
  }, [food]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleStorageTypeChange = (e) => {
    const type = e.target.value;
    let temp = 20;
    if (type === 'Refrigerated') temp = 4;
    else if (type === 'Frozen') temp = -18;
    
    setForm(f => ({
      ...f,
      storageType: type,
      currentTemperature: temp
    }));
  };

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!form.category || !form.preparationDate) {
        setPrediction(null);
        return;
      }
      setPredicting(true);
      try {
        const res = await foodService.predictFreshness({
          category: form.category,
          preparationDate: form.preparationDate,
          preparationTime: form.preparationTime || '00:00',
          storageType: form.storageType,
          currentTemperature: form.currentTemperature
        });
        if (res.success) {
          setPrediction(res.data);
        }
      } catch (err) {
        console.error('Freshness prediction error in edit modal:', err);
      } finally {
        setPredicting(false);
      }
    };

    const timer = setTimeout(fetchPrediction, 400);
    return () => clearTimeout(timer);
  }, [form.category, form.preparationDate, form.preparationTime, form.storageType, form.currentTemperature]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.foodName || !form.category || !form.quantity || !form.servings ||
        !form.description || !form.address || !form.expiryTime || !form.preparationDate || !form.preparationTime) {
      setError('Please fill in all required fields, including preparation details.');
      return;
    }

    if (new Date(form.expiryTime) <= new Date() && form.status === 'AVAILABLE') {
      setError('Expiry date & time must be in the future for active listings.');
      return;
    }

    setLoading(true);
    try {
      const res = await foodService.updateListing(food._id, {
        ...form,
        images
      });
      if (res.success) {
        onSave();
        onClose();
      } else {
        setError(res.message || 'Failed to update listing.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Edit Food Listing</h2>
            <p className="text-slate-500 text-xs mt-0.5">Modify details for your food contribution</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Image Upload */}
          <Field label="Food Photos">
            <ImageUploader
              initialImages={images}
              onChange={(newImages) => setImages(newImages)}
              maxImages={5}
            />
          </Field>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Food Name" required>
                <input type="text" required value={form.foodName} onChange={set('foodName')} className={inputCls} />
              </Field>
            </div>

            <Field label="Category" required>
              <select required value={form.category} onChange={set('category')} className={inputCls}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Quantity" required>
              <input type="text" required value={form.quantity} onChange={set('quantity')} placeholder="e.g. 3 kg, 20 packets" className={inputCls} />
            </Field>

            <Field label="Servings" required>
              <input type="number" required min="1" value={form.servings} onChange={set('servings')} className={inputCls} />
            </Field>

            <Field label="Expiry Date & Time" required>
              <input type="datetime-local" required value={form.expiryTime} onChange={set('expiryTime')} className={inputCls} />
            </Field>

            {food.status !== 'COMPLETED' && (
              <div className="sm:col-span-2">
                <Field label="Listing Status" required>
                  <select required value={form.status} onChange={set('status')} className={inputCls}>
                    <option value="AVAILABLE">Available (Active)</option>
                    <option value="CLAIM_REQUESTED">Claim Requested</option>
                    <option value="APPROVED">Approved / Active</option>
                    <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                    <option value="COLLECTED">Collected</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </Field>
              </div>
            )}
          </div>

          {/* AI Freshness Inputs & Preview */}
          <div className="border-t border-slate-100 pt-4 mt-2 space-y-4">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" /> AI Freshness Settings
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Preparation Date" required>
                <input
                  type="date"
                  required
                  value={form.preparationDate}
                  onChange={set('preparationDate')}
                  className={inputCls}
                />
              </Field>

              <Field label="Preparation Time" required>
                <input
                  type="time"
                  required
                  value={form.preparationTime}
                  onChange={set('preparationTime')}
                  className={inputCls}
                />
              </Field>

              <Field label="Storage Method" required>
                <select
                  required
                  value={form.storageType}
                  onChange={handleStorageTypeChange}
                  className={inputCls}
                >
                  <option value="Room Temperature">Room Temperature</option>
                  <option value="Refrigerated">Refrigerated (Cold-chain)</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </Field>

              <Field label={`Current Temperature (${form.currentTemperature}°C)`} required>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={form.storageType === 'Frozen' ? -30 : form.storageType === 'Refrigerated' ? -5 : 10}
                    max={form.storageType === 'Frozen' ? 0 : form.storageType === 'Refrigerated' ? 15 : 45}
                    value={form.currentTemperature}
                    onChange={(e) => setForm(f => ({ ...f, currentTemperature: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500 bg-slate-100 rounded-lg appearance-none h-2 cursor-pointer"
                  />
                </div>
              </Field>
            </div>

            {/* Prediction Preview */}
            {prediction ? (
              <div className="mt-2 transition-all duration-300">
                <PredictionCard
                  score={prediction.freshnessScore}
                  status={prediction.freshnessStatus}
                  expiryTime={prediction.predictedExpiryTime}
                  storageType={form.storageType}
                  currentTemperature={form.currentTemperature}
                  preparationDate={form.preparationDate}
                  preparationTime={form.preparationTime}
                  category={form.category}
                  isLivePreview={true}
                />
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center text-slate-400 text-xs">
                Select category and preparation details to preview freshness.
              </div>
            )}
          </div>

          <Field label="Description" required>
            <textarea required rows={3} value={form.description} onChange={set('description')} className={`${inputCls} resize-none`} />
          </Field>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">Pickup Location</h5>
            <LocationPicker
              initialAddress={form.address}
              initialLat={parseFloat(form.lat) || 28.6139}
              initialLng={parseFloat(form.lng) || 77.2090}
              onChange={({ address, latitude, longitude }) => {
                setForm(f => ({
                  ...f,
                  address,
                  lat: latitude,
                  lng: longitude,
                  latitude,
                  longitude
                }));
              }}
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-60 flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [editingListing, setEditingListing] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchListings();
    }
  }, [user, page, category, status]);

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        donorId: user._id,
        page,
        limit: 6,
        category: category !== 'All' ? category : undefined,
        status: status !== 'All' ? status : undefined,
      };

      if (search.trim()) {
        params.search = search;
      }

      const res = await foodService.getListings(params);
      if (res.success) {
        setListings(res.data);
        setPages(res.pages || 1);
        setTotal(res.total || 0);
      } else {
        setError('Failed to fetch food listings.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await foodService.deleteListing(id);
      if (res.success) {
        setSuccess('Listing deleted successfully.');
        // If current page is now empty and we are on page > 1, go back a page
        if (listings.length === 1 && page > 1) {
          setPage(prev => prev - 1);
        } else {
          fetchListings();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete listing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this listing as Completed? (NGO has collected the food)')) return;
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await foodService.completeListing(id);
      if (res.success) {
        setSuccess('Listing successfully completed!');
        fetchListings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete listing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepublish = (food) => {
    setEditingListing(food);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner / Breadcrumbs */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white pt-10 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">
            <Link to="/donor" className="hover:text-emerald-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white/80">My Listings</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Manage Food Listings</h1>
              <p className="text-slate-400 text-sm mt-1">Review status, update details, or create new listings.</p>
            </div>
            <Link
              to="/donor/add"
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900 self-start sm:self-auto transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              List Surplus Food
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search food by name, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative md:col-span-3">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 outline-none text-sm bg-slate-50 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative md:col-span-2">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 outline-none text-sm bg-slate-50 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="AVAILABLE">Available (Active)</option>
                <option value="CLAIM_REQUESTED">Claim Requested</option>
                <option value="APPROVED">Approved / Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 flex gap-2 w-full">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all"
              >
                Search
              </button>
              {(search || category !== 'All' || status !== 'All') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all"
                  title="Clear Filters"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Global Action feedback */}
        {(error || success) && (
          <div className="mb-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Main Grid View */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-200 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🍲</div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">No Listings Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              {search || category !== 'All' || status !== 'All'
                ? "Try expanding your filters or search terms."
                : "You haven't listed any surplus food yet. Share food to make a difference!"}
            </p>
            {search || category !== 'All' || status !== 'All' ? (
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/donor/add"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Add Your First Listing
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {listings.map((item) => (
                <div key={item._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group relative">
                  {/* Card Cover Photo */}
                  <div className="h-48 bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.foodName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">🍲</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full shadow-sm border border-white/55">
                      <StatusBadge status={item.status} />
                    </div>
                    {item.freshnessStatus && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-1.5 py-0.5 rounded-lg shadow-sm border border-white/55">
                        <FoodHealthIndicator status={item.freshnessStatus} showText={true} />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-extrabold text-emerald-600 tracking-wide uppercase">{item.category}</span>
                        {item.status === 'AVAILABLE' && <CountdownTimer expiryTime={item.expiryTime} />}
                      </div>

                      <Link to={`/food/${item._id}`} className="text-lg font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors block">
                        {item.foodName}
                      </Link>

                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                        {item.description || 'No description provided.'}
                      </p>

                      {/* Specs List */}
                      <div className="space-y-2.5 text-xs font-semibold text-slate-500 border-t border-slate-50 pt-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>Quantity: <strong className="text-slate-800">{item.quantity}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal-500 flex-shrink-0" />
                          <span>Servings: <strong className="text-slate-800">Feeds {item.servings} people</strong></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">Address: <strong className="text-slate-800">{item.pickupLocation?.address}</strong></span>
                        </div>

                        {/* Claimed Status details */}
                        {item.status !== 'AVAILABLE' && item.status !== 'EXPIRED' && item.status !== 'COMPLETED' && item.claimedBy && (
                          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-blue-900 space-y-1">
                            <p className="font-extrabold text-[11px] uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5" /> Claimed by NGO
                            </p>
                            <p className="font-bold text-xs text-slate-800">{item.claimedBy.name}</p>
                            <p className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {item.claimedBy.phone || 'No Phone'}
                            </p>
                            <p className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {item.claimedBy.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="border-t border-slate-100 pt-4 flex gap-2 flex-shrink-0">
                      {/* Available status actions */}
                      {item.status === 'AVAILABLE' && (
                        <>
                          <button
                            onClick={() => setEditingListing(item)}
                            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={actionLoading}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-200 flex items-center justify-center"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
 
                      {/* Active workflow statuses */}
                      {item.status !== 'AVAILABLE' && item.status !== 'EXPIRED' && item.status !== 'COMPLETED' && (
                        <Link
                          to={`/food/${item._id}`}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 text-center"
                        >
                          <FileText className="w-3.5 h-3.5" /> Manage Active Claim
                        </Link>
                      )}
 
                      {/* Completed / Expired status actions */}
                      {(item.status === 'COMPLETED' || item.status === 'EXPIRED') && (
                        <>
                          {item.status === 'EXPIRED' && (
                            <button
                              onClick={() => handleRepublish(item)}
                              className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              Republish
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={actionLoading}
                            className="flex-1 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-500 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Post
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-slate-700">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                  disabled={page === pages}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Listing Modal Render */}
      {editingListing && (
        <EditListingModal
          food={editingListing}
          onClose={() => setEditingListing(null)}
          onSave={fetchListings}
        />
      )}
    </div>
  );
};

export default MyListings;
