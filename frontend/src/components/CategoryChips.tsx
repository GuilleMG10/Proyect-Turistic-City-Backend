import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  };

  return (
    <>
      {/* Desktop: Horizontal scrollable chips */}
      <nav 
        className="hidden md:flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
        aria-label="Categorías de filtro"
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategorySelect(category)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border shadow-sm transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            }`}
          >
            {category}
          </button>
        ))}
      </nav>

      {/* Mobile: Dropdown menu */}
      <div className="md:hidden relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm border dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100"
          aria-label="Seleccionar categoría"
          aria-expanded={isDropdownOpen}
        >
          <span className="font-medium">{selectedCategory}</span>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            aria-hidden="true"
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
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