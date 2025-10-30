import { useState, Suspense, lazy, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { Bell } from "lucide-react";
import SkipLinks from "./components/SkipLinks";
import UserMenu from "./components/UserMenu";
import LoginModal from "./components/LoginModal";
import NotificationsPopup from "./components/NotificationsPopup";
import { checkAndGenerateNotifications, getUnreadCount, clearOldNotifications } from "./utils/eventNotifications";
import { ApiService } from "./services/api";

// Lazy load AIChat component
const AIChat = lazy(() => import("./components/AIChat"));

export default function App() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <SkipLinks />

      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-semibold hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
            <h1>Culturistas</h1>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-3">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsAIOpen(true)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open AI Assistant"
            >
              Asistente
            </button>
            <UserMenu onLoginClick={() => setIsLoginOpen(true)} />
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-6 py-6" tabIndex={-1}>
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
