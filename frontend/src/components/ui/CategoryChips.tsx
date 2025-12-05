import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

type CategoryChipsProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
};

// How many chips to show (including "Todos" and selected)
const VISIBLE_CHIPS_COUNT = 6;

// Generate a random seed once per session (on module load)
const SESSION_SEED = Date.now();

// Shuffle array using Fisher-Yates algorithm with a seed
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  
  // Simple seeded random - changes every page refresh
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (currentIndex > 0) {
    const randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }

  return shuffled;
}

export default function CategoryChips({
  categories,
  selectedCategory,
  onCategorySelect
}: CategoryChipsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Filter out empty categories
  const validCategories = categories.filter(c => c && c.trim() !== '');
  
  // Separate "Todos" from the rest and shuffle the rest on each session
  const shuffledCategories = useMemo(() => {
    const todos = validCategories.filter(c => c === 'Todos');
    const others = validCategories.filter(c => c !== 'Todos');
    
    // Use session seed - changes every page refresh for variety
    const shuffled = shuffleArray(others, SESSION_SEED);
    
    return [...todos, ...shuffled];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validCategories.join(',')]);
  
  // Build visible categories: always include "Todos" first, then selected, then fill with shuffled
  const { primaryChips, secondaryChips } = useMemo(() => {
    const primary: string[] = []; // Todos + selected
    const secondary: string[] = []; // Random fill
    
    // Always add "Todos" first if it exists
    if (shuffledCategories.includes('Todos')) {
      primary.push('Todos');
    }
    
    // Add selected category next if it's not "Todos" and exists
    if (selectedCategory && selectedCategory !== 'Todos' && shuffledCategories.includes(selectedCategory)) {
      primary.push(selectedCategory);
    }
    
    // Fill remaining slots with other shuffled categories
    const totalVisible = primary.length + VISIBLE_CHIPS_COUNT - primary.length;
    for (const cat of shuffledCategories) {
      if (primary.length + secondary.length >= totalVisible) break;
      if (!primary.includes(cat)) {
        secondary.push(cat);
      }
    }
    
    return { primaryChips: primary, secondaryChips: secondary };
  }, [shuffledCategories, selectedCategory]);
  
  // Check if we have a non-Todos selection (to show separator)
  const hasActiveSelection = selectedCategory && selectedCategory !== 'Todos';
  
  // Overflow categories are those not in visible list
  const overflowCategories = useMemo(() => {
    const visible = [...primaryChips, ...secondaryChips];
    return shuffledCategories.filter(c => !visible.includes(c));
  }, [primaryChips, secondaryChips, shuffledCategories]);
  
  const hasOverflow = overflowCategories.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutsideDesktop = dropdownRef.current && !dropdownRef.current.contains(target);
      const clickedOutsideMobile = mobileDropdownRef.current && !mobileDropdownRef.current.contains(target);
      
      if (clickedOutsideDesktop && clickedOutsideMobile) {
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
      {/* Desktop: Chips with separator between selected and random */}
      <div className="hidden md:flex items-center gap-2">
        {/* Primary chips: Todos + Selected */}
        {primaryChips.map((category) => (
          <button
            key={category}
            onClick={() => handleCategorySelect(category)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              selectedCategory === category
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent shadow-md shadow-cyan-500/20"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
            }`}
          >
            {category}
          </button>
        ))}
        
        {/* Separator when there's an active selection */}
        {hasActiveSelection && secondaryChips.length > 0 && (
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" aria-hidden="true" />
        )}
        
        {/* Secondary chips: Random selection */}
        {secondaryChips.map((category) => (
          <button
            key={category}
            onClick={() => handleCategorySelect(category)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium border transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
          >
            {category}
          </button>
        ))}
        
        {/* More dropdown for overflow categories */}
        {hasOverflow && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium border transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                isDropdownOpen
                  ? "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
              }`}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              +{overflowCategories.length} más
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                {overflowCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-300"
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Full dropdown menu */}
      <div className="md:hidden relative" ref={mobileDropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
            {shuffledCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                  selectedCategory === category
                    ? "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {category}
                {selectedCategory === category && (
                  <Check className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}