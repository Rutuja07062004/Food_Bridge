import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LeafletMap = ({ lat = 20.5937, lng = 78.9629, address = '', zoom = 13, markers = [] }) => {
  const center = [lat, lng];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-100 shadow-sm" style={{ minHeight: '300px' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', minHeight: '300px' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Single marker mode */}
        {markers.length === 0 && lat !== 0 && lng !== 0 && (
          <Marker position={center}>
            <Popup>
              <div className="text-sm font-semibold">{address || 'Pickup Location'}</div>
            </Popup>
          </Marker>
        )}
        {/* Multiple markers mode */}
        {markers.map((m, i) => (
          m.lat && m.lng && m.lat !== 0 && m.lng !== 0 ? (
            <Marker key={i} position={[m.lat, m.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{m.title || 'Food Available'}</p>
                  <p className="text-slate-600">{m.address}</p>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
