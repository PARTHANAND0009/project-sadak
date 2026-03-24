import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SessionsProps {
  onBack: () => void;
}

export default function Sessions({ onBack }: SessionsProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/90 to-white/50"></div>
      
      <nav className="absolute top-0 left-0 right-0 z-20 p-6 md:px-12 flex items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-emerald-700 transition-colors font-semibold bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm border border-white/50"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
      </nav>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 pt-24 pb-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Side: Text Content */}
          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Playfair_Display'] italic">Session 1</h1>
              <p className="text-lg font-medium text-emerald-600 uppercase tracking-wider">23rd March, 2026 — Delhi</p>
            </div>
            
            <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What We Covered</h2>
              <p>
                We kicked off our first on-ground road safety awareness session with children from an underserved community in Delhi. The session focused on two things: understanding the danger of potholes, and learning how to do something about it.
              </p>
              <p>
                We walked them through why potholes are more than just bumps in the road how they cause accidents, damage vehicles, and disproportionately affect people in low-income neighbourhoods where roads are rarely repaired.
              </p>
              <p>
                Then we opened up the Project Sadak website and showed them, step by step, how to report a pothole. How to pin a location, add a description, and submit it so it goes live on the map for the whole city to see.
              </p>
              <p className="font-semibold text-gray-900 border-l-4 border-emerald-500 pl-4 mt-6">
                By the end, several of the kids had reported potholes on their own street.
              </p>
            </div>
          </div>

          {/* Right Side: Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/50 aspect-[4/3] lg:aspect-auto lg:h-[600px] bg-gray-200">
            {/* Note: Using a placeholder image here. Please replace the src with the actual uploaded image path if available. */}
            <img 
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80" 
              alt="Children learning about road safety" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
