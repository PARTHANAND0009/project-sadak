import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, AlertTriangle, Camera, Waves, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { Severity } from '../types';
import { checkIfWaterLocation, WaterCheckResult } from '../utils/waterCheck';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { lat: number; lng: number; severity: Severity; description: string; imageUrl: string }) => void;
  initialLocation: { lat: number; lng: number } | null;
  isAdmin?: boolean;
}

export default function ReportModal({ isOpen, onClose, onSubmit, initialLocation, isAdmin }: ReportModalProps) {
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [description, setDescription] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCheckingWater, setIsCheckingWater] = useState(false);
  const [waterCheckResult, setWaterCheckResult] = useState<WaterCheckResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const initialLat = initialLocation ? initialLocation.lat.toString() : '';
      const initialLng = initialLocation ? initialLocation.lng.toString() : '';
      setLat(initialLat);
      setLng(initialLng);
      setSeverity('medium');
      setDescription('');
      setImageUrl('');
      setWaterCheckResult(null);

      if (initialLocation) {
        validateCoordinates(initialLocation.lat, initialLocation.lng);
      }
    }
  }, [isOpen, initialLocation]);

  const validateCoordinates = async (latitude: number, longitude: number) => {
    if (isNaN(latitude) || isNaN(longitude)) {
      setWaterCheckResult(null);
      return;
    }
    setIsCheckingWater(true);
    try {
      const result = await checkIfWaterLocation(latitude, longitude);
      setWaterCheckResult(result);
    } catch (err) {
      console.error('Error verifying terrain', err);
      setWaterCheckResult({ isWater: false });
    } finally {
      setIsCheckingWater(false);
    }
  };

  // Debounced check when lat/lng change
  useEffect(() => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
      const timer = setTimeout(() => {
        validateCoordinates(latNum, lngNum);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setWaterCheckResult(null);
    }
  }, [lat, lng]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) {
      alert('Please provide a location.');
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Please provide valid latitude and longitude values.');
      return;
    }
    
    if (!isAdmin && !imageUrl) {
      alert('Please upload a photo of the pothole.');
      return;
    }

    // Final safety check before submission
    setIsCheckingWater(true);
    const check = await checkIfWaterLocation(latitude, longitude);
    setIsCheckingWater(false);
    setWaterCheckResult(check);

    if (check.isWater) {
      alert(
        `Cannot report pothole on water: ${
          check.waterName ? `Selected location is in ${check.waterName}` : 'The selected coordinates are in a water body or ocean'
        }. Potholes can only be reported on roads or land.`
      );
      return;
    }
    
    onSubmit({
      lat: latitude,
      lng: longitude,
      severity,
      description,
      imageUrl
    });
    
    // Reset form
    setLat('');
    setLng('');
    setSeverity('medium');
    setDescription('');
    setImageUrl('');
    setWaterCheckResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-emerald-600" />
            Report Pothole
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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

            {/* Water Location Warning & Validation Feedback */}
            {isCheckingWater && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <Loader2 size={14} className="animate-spin text-amber-600 shrink-0" />
                <span>Verifying terrain & checking for water bodies...</span>
              </div>
            )}

            {!isCheckingWater && waterCheckResult && waterCheckResult.isWater && (
              <div className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <Waves className="text-red-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="font-semibold text-red-900 flex items-center gap-1">
                    <ShieldAlert size={13} className="inline" /> Water Body Detected — Reporting Blocked
                  </p>
                  <p className="mt-1 text-red-700 leading-relaxed">
                    {waterCheckResult.reason || 'This location is in a water body. Potholes can only be reported on roads or land.'}
                  </p>
                  <p className="mt-1.5 font-medium text-red-900">
                    Please select a point on a road, street, or land.
                  </p>
                </div>
              </div>
            )}

            {!isCheckingWater && waterCheckResult && !waterCheckResult.isWater && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">
                  Valid land location: {waterCheckResult.roadName || 'Road verified'}
                </span>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2 text-center">
              Or close this modal and click anywhere on the road to drop a pin.
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo {isAdmin ? '(Optional for Admins)' : '(Required)'}
            </label>
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
              disabled={isCheckingWater || isCompressing || Boolean(waterCheckResult?.isWater)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {isCheckingWater ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Location...</span>
                </>
              ) : waterCheckResult?.isWater ? (
                <span>Cannot Report on Water</span>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
