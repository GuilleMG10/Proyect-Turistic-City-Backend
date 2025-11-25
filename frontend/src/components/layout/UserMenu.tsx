import { useState, useRef, useEffect } from 'react';
import { User, LogOut, UserCircle, Moon, Sun } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

type Props = {
  onLoginClick: () => void;
};

export default function UserMenu({ onLoginClick }: Props) {
  const { user, logout } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleViewProfile = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  if (!user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm hover:shadow-md"
          aria-label="Menú de invitado"
          aria-expanded={isOpen}
        >
          <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <User className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline font-medium text-sm text-gray-700 dark:text-gray-200">Visitante</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden z-50 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  onLoginClick();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors text-primary-600 dark:text-primary-400 font-medium"
              >
                <User className="h-4.5 w-4.5" />
                <span>Iniciar Sesión</span>
              </button>
              
              <button
                onClick={() => {
                  toggleTheme();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-200 font-medium"
              >
                {theme === 'light' ? (
                  <Moon className="h-4.5 w-4.5 text-gray-400" />
                ) : (
                  <Sun className="h-4.5 w-4.5 text-gray-400" />
                )}
                <span>
                  Tema {theme === 'light' ? 'Oscuro' : 'Claro'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm hover:shadow-md"
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
      >
        <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline font-medium text-sm text-gray-700 dark:text-gray-200">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden z-50 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info */}
          <div className="p-5 bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl font-bold border border-white/30 shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-lg leading-tight">{user.name}</p>
                <p className="text-sm opacity-80 truncate font-medium">@{user.username}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <div className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
              {user.email && (
                <p className="truncate flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {user.email}
                </p>
              )}
              {user.age && (
                <p className="mt-1 ml-3.5">{user.age} años</p>
              )}
            </div>

            <div className="p-2 space-y-1">
              <button
                onClick={handleViewProfile}
                className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-200 font-medium"
              >
                <UserCircle className="h-4.5 w-4.5 text-gray-400" />
                <span>Ver Perfil</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-200 font-medium"
              >
                {theme === 'light' ? (
                  <Moon className="h-4.5 w-4.5 text-gray-400" />
                ) : (
                  <Sun className="h-4.5 w-4.5 text-gray-400" />
                )}
                <span>
                  Tema {theme === 'light' ? 'Oscuro' : 'Claro'}
                </span>
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-3" />

              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400 font-medium"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
