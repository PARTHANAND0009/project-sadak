import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { X, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Pothole } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  potholes: Pothole[];
  selectedIds: Set<string>;
}

export default function ExportModal({ isOpen, onClose, potholes, selectedIds }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const convertImageToBase64 = async (url: string): Promise<string> => {
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    try {
      // First try to fetch the image as a blob
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Fetch failed, trying canvas fallback for image", e);
      // Fallback to canvas method
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No ctx');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => {
          console.error("Canvas fallback also failed");
          resolve(''); // Fail silently and return empty string
        };
        img.src = url;
      });
    }
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setIsExporting(true);

    try {
      const selectedPotholes = potholes.filter(p => selectedIds.has(p.id));
      
      const pdfDoc = new jsPDF();
      let yOffset = 20;

      pdfDoc.setFontSize(22);
      pdfDoc.text("Project Sadak - Pothole Report Export", 20, yOffset);
      yOffset += 15;

      for (let i = 0; i < selectedPotholes.length; i++) {
        let p = selectedPotholes[i];
        let dbStatus = 'Not Fetched';
        
        // Fetch full details if imageUrl is not present
        if (!p.imageUrl) {
          try {
            const docRef = doc(db, 'potholes', p.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              dbStatus = 'Doc exists. ImageUrl: ' + (data.imageUrl ? 'Present (length: ' + data.imageUrl.length + ')' : "Missing entirely");
              if (data.imageUrl) {
                p = {
                  ...p,
                  imageUrl: data.imageUrl,
                };
              }
            } else {
              dbStatus = 'Doc ' + p.id + ' does not exist in collection';
            }
          } catch (e: any) {
            console.error("Failed to fetch full details for pothole", p.id, e);
            dbStatus = 'Error fetching: ' + e.message;
          }
        } else {
          dbStatus = 'App.tsx provided imageUrl directly. Length: ' + p.imageUrl.length;
        }

        if (yOffset > 250) {
          pdfDoc.addPage();
          yOffset = 20;
        }

        // Fetch location data with slight delay to respect Nominatim rate limit (1 req/sec)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1100));
        }

        let roadName = 'Unknown Road';
        let landmark = 'Unknown Landmark';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.lat}&lon=${p.lng}&format=json`, {
            headers: {
              'User-Agent': 'ProjectSadak/1.0'
            }
          });
          const data = await res.json();
          roadName = data.address?.road || data.address?.pedestrian || data.address?.suburb || 'Unknown Road';
          landmark = data.address?.neighbourhood || data.address?.suburb || data.address?.city_district || data.address?.city || 'Unknown Landmark';
        } catch (e) {
          console.error("Failed to fetch address", e);
        }

        pdfDoc.setFontSize(14);
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text(`ID: ${i + 1}`, 20, yOffset);
        yOffset += 7;

        pdfDoc.setFontSize(11);
        pdfDoc.setFont("helvetica", "normal");
        const dateStr = format(p.createdAt.toDate(), "MMMM d, yyyy");
        pdfDoc.text(`Date Reported: ${dateStr}`, 20, yOffset);
        yOffset += 7;

        pdfDoc.text(`Severity: ${p.severity.toUpperCase()}`, 20, yOffset);
        yOffset += 7;

        const mapsUrl = `https://www.google.com/maps?q=${p.lat},${p.lng}`;
        pdfDoc.setTextColor(0, 0, 255);
        pdfDoc.textWithLink(`Coordinates: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`, 20, yOffset, { url: mapsUrl });
        pdfDoc.setTextColor(0, 0, 0); // reset color to black
        yOffset += 7;

        pdfDoc.text(`Road Name: ${roadName}`, 20, yOffset);
        yOffset += 7;

        pdfDoc.text(`Nearby Landmark: ${landmark}`, 20, yOffset);
        yOffset += 10;

        if (p.imageUrl) {
          try {
            const b64 = await convertImageToBase64(p.imageUrl);
            if (b64) {
              const imgProps = pdfDoc.getImageProperties(b64);
              const pdfWidth = 100;
              const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
              
              if (yOffset + pdfHeight > 270) {
                pdfDoc.addPage();
                yOffset = 20;
              }
              
              pdfDoc.addImage(b64, 'JPEG', 20, yOffset, pdfWidth, pdfHeight);
              yOffset += pdfHeight + 15;
            } else {
              pdfDoc.text("[Image Unvailable]", 20, yOffset);
              yOffset += 10;
            }
          } catch (e) {
             pdfDoc.text("[Error loading image]", 20, yOffset);
             yOffset += 10;
          }
        } else {
           pdfDoc.text(`No image provided. (${dbStatus})`, 20, yOffset);
           yOffset += 10;
        }

        // add some spacing between items
        pdfDoc.setDrawColor(200);
        pdfDoc.line(20, yOffset, 190, yOffset);
        yOffset += 15;
      }

      pdfDoc.save(`project-sadak-export-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      onClose();
    } catch (e) {
      console.error(e);
      alert('An error occurred during export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-gray-900 font-medium">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Export Pothole Data</span>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            You have selected <span className="font-bold text-gray-900">{selectedIds.size}</span> pothole(s) to export. 
            Generating the PDF will fetch road names and landmarks for each selected item.
          </p>
          
          <div className="flex justify-end gap-3">
             <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || selectedIds.size === 0}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>Generate PDF</>
                )}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
