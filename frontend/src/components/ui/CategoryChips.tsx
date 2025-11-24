import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Grid, X } from 'lucide-react';

type CategoryChipsProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
};

export default function CategoryChips({
  categories,
  selectedCategory,
  onCategorySelect
}: CategoryChipsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out empty categories
  const validCategories = categories.filter(c => c && c.trim() !== '');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    setIsDropdownOpen(false);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Desktop: Horizontal scrollable chips with Expand option */}
      <div className="hidden md:flex items-center gap-2">
        <nav 
          className={`flex-1 flex gap-2 pb-2 ${isExpanded ? 'flex-wrap' : 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'}`}
          aria-label="Categorías de filtro"
        >
          {validCategories.map((category) => (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent shadow-md shadow-cyan-500/20"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
              }`}
            >
              {category}
            </button>
          ))}
        </nav>
        
        {/* Expand/Collapse Button */}
        {validCategories.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors mb-2"
            title={isExpanded ? "Ver menos" : "Ver todas las categorías"}
          >
            {isExpanded ? <X className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Mobile: Dropdown menu */}
      <div className="md:hidden relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Seleccionar categoría"
          aria-expanded={isDropdownOpen}
        >
          <span className="truncate">{selectedCategory}</span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            aria-hidden="true"
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
            {validCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}