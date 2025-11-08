import { useEffect } from 'react';
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

function ClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    click: async (e: L.LeafletMouseEvent) => {
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

export function CityMap({ complaints = [], onLocationSelect, center = [72.8777, 19.0760] }: CityMapProps) {
  // Previous center prop was [lng, lat] for Mapbox; Leaflet expects [lat, lng]
  const leafletCenter: [number, number] = [center[1], center[0]];

  useEffect(() => {
    // no-op; placeholder for potential future side-effects
  }, []);

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#3b82f6',
    in_progress: '#3b82f6',
    resolved: '#10b981',
    rejected: '#ef4444',
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer center={leafletCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {complaints.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.latitude, c.longitude]}
            radius={8}
            pathOptions={{ color: statusColors[c.status] || '#6b7280', fillColor: statusColors[c.status] || '#6b7280', fillOpacity: 1 }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {onLocationSelect && <ClickHandler onLocationSelect={onLocationSelect} />}
      </MapContainer>
    </div>
  );
}