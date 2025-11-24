import { useState, Suspense, lazy, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Bot, Compass } from "lucide-react";
import SkipLinks from "./components/ui/SkipLinks";
import UserMenu from "./components/layout/UserMenu";
import LoginModal from "./components/modals/LoginModal";
import NotificationsPopup from "./components/modals/NotificationsPopup";
import TabNavigation from "./components/layout/TabNavigation";
import { checkAndGenerateNotifications, getUnreadCount, clearOldNotifications } from "./utils/eventNotifications";
import { ApiService } from "./services/api";
import { useTheme } from "./hooks/useTheme";

// Lazy load AIChat component
const AIChat = lazy(() => import("./components/features/AIChat"));

type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario' | 'mapa' | 'itinerario';

export default function App() {
  useTheme(); // Initialize theme
  const location = useLocation();
  const navigate = useNavigate();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const getActiveTab = (pathname: string): TabType | null => {
    if (pathname.includes('/explore/events')) return 'eventos';
    if (pathname.includes('/explore/for-you')) return 'para-ti';
    if (pathname.includes('/explore/calendar')) return 'calendario';
    if (pathname.includes('/explore/map')) return 'mapa';
    if (pathname.includes('/explore/itinerary')) return 'itinerario';
    if (pathname.includes('/explore')) return 'explorar';
    return null;
  };

  const activeTab = getActiveTab(location.pathname);

  const tabs = [
    { key: 'explorar' as const, label: 'Explorar' },
    { key: 'eventos' as const, label: 'Eventos' },
    { key: 'para-ti' as const, label: 'Para ti' },
    { key: 'calendario' as const, label: 'Calendario' },
    { key: 'mapa' as const, label: 'Mapa' },
    { key: 'itinerario' as const, label: 'Itinerario' }
  ];

  const handleTabChange = (tab: TabType) => {
    switch (tab) {
      case 'explorar': navigate('/explore'); break;
      case 'eventos': navigate('/explore/events'); break;
      case 'para-ti': navigate('/explore/for-you'); break;
      case 'calendario': navigate('/explore/calendar'); break;
      case 'mapa': navigate('/explore/map'); break;
      case 'itinerario': navigate('/explore/itinerary'); break;
    }
  };

  // Check for notifications periodically
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const events = await ApiService.getEvents();
        checkAndGenerateNotifications(events);
        setUnreadCount(getUnreadCount());
        clearOldNotifications();
      } catch (error) {
        console.error('Failed to check notifications:', error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
    setUnreadCount(getUnreadCount());
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isAIOpen || isNotificationsOpen || isLoginOpen;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAIOpen, isNotificationsOpen, isLoginOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-primary-100 selection:text-primary-900">
      <SkipLinks />

      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg px-2 py-1 -ml-2 group flex-shrink-0"
          >
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg shadow-sm group-hover:shadow-md transition-all">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent tracking-tight group-hover:opacity-80 transition-opacity hidden sm:block">
              Culturistas
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block flex-1 max-w-3xl">
            <TabNavigation 
              tabs={tabs} 
              activeTab={activeTab as TabType} 
              onTabChange={handleTabChange} 
            />
          </div>

          <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
              )}
            </button>
            
            <button
              onClick={() => setIsAIOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Asistente IA"
            >
              <Bot className="h-5 w-5" />
            </button>
            
            <div className="pl-2 border-l border-gray-200 dark:border-gray-700 ml-2">
              <UserMenu onLoginClick={() => setIsLoginOpen(true)} />
            </div>
          </nav>
        </div>

        {/* Mobile Navigation (Sticky below header) */}
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 overflow-x-auto">
           <TabNavigation 
             tabs={tabs} 
             activeTab={activeTab as TabType} 
             onTabChange={handleTabChange} 
           />
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" tabIndex={-1}>
        <Outlet />
      </main>

      <Suspense fallback={null}>
        <AIChat isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      </Suspense>

      <NotificationsPopup 
        isOpen={isNotificationsOpen} 
        onClose={handleNotificationsClose} 
      />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
