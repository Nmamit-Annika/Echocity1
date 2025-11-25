import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { toast } from 'sonner';

interface CityMapProps {
  complaints?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    status: string;
    description?: string;
    address?: string;
    categories?: {
      name: string;
      icon: string;
    };
    profiles?: {
      full_name: string;
    };
  }>;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  center?: [number, number]; // [lng, lat] for compatibility with previous prop
  showAllComplaints?: boolean;
}

// Fix default icon paths when bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// NMAMIT Nitte, Karkala coordinates: 13.1849° N, 74.9922° E
const NMAMIT_CENTER: [number, number] = [13.1849, 74.9922];

function LocationMarker({ onLocationFound }: { onLocationFound?: (center: [number, number]) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const map = useMapEvents({
    locationfound(e) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      map.flyTo(newPosition, 13);
      onLocationFound?.(newPosition);
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : (
    <CircleMarker 
      center={position} 
      pathOptions={{ 
        color: 'blue', 
        fillColor: 'blue', 
        fillOpacity: 0.8,
        radius: 8,
        weight: 2
      }}
    >
      <Popup>You are here</Popup>
    </CircleMarker>
  );
}

function ClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      if (!onLocationSelect) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          {
            headers: { 'User-Agent': 'echocity/0.1 (+https://example.com)' },
          }
        );
        const data = await res.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(lat, lng, address);
      } catch (err) {
        toast.error('Failed to lookup address');
        onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    },
  });

  return null;
}

export function CityMap({ complaints = [], onLocationSelect, center }: CityMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(NMAMIT_CENTER);

  // Try to get user's current location on mount
  useEffect(() => {
    if (center) {
      // If center prop provided, use it (convert from [lng, lat] to [lat, lng])
      setMapCenter([center[1], center[0]]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setMapCenter(userLocation);
        },
        (error) => {
          console.log('Geolocation error, using NMAMIT Nitte as default:', error);
          // Stay with NMAMIT_CENTER as fallback
        }
      );
    }
  }, [center]);

  const complaintsWithCoords = complaints.filter(c => {
    const hasCoords = c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude);
    if (!hasCoords && complaints.length < 10) {
      console.log('Complaint missing coordinates:', c.title, c.latitude, c.longitude);
    }
    return hasCoords;
  });

  useEffect(() => {
    // no-op; placeholder for potential future side-effects
  }, []);

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#3b82f6',
    in_progress: '#3b82f6',
    'pending-verification': '#a855f7',
    resolved: '#10b981',
    rejected: '#ef4444',
    reopened: '#f97316',
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker onLocationFound={setMapCenter} />

        {complaintsWithCoords.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.latitude, c.longitude]}
            pathOptions={{ 
              color: statusColors[c.status] || '#6b7280', 
              fillColor: statusColors[c.status] || '#6b7280', 
              fillOpacity: 1,
              radius: 8,
              weight: 3
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.status}</p>
                <p className="text-xs text-gray-500">{c.address || 'No address'}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {onLocationSelect && <ClickHandler onLocationSelect={onLocationSelect} />}
      </MapContainer>
    </div>
  );
}