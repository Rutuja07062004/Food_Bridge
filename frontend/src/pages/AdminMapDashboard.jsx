import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadGoogleMaps } from '../utils/mapLoader';
import API from '../services/api';
import { ArrowLeft, Shield, MapPin, Loader2, Compass, AlertCircle } from 'lucide-react';

// Fallback Leaflet Map
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AdminMapDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleMaps, setIsGoogleMaps] = useState(false);

  const mapContainerRef = useRef(null);
  const googleMarkersRef = useRef([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch users (to filter NGOs) and all food listings
      const [usersRes, foodRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/food')
      ]);

      if (usersRes.data?.success && foodRes.data?.success) {
        const allUsers = usersRes.data.data || [];
        const ngoUsers = allUsers.filter(u => u.role === 'NGO' && u.latitude && u.longitude);
        setNgos(ngoUsers);

        const activeFoods = (foodRes.data.data || []).filter(
          f => ['AVAILABLE', 'CLAIM_REQUESTED', 'APPROVED', 'READY_FOR_PICKUP', 'COLLECTED'].includes(f.status)
        );
        setListings(activeFoods);

        // Render Google Map once data is loaded
        initGoogleMap(ngoUsers, activeFoods);
      } else {
        setErrorMsg('Failed to load administrative map data.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error contacting server for admin dashboard data.');
      setLoading(false);
    }
  };

  const initGoogleMap = async (ngoData, foodData) => {
    try {
      const google = await loadGoogleMaps();
      setIsGoogleMaps(true);

      const center = { lat: 28.6139, lng: 77.2090 }; // Delhi Center default

      const map = new google.Map(mapContainerRef.current, {
        center: center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Clear old markers
      googleMarkersRef.current.forEach(m => m.setMap(null));
      googleMarkersRef.current = [];

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);

      const infoWindow = new google.maps.InfoWindow();

      // Plot NGOs (Blue markers)
      ngoData.forEach((ngo) => {
        const pos = { lat: ngo.latitude, lng: ngo.longitude };
        bounds.extend(pos);

        const marker = new google.Marker({
          position: pos,
          map: map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          title: ngo.name
        });

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h5 style="margin:0 0 2px 0; font-size:12px; font-weight:800; color:#1e293b;">${ngo.name}</h5>
              <span style="font-size:10px; font-weight:750; color:#2563eb; text-transform:uppercase;">NGO Partner</span>
              <p style="margin:4px 0 0 0; font-size:10px; color:#64748b;">Email: ${ngo.email}</p>
            </div>
          `);
          infoWindow.open(map, marker);
        });

        googleMarkersRef.current.push(marker);
      });

      // Plot Food Listings (Green for AVAILABLE, Amber for Claimed/In Transit)
      foodData.forEach((food) => {
        const lat = parseFloat(food.pickupLocation.latitude || food.pickupLocation.lat);
        const lng = parseFloat(food.pickupLocation.longitude || food.pickupLocation.lng);

        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

        const pos = { lat, lng };
        bounds.extend(pos);

        const isAvailable = food.status === 'AVAILABLE';
        const iconUrl = isAvailable
          ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
          : 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';

        const marker = new google.Marker({
          position: pos,
          map: map,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(32, 32)
          },
          title: food.foodName
        });

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="font-family: sans-serif; padding: 4px; min-width: 140px;">
              <h5 style="margin:0 0 2px 0; font-size:12px; font-weight:800; color:#1e293b;">${food.foodName}</h5>
              <span style="font-size:10px; font-weight:750; color:${isAvailable ? '#10b981' : '#f59e0b'}; text-transform:uppercase;">${food.status}</span>
              <p style="margin:4px 0 0 0; font-size:10px; color:#64748b;">Serves: ${food.servings} people</p>
              <p style="margin:2px 0 0 0; font-size:10px; color:#64748b;">Qty: ${food.quantity}</p>
            </div>
          `);
          infoWindow.open(map, marker);
        });

        googleMarkersRef.current.push(marker);
      });

      // Fit map bounds to show pins
      if (ngoData.length > 0 || foodData.length > 0) {
        map.fitBounds(bounds);
      }

    } catch (err) {
      console.warn('Google AdminMap failed, falling back to Leaflet:', err);
      setIsGoogleMaps(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/admin')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>Map Command Center</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Monitor active donations, NGO partner sites, and claiming activities in real time
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Map Content Box */}
      <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 p-6 rounded-3xl flex flex-col h-[600px]">
        <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Active FoodBridge Logistics Map</span>
          </span>
          <div className="flex gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Available ({listings.filter(l => l.status === 'AVAILABLE').length})
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 py-1 px-2.5 rounded-lg border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Active Claims ({listings.filter(l => l.status !== 'AVAILABLE').length})
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 py-1 px-2.5 rounded-lg border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              NGO Partners ({ngos.length})
            </span>
          </div>
        </h4>

        <div className="flex-1 rounded-2xl overflow-hidden shadow-inner relative bg-slate-50 border border-slate-100">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-xs text-slate-500 font-semibold">Plotting administrative logistics map...</span>
              </div>
            </div>
          )}

          {/* Google Map */}
          <div ref={mapContainerRef} className={`w-full h-full ${isGoogleMaps ? 'block' : 'hidden'}`} />

          {/* Fallback Leaflet Map */}
          {!isGoogleMaps && !loading && (
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Plot NGOs */}
              {ngos.map((ngo, i) => (
                <Marker key={`ngo-${ngo._id}`} position={[ngo.latitude, ngo.longitude]}>
                  <Popup>
                    <div className="text-xs p-1">
                      <h5 className="font-bold text-blue-700 m-0">{ngo.name}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">NGO Partner</span>
                      <p className="text-[10px] m-0 mt-1">Email: {ngo.email}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Plot Listings */}
              {listings.map((food, i) => {
                const lat = parseFloat(food.pickupLocation.latitude || food.pickupLocation.lat);
                const lng = parseFloat(food.pickupLocation.longitude || food.pickupLocation.lng);

                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

                const isAvailable = food.status === 'AVAILABLE';

                return (
                  <Marker key={`food-${food._id}`} position={[lat, lng]}>
                    <Popup>
                      <div className="text-xs p-1">
                        <h5 className="font-bold text-slate-800 m-0">{food.foodName}</h5>
                        <span className={`text-[10px] font-bold block mt-0.5 ${isAvailable ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {food.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          <div>Quantity: <strong>{food.quantity}</strong></div>
                          <div>Serves: <strong>{food.servings} people</strong></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMapDashboard;
