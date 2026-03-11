import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, AlertTriangle, Camera, Image as ImageIcon } from 'lucide-react';
import { Severity } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { lat: number; lng: number; severity: Severity; description: string; imageUrl?: string }) => void;
  initialLocation: { lat: number; lng: number } | null;
}

export default function ReportModal({ isOpen, onClose, onSubmit, initialLocation }: ReportModalProps) {
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [description, setDescription] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLat(initialLocation ? initialLocation.lat.toString() : '');
      setLng(initialLocation ? initialLocation.lng.toString() : '');
      setSeverity('medium');
      setDescription('');
      setImageUrl('');
    }
  }, [isOpen, initialLocation]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to WebP or JPEG, quality 0.6
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setImageUrl(compressedBase64);
        setIsCompressing(false);
      };
    };
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLng(position.coords.longitude.toString());
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location', error);
          alert('Could not get your precise location. Please drop a pin on the map manually.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) {
      alert('Please provide a location.');
      return;
    }
    
    onSubmit({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      severity,
      description,
      imageUrl: imageUrl || undefined
    });
    
    // Reset form
    setLat('');
    setLng('');
    setSeverity('medium');
    setDescription('');
    setImageUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-emerald-600" />
            Report Pothole
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <MapPin size={16} />
              {isLocating ? 'Locating...' : 'Use Current Location'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Or close this modal and click anywhere on the map to drop a pin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as Severity[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`py-2 rounded-lg text-sm font-medium capitalize transition-all border ${
                    severity === s
                      ? s === 'high' ? 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/50'
                        : s === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-1 ring-yellow-500/50'
                        : 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-500/50'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Deep pothole in the right lane, hard to see at night."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-24 resize-none"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-32 w-full">
                <img src={imageUrl} alt="Pothole" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-gray-700 p-1 rounded-full shadow-sm hover:bg-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-emerald-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
              >
                {isCompressing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-600 mb-2"></div>
                ) : (
                  <Camera size={24} className="mb-2" />
                )}
                <span className="text-sm font-medium">
                  {isCompressing ? 'Compressing...' : 'Tap to add a photo'}
                </span>
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
