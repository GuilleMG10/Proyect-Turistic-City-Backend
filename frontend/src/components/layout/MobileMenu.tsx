import { X, ChevronRight, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import { useModalEscape } from "../../hooks/useModalEscape";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  links: { to: string; label: string; icon?: React.ReactNode }[];
};

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  // Handle escape key to close menu
  useModalEscape(isOpen, onClose);
  
  // Prevent scrolling when menu is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/95 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu Content */}
      <div className="relative w-full max-w-lg px-6 py-6 flex flex-col h-full max-h-[80vh]">
        <div className="flex items-center justify-between mb-8 px-4">
          {/* Logo - links to home */}
          <Link 
            to="/" 
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
              <Compass className="h-6 w-6 text-white"/>
            </div>
          </Link>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6"/>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-0">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-2xl transition-all group">
                  <span className="font-medium text-lg">{link.label}</span>
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}