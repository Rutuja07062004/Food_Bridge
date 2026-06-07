import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/mapLoader';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';

// Fallback Leaflet Map
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = ({
  address = '',
  latitude = 28.6139,
  longitude = 77.2090,
  lat = 28.6139,
  lng = 77.2090,
  zoom = 14
}) => {
  const mapContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleMaps, setIsGoogleMaps] = useState(false);

  const itemLat = parseFloat(latitude || lat);
  const itemLng = parseFloat(longitude || lng);

  useEffect(() => {
    let active = true;

    const initMap = async () => {
      setLoading(true);
      try {
        const google = await loadGoogleMaps();
        if (!active) return;
        setIsGoogleMaps(true);

        const latLng = { lat: itemLat, lng: itemLng };

        const map = new google.Map(mapContainerRef.current, {
          center: latLng,
          zoom: zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        new google.Marker({
          position: latLng,
          map: map,
          title: address || 'Food Pickup Location'
        });

      } catch (err) {
        console.warn('Google MapView failed, falling back to Leaflet:', err);
        setIsGoogleMaps(false);
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(itemLat) && !isNaN(itemLng) && itemLat !== 0 && itemLng !== 0) {
      initMap();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [itemLat, itemLng, zoom]);

  // Deep Link URL to Google Maps web client
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${itemLat},${itemLng}`;

  if (isNaN(itemLat) || isNaN(itemLng) || (itemLat === 0 && itemLng === 0)) {
    return (
      <div className="w-full py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
        <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-xs font-semibold">No location coordinates specified for this listing.</p>
        {address && <p className="text-[11px] mt-1 text-slate-500 font-medium">{address}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Map View Frame */}
      <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative bg-slate-50">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        )}

        {/* Google Map */}
        <div ref={mapContainerRef} className={`w-full h-full ${isGoogleMaps ? 'block' : 'hidden'}`} />

        {/* Leaflet Fallback */}
        {!isGoogleMaps && !loading && (
          <MapContainer
            center={[itemLat, itemLng]}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[itemLat, itemLng]}>
              {address && (
                <Popup>
                  <div className="text-xs font-bold text-slate-700">{address}</div>
                </Popup>
              )}
            </Marker>
          </MapContainer>
        )}
      </div>

      {/* Address & Google Maps link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex items-start gap-2.5 min-w-0">
          <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pickup Address</span>
            <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-normal block truncate max-w-sm sm:max-w-md">
              {address || 'Pickup Point'}
            </span>
          </div>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 py-2 px-3.5 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default MapView;
