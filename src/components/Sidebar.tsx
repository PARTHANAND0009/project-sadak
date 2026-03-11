import { Pothole } from '../types';
import { format } from 'date-fns';
import { MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SidebarProps {
  potholes: Pothole[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export default function Sidebar({ potholes, onSelect, selectedId }: SidebarProps) {
  const openPotholes = potholes.filter(p => p.status === 'open');
  const fixedPotholes = potholes.filter(p => p.status === 'fixed');
  
  const highSeverity = openPotholes.filter(p => p.severity === 'high').length;
  const mediumSeverity = openPotholes.filter(p => p.severity === 'medium').length;
  const lowSeverity = openPotholes.filter(p => p.severity === 'low').length;

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden text-gray-900 shadow-sm z-10 relative">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
          <MapPin className="text-emerald-600" />
          Project Sadak
        </h1>
        <p className="text-emerald-600 text-xs font-medium uppercase tracking-wider mb-2">An Initiative by Parth Anand</p>
        <p className="text-gray-500 text-sm">Community Pothole Reporting</p>
      </div>

      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-light">{openPotholes.length}</div>
            <div className="text-xs text-gray-500 mt-1">Open Reports</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-light text-emerald-600">{fixedPotholes.length}</div>
            <div className="text-xs text-gray-500 mt-1">Fixed</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-red-600"><AlertTriangle size={14} /> High</span>
            <span className="font-mono">{highSeverity}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-yellow-600"><AlertTriangle size={14} /> Medium</span>
            <span className="font-mono">{mediumSeverity}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-green-600"><AlertTriangle size={14} /> Low</span>
            <span className="font-mono">{lowSeverity}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">Recent Reports</h2>
        
        {potholes.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No potholes reported yet.
          </div>
        ) : (
          potholes.map(pothole => (
            <button
              key={pothole.id}
              onClick={() => onSelect(pothole.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedId === pothole.id 
                  ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500/50' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  pothole.status === 'fixed' ? 'bg-gray-100 text-gray-600' :
                  pothole.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
                  pothole.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {pothole.status === 'fixed' ? 'Fixed' : `${pothole.severity} Severity`}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {pothole.createdAt ? format(pothole.createdAt.toDate(), 'MMM d') : 'Just now'}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {pothole.description || 'No description provided.'}
              </p>
              {pothole.imageUrl && (
                <div className="mt-2 h-24 w-full rounded-lg overflow-hidden border border-gray-200">
                  <img src={pothole.imageUrl} alt="Pothole" className="w-full h-full object-cover" />
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
