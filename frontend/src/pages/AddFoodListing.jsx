import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import foodService from '../services/foodService';
import LocationPicker from '../components/Map/LocationPicker';
import ImageUploader from '../components/Upload/ImageUploader';
import PredictionCard from '../components/Freshness/PredictionCard';
import {
  ArrowLeft, Upload, Utensils, MapPin, Calendar,
  Users, Package, Tag, FileText, AlertCircle, CheckCircle,
  Sparkles, Clock, Thermometer
} from 'lucide-react';

const CATEGORIES = ['Veg Meal', 'Non-Veg Meal', 'Bakery', 'Groceries', 'Fruits & Vegetables', 'Other'];

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-slate-50 focus:bg-white transition-all";

const AddFoodListing = () => {
  const navigate = useNavigate();

  // Helper to format today's date
  const getTodayDateStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Helper to format current time
  const getCurrentTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [form, setForm] = useState({
    foodName: '', category: '', quantity: '', servings: '',
    description: '', address: '', lat: '', lng: '', latitude: '', longitude: '', expiryTime: '',
    preparationDate: getTodayDateStr(),
    preparationTime: getCurrentTimeStr(),
    storageType: 'Room Temperature',
    currentTemperature: 20
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

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
        console.error('Freshness prediction error:', err);
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

    // Basic validation
    if (!form.foodName || !form.category || !form.quantity || !form.servings ||
        !form.description || !form.address || !form.expiryTime || !form.preparationDate || !form.preparationTime) {
      setError('Please fill in all required fields, including preparation details.');
      return;
    }
    if (new Date(form.expiryTime) <= new Date()) {
      setError('Expiry date & time must be in the future.');
      return;
    }

    setLoading(true);
    try {
      const res = await foodService.createListing({
        ...form,
        images
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate('/donor/listings'), 1800);
      } else {
        setError(res.message || 'Failed to create listing.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm text-center border border-emerald-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Listing Created!</h2>
          <p className="text-slate-500 text-sm">Your food listing has been published. Redirecting to your listings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-100 py-5 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/donor" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Add Food Listing</h1>
            <p className="text-slate-400 text-xs mt-0.5">Fill in the details below to list surplus food for redistribution</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-500" /> Food Photos
            </h2>
            <ImageUploader
              initialImages={images}
              onChange={(newImages) => setImages(newImages)}
              maxImages={5}
            />
          </div>

          {/* Food Details */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-500" /> Food Details
            </h2>

            <Field label="Food Name" required>
              <input
                type="text" required value={form.foodName} onChange={set('foodName')}
                placeholder="e.g. Dal Makhani & Rice, Assorted Pastries"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Category" required>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select required value={form.category} onChange={set('category')} className={`${inputCls} pl-10 appearance-none`}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </Field>

              <Field label="Quantity" required>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required value={form.quantity} onChange={set('quantity')}
                    placeholder="e.g. 5 kg, 3 trays, 10 boxes"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Number of Servings" required>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number" required min="1" value={form.servings} onChange={set('servings')}
                    placeholder="e.g. 30"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Expiry Date & Time" required>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local" required value={form.expiryTime} onChange={set('expiryTime')}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </Field>
            </div>

            <Field label="Description" required>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  required rows={3} value={form.description} onChange={set('description')}
                  placeholder="Describe the food — preparation method, ingredients, storage instructions, allergens…"
                  className={`${inputCls} pl-10 resize-none`}
                />
              </div>
            </Field>
          </div>

          {/* AI Freshness Inputs & Preview */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" /> AI Freshness Prediction
            </h2>
            <p className="text-xs text-slate-500">
              Provide preparation details and storage conditions to calculate estimated freshness and safe consumption windows.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Preparation Date" required>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={form.preparationDate}
                    onChange={set('preparationDate')}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Preparation Time" required>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    required
                    value={form.preparationTime}
                    onChange={set('preparationTime')}
                    className={`${inputCls} pl-10`}
                  />
                </div>
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
                  <Thermometer className="w-5 h-5 text-slate-400" />
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

            {/* Prediction Card Preview */}
            {prediction ? (
              <div className="mt-4 transition-all duration-300">
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
              <div className="border border-dashed border-slate-200 rounded-3xl p-6 text-center text-slate-400 text-xs">
                {form.category && form.preparationDate ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-purple-500 rounded-full animate-spin" />
                    Calculating freshness predictions...
                  </div>
                ) : (
                  "Select a category and preparation date/time above to view freshness prediction preview."
                )}
              </div>
            )}
          </div>

          {/* Pickup Location */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Pickup Location
            </h2>

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

          {/* Submit */}
          <div className="flex gap-4 pb-2">
            <Link
              to="/donor"
              className="flex-1 py-3.5 text-center rounded-2xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Utensils className="w-4 h-4" />
                  Publish Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodListing;
