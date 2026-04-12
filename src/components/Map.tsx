import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Pothole } from '../types';
import { format } from 'date-fns';
import { MapPin, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import FixModal from './FixModal';

const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  low: createIcon('green'),
  medium: createIcon('gold'),
  high: createIcon('red'),
  fixed: createIcon('grey')
};

interface MapProps {
  potholes: Pothole[];
  isAdmin: boolean;
  onStatusChange: (id: string, newStatus: 'open' | 'fixed') => void;
  onDelete: (id: string) => void;
  onMapClick: (latlng: L.LatLng) => void;
  onMarkerClick?: (id: string) => void;
  selectedPotholeId: string | null;
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapFlyTo({ selectedPothole, potholes }: { selectedPothole: string | null, potholes: Pothole[] }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPothole) {
      const pothole = potholes.find(p => p.id === selectedPothole);
      if (pothole) {
        map.flyTo([pothole.lat, pothole.lng], 18, { animate: true });
      }
    }
  }, [selectedPothole, potholes, map]);
  return null;
}

function LocateUser({ selectedPothole }: { selectedPothole: string | null }) {
  const map = useMap();
  const selectedRef = useRef(selectedPothole);

  useEffect(() => {
    selectedRef.current = selectedPothole;
  }, [selectedPothole]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!selectedRef.current) {
            // Zoom level 10 is good for state/city level view
            map.flyTo([position.coords.latitude, position.coords.longitude], 10, { animate: true });
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [map]);

  return null;
}

export default function PotholeMap({ potholes, isAdmin, onStatusChange, onDelete, onMapClick, onMarkerClick, selectedPotholeId }: MapProps) {
  const [fixingPotholeId, setFixingPotholeId] = useState<string | null>(null);

  return (
    <>
      <MapContainer 
        center={[28.6139, 77.2090]} 
        zoom={12} 
        minZoom={2}
        className="w-full h-full z-0"
        zoomControl={false}
      >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MapEvents onMapClick={onMapClick} />
      <MapFlyTo selectedPothole={selectedPotholeId} potholes={potholes} />
      <LocateUser selectedPothole={selectedPotholeId} />
      
      {potholes.map((pothole) => {
        const icon = pothole.status === 'fixed' ? icons.fixed : icons[pothole.severity];
        
        return (
          <Marker 
            key={pothole.id} 
            position={[pothole.lat, pothole.lng]} 
            icon={icon}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(pothole.id);
                }
              }
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                    pothole.status === 'fixed' ? 'bg-gray-200 text-gray-700' :
                    pothole.severity === 'high' ? 'bg-red-100 text-red-700' :
                    pothole.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {pothole.status === 'fixed' ? 'Fixed' : `${pothole.severity} Severity`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {pothole.createdAt ? format(pothole.createdAt.toDate(), 'MMM d, yyyy') : 'Just now'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-800 mb-3">
                  {pothole.description || 'No description provided.'}
                </p>

                {pothole.imageUrl && (
                  <div className="mb-3 w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img src={pothole.imageUrl} alt="Pothole" className="w-full h-full object-cover" />
                  </div>
                )}

                {pothole.fixedImageUrl && (
                  <div className="mb-3 w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                    <div className="text-xs font-bold text-gray-500 mb-1">Fix Photo:</div>
                    <img src={pothole.fixedImageUrl} alt="Fixed Pothole" className="w-full h-28 object-cover rounded" />
                  </div>
                )}

                {isAdmin && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-2">
                    {pothole.status === 'open' ? (
                      <button 
                        onClick={() => setFixingPotholeId(pothole.id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-2 rounded text-xs transition-colors"
                      >
                        <CheckCircle size={14} /> Mark Fixed
                      </button>
                    ) : (
                      <button 
                        onClick={() => onStatusChange(pothole.id, 'open')}
                        className="flex-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-2 rounded text-xs transition-colors"
                      >
                        <AlertTriangle size={14} /> Reopen
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(pothole.id)}
                      className="flex items-center justify-center p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      </MapContainer>

      <FixModal
        isOpen={!!fixingPotholeId}
        onClose={() => setFixingPotholeId(null)}
        onSubmit={(imageUrl) => {
          if (fixingPotholeId) {
            onStatusChange(fixingPotholeId, 'fixed', imageUrl);
            setFixingPotholeId(null);
          }
        }}
      />
    </>
  );
}
