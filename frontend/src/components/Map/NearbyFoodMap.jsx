import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/mapLoader';
import { Link } from 'react-router-dom';
import { MapPin, Utensils, Heart, Info, ArrowRight } from 'lucide-react';

// Fallback Leaflet Map
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const NearbyFoodMap = ({
  listings = [],
  ngoCoords,
  radius = 5,
  onMarkerClick
}) => {
  const mapContainerRef = useRef(null);
  const [isGoogleMaps, setIsGoogleMaps] = useState(false);
  const [loading, setLoading] = useState(true);

  const nLat = parseFloat(ngoCoords?.latitude || ngoCoords?.lat) || 28.6139;
  const nLng = parseFloat(ngoCoords?.longitude || ngoCoords?.lng) || 77.2090;

  const googleMarkersRef = useRef([]);
  const googleCircleRef = useRef(null);
  const googleMapRef = useRef(null);

  useEffect(() => {
    let active = true;

    const initMap = async () => {
      setLoading(true);
      try {
        const google = await loadGoogleMaps();
        if (!active) return;
        setIsGoogleMaps(true);

        const centerLatLng = { lat: nLat, lng: nLng };

        // Create Map
        const map = new google.Map(mapContainerRef.current, {
          center: centerLatLng,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        googleMapRef.current = map;

        // Clear existing markers
        googleMarkersRef.current.forEach(m => m.setMap(null));
        googleMarkersRef.current = [];

        // NGO Home Marker (Origin)
        const ngoMarker = new google.Marker({
          position: centerLatLng,
          map: map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          title: 'My Current Location'
        });
        googleMarkersRef.current.push(ngoMarker);

        // Draw Search Radius Circle (radius is in km, google Circle uses meters)
        if (googleCircleRef.current) {
          googleCircleRef.current.setMap(null);
        }
        const radiusCircle = new google.maps.Circle({
          strokeColor: '#10b981', // emerald-500
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillColor: '#10b981',
          fillOpacity: 0.1,
          map: map,
          center: centerLatLng,
          radius: radius * 1000
        });
        googleCircleRef.current = radiusCircle;

        // Add pins for nearby donations
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(centerLatLng);

        const infoWindow = new google.maps.InfoWindow();

        listings.forEach((food) => {
          const fLat = parseFloat(food.pickupLocation.latitude || food.pickupLocation.lat);
          const fLng = parseFloat(food.pickupLocation.longitude || food.pickupLocation.lng);

          if (isNaN(fLat) || isNaN(fLng) || fLat === 0 || fLng === 0) return;

          const foodLatLng = { lat: fLat, lng: fLng };
          bounds.extend(foodLatLng);

          const foodMarker = new google.Marker({
            position: foodLatLng,
            map: map,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            },
            title: food.foodName
          });

          // Marker Click -> Show dynamic HTML details popup box
          foodMarker.addListener('click', () => {
            const htmlContent = `
              <div style="font-family: sans-serif; padding: 6px; min-width: 180px;">
                <h5 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #1e293b;">${food.foodName}</h5>
                <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 700; color: #10b981; text-transform: uppercase;">${food.category}</p>
                <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
                  <div>Qty: <strong>${food.quantity}</strong></div>
                  <div>Serves: <strong>${food.servings} people</strong></div>
                  <div style="margin-top: 3px; font-size: 9px; color: #94a3b8;">Dist: <strong>${food.distance} km away</strong></div>
                </div>
                <a href="/food/${food._id}" style="display: block; text-align: center; text-decoration: none; background-color: #10b981; color: white; padding: 5px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">View Listing Details</a>
              </div>
            `;
            infoWindow.setContent(htmlContent);
            infoWindow.open(map, foodMarker);
            if (onMarkerClick) onMarkerClick(food);
          });

          googleMarkersRef.current.push(foodMarker);
        });

        // Fit map bounds to show pins (only if we have listings)
        if (listings.length > 0) {
          map.fitBounds(bounds);
        } else {
          // Fit circle zoom
          map.fitBounds(radiusCircle.getBounds());
        }

      } catch (err) {
        console.warn('Google NearbyFoodMap failed, falling back to Leaflet:', err);
        setIsGoogleMaps(false);
      } finally {
        setLoading(false);
      }
    };

    initMap();

    return () => {
      active = false;
    };
  }, [listings, nLat, nLng, radius]);

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative bg-slate-50">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-xs text-slate-500 font-semibold">Resolving map pins...</span>
          </div>
        </div>
      )}

      {/* Google Map */}
      <div ref={mapContainerRef} className={`w-full h-full ${isGoogleMaps ? 'block' : 'hidden'}`} />

      {/* Leaflet Fallback Map */}
      {!isGoogleMaps && !loading && (
        <MapContainer
          center={[nLat, nLng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* NGO Marker */}
          <Marker position={[nLat, nLng]}>
            <Popup><div className="text-xs font-bold text-sky-700">My Location</div></Popup>
          </Marker>

          {/* Radius Circle */}
          <Circle
            center={[nLat, nLng]}
            radius={radius * 1000}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1 }}
          />

          {/* Listings Markers */}
          {listings.map((food, i) => {
            const fLat = parseFloat(food.pickupLocation.latitude || food.pickupLocation.lat);
            const fLng = parseFloat(food.pickupLocation.longitude || food.pickupLocation.lng);

            if (isNaN(fLat) || isNaN(fLng) || fLat === 0 || fLng === 0) return null;

            return (
              <Marker key={food._id || i} position={[fLat, fLng]}>
                <Popup>
                  <div className="text-xs p-1 min-w-[140px]">
                    <h5 className="font-bold text-slate-800 m-0">{food.foodName}</h5>
                    <p className="text-[10px] text-emerald-600 font-semibold m-0 mt-0.5 uppercase">{food.category}</p>
                    <div className="text-[10px] text-slate-500 mt-1">
                      <div>Quantity: <strong>{food.quantity}</strong></div>
                      <div>Servings: <strong>{food.servings} servings</strong></div>
                      <div className="mt-1 font-bold text-slate-400">{food.distance} km away</div>
                    </div>
                    <Link
                      to={`/food/${food._id}`}
                      className="mt-2.5 block text-center py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
};

export default NearbyFoodMap;
