import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface AboutUsProps {
  onBack: () => void;
}

export default function AboutUs({ onBack }: AboutUsProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
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

      <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-6 sm:px-8 md:px-12 pt-24 pb-12">
        <p className="text-center mx-auto text-[clamp(16px,3.5vmin,40px)] leading-[1.6] md:leading-[1.8] text-gray-800 font-['Playfair_Display'] italic">
          Project Sadak is a live, crowdsourced pothole reporting platform built by a 15-year-old developer Parth Anand from Delhi. Citizens report potholes in real-time through a web app, which plots them on an interactive map using Leaflet.js. The platform is active across 3 countries, has 70+ potholes reported, and has received endorsements from RWAs and is in active talks with government bodies including municipal corporations and traffic police. It was originally built as a YOLOv8-based automated pothole detection system and has since evolved into a full civic tech platform. The project is featured by Emergent and has been recognised by Bangalore Traffic Police. The mission is simple: make road safety data visible, actionable, and impossible to ignore.
        </p>
      </main>
    </div>
  );
}
