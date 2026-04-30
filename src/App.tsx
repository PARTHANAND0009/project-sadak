import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc, deleteField } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { Pothole, User, Severity, Status } from './types';
import PotholeMap from './components/Map';
import Sidebar from './components/Sidebar';
import ReportModal from './components/ReportModal';
import OnboardingAnimation from './components/OnboardingAnimation';
import AboutUs from './components/AboutUs';
import Sessions from './components/Sessions';
import { LogIn, LogOut, PlusCircle, AlertTriangle, Menu, ArrowRight, MapPin } from 'lucide-react';
import L from 'leaflet';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPotholeId, setSelectedPotholeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('hasVisited') !== 'true');
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'sessions'>('home');

  const handleGetStarted = () => {
    localStorage.setItem('hasVisited', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore, if not create them
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let role: 'user' | 'admin' = 'user';
        
        if (userSnap.exists()) {
          role = userSnap.data().role;
        } else {
          // Check if it's the default admin
          if (firebaseUser.email === 'parthanand67@gmail.com' && firebaseUser.emailVerified) {
            role = 'admin';
          }
          await setDoc(userRef, { role });
        }
        
        setUser({ uid: firebaseUser.uid, role });
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'pothole_index', 'master'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data || {};
        const fetchedPotholes: Pothole[] = Object.values(data).map((item: any) => ({
          id: item.id,
          lat: item.lat,
          lng: item.lng,
          severity: item.sev,
          status: item.stat,
          createdAt: { toDate: () => new Date(item.ts) } as any,
          reportedBy: '',
          description: '',
        }));
        
        fetchedPotholes.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        
        // Merge with existing full details if we have them
        setPotholes(prev => {
          const fullDetailsMap = new Map(prev.filter(p => p.reportedBy).map(p => [p.id, p]));
          return fetchedPotholes.map(p => fullDetailsMap.has(p.id) ? { ...p, ...fullDetailsMap.get(p.id) } : p);
        });
      } else {
        setPotholes([]);
      }
    }, (error) => {
      console.error("Error fetching potholes:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  useEffect(() => {
    if (!selectedPotholeId) return;
    
    const fetchFullDetails = async () => {
      try {
        const docRef = doc(db, 'potholes', selectedPotholeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPotholes(prev => prev.map(p => {
            if (p.id === selectedPotholeId) {
              return {
                ...p,
                description: data.description,
                imageUrl: data.imageUrl,
                fixedImageUrl: data.fixedImageUrl,
                reportedBy: data.reportedBy,
                createdAt: data.createdAt
              };
            }
            return p;
          }));
        }
      } catch (error) {
        console.error('Error fetching full pothole details:', error);
      }
    };
    
    fetchFullDetails();
  }, [selectedPotholeId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    if (!user) {
      alert('Please log in to report a pothole.');
      return;
    }
    setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (data: { lat: number; lng: number; severity: Severity; description: string; imageUrl: string }) => {
    if (!user) return;
    
    try {
      const newPotholeRef = doc(collection(db, 'potholes'));
      const timestamp = serverTimestamp();
      const clientTimestamp = Date.now();
      
      const potholeData: any = {
        lat: data.lat,
        lng: data.lng,
        severity: data.severity,
        description: data.description,
        status: 'open',
        createdAt: timestamp,
        reportedBy: user.uid,
        imageUrl: data.imageUrl,
      };
      
      await setDoc(newPotholeRef, potholeData);
      
      // Update index document
      await setDoc(doc(db, 'pothole_index', 'master'), {
        data: {
          [newPotholeRef.id]: {
            id: newPotholeRef.id,
            lat: data.lat,
            lng: data.lng,
            sev: data.severity,
            stat: 'open',
            ts: clientTimestamp
          }
        }
      }, { merge: true });
      
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error submitting report', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Status, fixedImageUrl?: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const updateData: any = { status: newStatus };
      if (fixedImageUrl) {
        updateData.fixedImageUrl = fixedImageUrl;
      }

      await updateDoc(doc(db, 'potholes', id), updateData);
      
      // Update index
      await updateDoc(doc(db, 'pothole_index', 'master'), {
        [`data.${id}.stat`]: newStatus
      });
    } catch (error) {
      console.error('Error updating status', error);
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      await deleteDoc(doc(db, 'potholes', id));
      
      // Delete from index
      await updateDoc(doc(db, 'pothole_index', 'master'), {
        [`data.${id}`]: deleteField()
      });
      
      if (selectedPotholeId === id) {
        setSelectedPotholeId(null);
      }
    } catch (error) {
      console.error('Error deleting report', error);
      alert('Failed to delete report.');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-emerald-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-900 relative">
      {user ? (
        <>
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className={`
            fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar 
              potholes={potholes} 
              onSelect={(id) => {
                setSelectedPotholeId(id);
                setIsSidebarOpen(false);
              }} 
              selectedId={selectedPotholeId}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
          
          <div className="flex-1 relative flex flex-col w-full">
            <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start pointer-events-none">
              <div className="pointer-events-auto flex gap-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden bg-white text-gray-700 p-3 rounded-xl shadow-lg border border-gray-200 flex items-center justify-center transition-all active:scale-95"
                >
                  <Menu size={20} />
                </button>
                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    setIsReportModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center gap-2 font-medium transition-all hover:scale-105 active:scale-95"
                >
                  <PlusCircle size={20} />
                  <span className="hidden sm:inline">Report Pothole</span>
                  <span className="sm:hidden">Report</span>
                </button>
              </div>
              
              <div className="pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200 mx-1"></div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </header>

            <main className="flex-1 relative z-0">
              <PotholeMap 
                potholes={potholes} 
                isAdmin={user.role === 'admin'}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onMapClick={handleMapClick}
                onMarkerClick={setSelectedPotholeId}
                selectedPotholeId={selectedPotholeId}
              />
            </main>
          </div>

          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => {
              setIsReportModalOpen(false);
              setSelectedLocation(null);
            }}
            onSubmit={handleSubmitReport}
            initialLocation={selectedLocation}
            isAdmin={user?.role === 'admin'}
          />
        </>
      ) : showOnboarding ? (
        <OnboardingAnimation onComplete={handleGetStarted} />
      ) : currentView === 'about' ? (
        <AboutUs onBack={() => setCurrentView('home')} />
      ) : currentView === 'sessions' ? (
        <Sessions onBack={() => setCurrentView('home')} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/90 to-white/50"></div>
          
          {/* Navigation Bar */}
          <nav className="absolute top-0 left-0 right-0 p-6 md:px-12 flex justify-between items-center z-20">
            <div className="flex gap-6 text-sm font-semibold text-gray-700">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('about'); }} className="hover:text-emerald-600 transition-colors">About Us</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('sessions'); }} className="hover:text-emerald-600 transition-colors">Sessions</a>
            </div>
            <div className="text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Reported - <span className="text-emerald-600 font-bold">{potholes.length}</span> potholes
            </div>
          </nav>
          
          <div className="relative z-10 max-w-md w-full mt-12">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center border border-emerald-100 shadow-xl shadow-emerald-500/10">
                <MapPin className="text-emerald-600 w-10 h-10" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900 font-['Playfair_Display'] italic">Project Sadak</h1>
            <p className="text-sm font-medium text-emerald-600 mb-4 uppercase tracking-wider">An Initiative by Parth Anand</p>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Join the community effort to map and fix our roads. Report potholes instantly and track repairs in real-time.
            </p>
            
            <button
              onClick={handleLogin}
              className="w-full bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              <LogIn size={20} />
              Sign in with Google
            </button>
            
            <p className="mt-6 text-sm text-gray-500">
              By signing in, you agree to help make our streets safer.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center w-full">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Supported By</p>
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-gray-800 w-full">
                <a href="https://exerton.xyz/" target="_blank" rel="noopener noreferrer" className="font-bold text-sm sm:text-lg tracking-tight hover:text-emerald-600 transition-colors whitespace-nowrap">Exerton</a>
                <a href="https://colinangel.com/" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-lg font-normal hover:text-emerald-600 transition-colors whitespace-nowrap">Colin Angel</a>
                <a href="https://www.instagram.com/marginitiative/" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-lg font-normal hover:text-emerald-600 transition-colors whitespace-nowrap">The Marg Initiative</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
