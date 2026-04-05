import React, { useState, useRef } from 'react';
import { X, CheckCircle, Camera } from 'lucide-react';

interface FixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl?: string) => void;
}

export default function FixModal({ isOpen, onClose, onSubmit }: FixModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setImageUrl(compressedBase64);
        setIsCompressing(false);
      };
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(imageUrl || undefined);
    setImageUrl('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" size={20} />
            Mark as Fixed
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            You are about to mark this pothole as fixed. You can optionally upload a photo of the repaired road.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fix Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-32 w-full">
                <img src={imageUrl} alt="Fixed Pothole" className="w-full h-full object-cover" />
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

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20 text-sm"
            >
              Confirm Fix
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
