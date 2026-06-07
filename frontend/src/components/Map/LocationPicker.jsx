import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/mapLoader';
import mapService from '../../services/mapService';
import LocationSearch from './LocationSearch';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Fallback Leaflet imports in case Google Maps API is not loaded/configured
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LocationPicker = ({
  initialAddress = '',
  initialLat = 28.6139,
  initialLng = 77.2090,
  onChange
}) => {
  const mapContainerRef = useRef(null);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
  const [loading, setLoading] = useState(true);
  const [isGoogleMaps, setIsGoogleMaps] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const googleMapRef = useRef(null);
  const googleMarkerRef = useRef(null);

  // Initialize Maps (Try Google Maps first, fallback to Leaflet on error/no key)
  useEffect(() => {
    let active = true;
    
    const initMaps = async () => {
      setLoading(true);
      try {
        const google = await loadGoogleMaps();
        if (!active) return;
        setIsGoogleMaps(true);

        const latLng = { lat: coordinates.lat, lng: coordinates.lng };
        
        // Create Map
        const map = new google.Map(mapContainerRef.current, {
          center: latLng,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        googleMapRef.current = map;

        // Create Marker
        const marker = new google.Marker({
          position: latLng,
          map: map,
          draggable: true,
          animation: google.Animation.DROP
        });
        googleMarkerRef.current = marker;

        // Marker Drag listener
        marker.addListener('dragend', async () => {
          const pos = marker.getPosition();
          const newCoords = { lat: pos.lat(), lng: pos.lng() };
          setCoordinates(newCoords);
          
          // Reverse geocode or fetch address description
          // For simplicity, we can geocode the coordinates to get the textual address,
          // but if reverse geocoding is unavailable we can keep the current text address
          // or mark it as "Coordinates Selected".
          if (onChange) {
            onChange({
              address: address || 'Dragged Pin Location',
              latitude: newCoords.lat,
              longitude: newCoords.lng,
              lat: newCoords.lat,
              lng: newCoords.lng
            });
          }
        });

        // Map Click listener
        map.addListener('click', (e) => {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          const newCoords = { lat: clickedLat, lng: clickedLng };
          
          setCoordinates(newCoords);
          marker.setPosition(newCoords);
          map.panTo(newCoords);

          if (onChange) {
            onChange({
              address: address || 'Selected Map Point',
              latitude: clickedLat,
              longitude: clickedLng,
              lat: clickedLat,
              lng: clickedLng
            });
          }
        });

      } catch (err) {
        console.warn('Google Maps failed to load, falling back to Leaflet:', err);
        setIsGoogleMaps(false);
      } finally {
        setLoading(false);
      }
    };

    initMaps();

    return () => {
      active = false;
    };
  }, []);

  // Update Google Maps position when coordinates change from outside/search
  const updateGoogleMapsPosition = (lat, lng) => {
    if (googleMapRef.current && googleMarkerRef.current && window.google?.maps) {
      const latLng = new window.google.maps.LatLng(lat, lng);
      googleMapRef.current.setCenter(latLng);
      googleMapRef.current.setZoom(15);
      googleMarkerRef.current.setPosition(latLng);
    }
  };

  // Handle address autocomplete selection
  const handleAddressSelect = async (selectedAddress) => {
    if (!selectedAddress) return;
    setAddress(selectedAddress);
    
    try {
      const res = await mapService.resolveLocation(selectedAddress);
      if (res.success) {
        const newCoords = { lat: res.latitude, lng: res.longitude };
        setCoordinates(newCoords);
        
        if (isGoogleMaps) {
          updateGoogleMapsPosition(res.latitude, res.longitude);
        }

        if (onChange) {
          onChange({
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude,
            lat: res.latitude,
            lng: res.longitude
          });
        }
      }
    } catch (err) {
      console.error('Failed to geocode selected address:', err);
      setErrorMsg('Could not find address coordinates. Try placing a pin on the map.');
    }
  };

  // Live device GPS location retriever
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoordinates(newCoords);
        setAddress('My Current Location');
        
        if (isGoogleMaps) {
          updateGoogleMapsPosition(latitude, longitude);
        }

        if (onChange) {
          onChange({
            address: 'My Current Location',
            latitude,
            longitude,
            lat: latitude,
            lng: longitude
          });
        }
      },
      (error) => {
        console.error('Geolocation acquisition failed:', error);
        setErrorMsg('Unable to retrieve device location.');
      }
    );
  };

  // Leaflet Helper Component to catch Map clicks
  const LeafletMapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setCoordinates({ lat, lng });
        if (onChange) {
          onChange({
            address: address || 'Leaflet Selected Location',
            latitude: lat,
            longitude: lng,
            lat,
            lng
          });
        }
      }
    });
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search Input and Geolocation Trigger */}
      <div className="flex gap-2.5 items-center">
        <div className="flex-1">
          <LocationSearch onSelect={handleAddressSelect} initialValue={address} />
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          title="Use Current Location"
          className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center cursor-pointer transition-all shadow-sm flex-shrink-0"
        >
          <Navigation className="w-5 h-5 fill-emerald-700/10" />
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-semibold px-1">{errorMsg}</p>
      )}

      {/* Map Rendering Container */}
      <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative bg-slate-50">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}

        {/* Google Maps Container */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full ${isGoogleMaps ? 'block' : 'hidden'}`}
        />

        {/* Fallback Leaflet Map */}
        {!isGoogleMaps && !loading && (
          <MapContainer
            center={[coordinates.lat, coordinates.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coordinates.lat, coordinates.lng]} />
            <LeafletMapEvents />
          </MapContainer>
        )}
      </div>

      {/* Coordinate Displays */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Latitude</span>
          <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">{coordinates.lat.toFixed(6)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Longitude</span>
          <span className="text-xs font-extrabold text-slate-700 mt-0.5 block">{coordinates.lng.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
