import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import mapService from '../services/mapService';
import LocationSearch from '../components/Map/LocationSearch';
import NearbyFoodMap from '../components/Map/NearbyFoodMap';
import {
  MapPin,
  Compass,
  SlidersHorizontal,
  ChevronDown,
  Navigation,
  Loader2,
  Calendar,
  Utensils,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const NearbyFood = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ngoCoords, setNgoCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [address, setAddress] = useState('New Delhi Center');
  
  // Filters
  const [radius, setRadius] = useState(5);
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  
  // Listings and loaders
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial user geolocating on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setNgoCoords(coords);
          setAddress('My Current Location');
          setGpsLoading(false);
          fetchNearbyListings(coords.lat, coords.lng);
        },
        () => {
          setGpsLoading(false);
          // Fallback to New Delhi default
          fetchNearbyListings(28.6139, 77.2090);
        }
      );
    } else {
      fetchNearbyListings(28.6139, 77.2090);
    }
  }, []);

  // Fetch listings from API when filters change
  const fetchNearbyListings = async (latitude, longitude) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await mapService.getNearbyFood({
        latitude: latitude || ngoCoords.lat,
        longitude: longitude || ngoCoords.lng,
        radius,
        sortBy,
        category: category || undefined
      });
      if (res.success) {
        setListings(res.data || []);
      } else {
        setErrorMsg('Failed to search nearby listings.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error retrieving nearby listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyListings(ngoCoords.lat, ngoCoords.lng);
  }, [radius, category, sortBy]);

  // Geocode address when user searches
  const handleAddressSelect = async (selectedAddress) => {
    if (!selectedAddress) return;
    setAddress(selectedAddress);
    setLoading(true);
    try {
      const res = await mapService.resolveLocation(selectedAddress);
      if (res.success) {
        const newCoords = { lat: res.latitude, lng: res.longitude };
        setNgoCoords(newCoords);
        fetchNearbyListings(res.latitude, res.longitude);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to resolve search address.');
      setLoading(false);
    }
  };

  // Re-acquire current location coordinates
  const handleGpsLocate = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setNgoCoords(coords);
        setAddress('My Current Location');
        setGpsLoading(false);
        fetchNearbyListings(coords.lat, coords.lng);
      },
      () => {
        setGpsLoading(false);
        setErrorMsg('Geolocation failed. Please enter location manually.');
      }
    );
  };

  const categoriesList = ['Veg Meal', 'Non-Veg Meal', 'Bakery', 'Groceries', 'Fruits & Vegetables', 'Other'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nearby Donations Map</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Locate active surplus food donations close to your NGO coordinates
          </p>
        </div>
        
        {/* NGO Info */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/50 py-2 px-4 rounded-xl self-start md:self-auto">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Origin: {address}</span>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Parameters, Search & List */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          
          {/* Controls box */}
          <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 p-5 rounded-3xl space-y-4 flex-shrink-0">
            
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <LocationSearch onSelect={handleAddressSelect} initialValue={address === 'My Current Location' ? '' : address} />
              </div>
              <button
                type="button"
                onClick={handleGpsLocate}
                disabled={gpsLoading}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {gpsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5 fill-emerald-700/10" />
                )}
              </button>
            </div>

            {/* Radius and category filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Search Radius</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
                >
                  <option value={2}>Within 2 KM</option>
                  <option value={5}>Within 5 KM</option>
                  <option value={10}>Within 10 KM</option>
                  <option value={20}>Within 20 KM</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
                >
                  <option value="distance">Nearest First</option>
                  <option value="expiryTime">Soonest Expiry</option>
                  <option value="servings">Largest Quantity</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Food Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Categories</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

          </div>

          {/* List panel */}
          <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 p-5 rounded-3xl flex-1 flex flex-col overflow-hidden">
            <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Matching Listings</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 py-0.5 px-2 rounded-full font-bold uppercase tracking-wider">
                {listings.length} Found
              </span>
            </h4>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold mt-3">
                {errorMsg}
              </div>
            )}

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 pr-1 select-text">
              {loading && listings.length === 0 ? (
                <div className="py-20 flex justify-center items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : listings.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Compass className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No nearby donations found</p>
                  <p className="text-[10px] text-slate-400 mt-1">Try expanding your search radius or choosing another category.</p>
                </div>
              ) : (
                listings.map((food) => (
                  <div
                    key={food._id}
                    onClick={() => navigate(`/food/${food._id}`)}
                    className="py-4 hover:bg-slate-50/70 flex gap-3 transition-colors cursor-pointer group rounded-xl px-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600 group-hover:scale-105 transition-transform">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                        {food.foodName}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {food.category} • {food.quantity}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{food.pickupLocation.address}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end flex-shrink-0">
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50/60 py-0.5 px-1.5 rounded-lg">
                        {food.distance} km
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold mt-2">
                        {food.servings} Servings
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Right Side: Map Display */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-xl shadow-slate-100/40 p-5 rounded-3xl h-[calc(100vh-200px)] min-h-[500px] flex flex-col">
          <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600 animate-pulse" />
            <span>Interactive Proximity Map</span>
          </h4>
          <div className="flex-1 rounded-2xl overflow-hidden shadow-inner">
            <NearbyFoodMap
              listings={listings}
              ngoCoords={ngoCoords}
              radius={radius}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default NearbyFood;
