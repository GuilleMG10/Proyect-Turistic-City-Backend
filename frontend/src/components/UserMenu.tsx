import { useState, useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { useUserStore } from '../store/userStore';

type Props = {
  onLoginClick: () => void;
};

export default function UserMenu({ onLoginClick }: Props) {
  const { user, logout } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Iniciar Sesión</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
      >
        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline font-medium">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm opacity-90 truncate">@{user.username}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <div className="px-4 py-2 text-sm text-gray-500">
              {user.email && (
                <p className="truncate">{user.email}</p>
              )}
              {user.age && (
                <p>{user.age} años</p>
              )}
            </div>

            <hr className="my-2" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
