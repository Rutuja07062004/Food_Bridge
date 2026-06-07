import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/mapLoader';
import mapService from '../../services/mapService';
import { Navigation, Clock, MapPin, Loader2, ArrowRight } from 'lucide-react';

// Fallback Leaflet Map
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DirectionsMap = ({
  ngoCoords,    // { lat: Number, lng: Number } or { latitude: Number, longitude: Number }
  donorCoords,  // { lat: Number, lng: Number } or { latitude: Number, longitude: Number }
  ngoName = 'NGO Location',
  donorName = 'Donor Location'
}) => {
  const mapContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [directionsData, setDirectionsData] = useState(null);
  const [isGoogleMaps, setIsGoogleMaps] = useState(false);

  const nLat = parseFloat(ngoCoords?.latitude || ngoCoords?.lat);
  const nLng = parseFloat(ngoCoords?.longitude || ngoCoords?.lng);
  const dLat = parseFloat(donorCoords?.latitude || donorCoords?.lat);
  const dLng = parseFloat(donorCoords?.longitude || donorCoords?.lng);

  useEffect(() => {
    let active = true;

    const fetchDirectionsAndRender = async () => {
      if (isNaN(nLat) || isNaN(nLng) || isNaN(dLat) || isNaN(dLng)) {
        setErrorMsg('Invalid coordinates provided for routing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg('');

      try {
        const originStr = `${nLat},${nLng}`;
        const destStr = `${dLat},${dLng}`;
        const res = await mapService.getDirections(originStr, destStr);

        if (!active) return;

        if (res.success) {
          setDirectionsData(res);

          // Now draw Google Map if SDK is available
          try {
            const google = await loadGoogleMaps();
            if (!active) return;
            setIsGoogleMaps(true);

            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: nLat, lng: nLng });
            bounds.extend({ lat: dLat, lng: dLng });

            const map = new google.Map(mapContainerRef.current, {
              mapTypeControl: false,
              streetViewControl: false,
              zoomControl: true,
            });
            map.fitBounds(bounds);

            // NGO Marker (Origin)
            new google.Marker({
              position: { lat: nLat, lng: nLng },
              map: map,
              label: 'A',
              title: ngoName
            });

            // Donor Marker (Destination)
            new google.Marker({
              position: { lat: dLat, lng: dLng },
              map: map,
              label: 'B',
              title: donorName
            });

            // Draw Route Polyline
            const pathPoints = res.overview_path.map(p => ({ lat: p.lat, lng: p.lng }));
            const routeLine = new google.maps.Polyline({
              path: pathPoints,
              geodesic: true,
              strokeColor: '#10b981', // emerald-500
              strokeOpacity: 0.85,
              strokeWeight: 5,
            });
            routeLine.setMap(map);

          } catch (googleErr) {
            console.warn('Google Maps SDK directions fail, drawing Leaflet:', googleErr);
            setIsGoogleMaps(false);
          }
        } else {
          setErrorMsg('Failed to resolve route. Please try again.');
        }
      } catch (err) {
        console.error('Directions loading failed:', err);
        setErrorMsg(err.response?.data?.message || 'Error communicating with directions service.');
      } finally {
        setLoading(false);
      }
    };

    fetchDirectionsAndRender();

    return () => {
      active = false;
    };
  }, [nLat, nLng, dLat, dLng]);

  if (errorMsg) {
    return (
      <div className="p-6 text-center bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold">
        {errorMsg}
      </div>
    );
  }

  // Path coordinates for Leaflet polyline
  const leafletPolylinePoints = directionsData?.overview_path?.map(p => [p.lat, p.lng]) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Map Column */}
      <div className="md:col-span-2 space-y-4">
        <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative bg-slate-50">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          )}

          {/* Google Map */}
          <div ref={mapContainerRef} className={`w-full h-full ${isGoogleMaps ? 'block' : 'hidden'}`} />

          {/* Leaflet Map */}
          {!isGoogleMaps && !loading && directionsData && (
            <MapContainer
              bounds={[[nLat, nLng], [dLat, dLng]]}
              boundsOptions={{ padding: [30, 30] }}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[nLat, nLng]}>
                <Popup><div className="text-xs font-bold">{ngoName}</div></Popup>
              </Marker>
              <Marker position={[dLat, dLng]}>
                <Popup><div className="text-xs font-bold">{donorName}</div></Popup>
              </Marker>
              <Polyline positions={leafletPolylinePoints} color="#10b981" weight={5} opacity={0.8} />
            </MapContainer>
          )}
        </div>

        {/* Route Stats Summary */}
        {directionsData && (
          <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Distance</span>
                <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">{directionsData.distance}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duration</span>
                <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">{directionsData.duration}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Directions Panel Column */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col h-80 sm:h-96">
        <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Turn-by-Turn Guide</span>
        </h4>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 pr-1 select-text">
            {directionsData?.steps?.length > 0 ? (
              directionsData.steps.map((step, idx) => (
                <div key={idx} className="py-3 text-xs leading-relaxed flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-slate-50 border border-slate-200/60 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-slate-600 font-semibold"
                      dangerouslySetInnerHTML={{ __html: step.html_instructions }}
                    />
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                      <span>{step.distance}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span>{step.duration}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs font-semibold">No steps loaded.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectionsMap;
