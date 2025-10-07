import { useEffect } from "react";

export default function SkipLinks() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip to main content with Ctrl/Cmd + Alt + M
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'm') {
        e.preventDefault();
        const main = document.getElementById('main-content');
        if (main) {
          main.focus();
          main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      // Skip to navigation with Ctrl/Cmd + Alt + N
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'n') {
        e.preventDefault();
        const nav = document.querySelector('nav[aria-label="Main navigation"]');
        if (nav) {
          (nav as HTMLElement).focus();
        }
      }

      // Skip to search with Ctrl/Cmd + Alt + S
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 's') {
        e.preventDefault();
        const search = document.querySelector('input[placeholder*="Buscar"]');
        if (search) {
          (search as HTMLElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 z-50 bg-white border border-gray-300 rounded-br-md shadow-lg">
        <a
          href="#main-content"
          className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
          onClick={(e) => {
            e.preventDefault();
            const main = document.getElementById('main-content');
            if (main) {
              main.focus();
              main.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          Skip to main content
        </a>
        <a
          href="#main-navigation"
          className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
          onClick={(e) => {
            e.preventDefault();
            const nav = document.querySelector('nav[aria-label="Main navigation"]');
            if (nav) {
              (nav as HTMLElement).focus();
            }
          }}
        >
          Skip to navigation
        </a>
        <a
          href="#search"
          className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
          onClick={(e) => {
            e.preventDefault();
            const search = document.querySelector('input[placeholder*="Buscar"]');
            if (search) {
              (search as HTMLElement).focus();
            }
          }}
        >
          Skip to search
        </a>
      </div>
    </nav>
  );
}