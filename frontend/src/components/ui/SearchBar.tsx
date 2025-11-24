import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

type SearchBarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    categories: string[];
    priceRange: [number, number];
    ageRange: [number, number];
    minRating: number;
    zones: string[];
  };
  onOpenFilters: () => void;
};

export default function SearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onOpenFilters
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debouncedQuery = useDebounce(localQuery, 300); // 300ms delay

  // Update local query when prop changes (for external updates)
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Update parent when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== searchQuery) {
      onSearchChange(debouncedQuery);
    }
  }, [debouncedQuery, onSearchChange, searchQuery]);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minRating > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 1000;

  return (
    <form className="flex items-center gap-3 w-full" onSubmit={(e) => e.preventDefault()}>
      <div className="relative flex-1 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
        </div>
        <label htmlFor="search-input" className="sr-only">
          Buscar lugares, eventos, restaurantes
        </label>
        <input
          id="search-input"
          placeholder="¿Qué quieres descubrir hoy?"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 pl-11 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:shadow-md"
          aria-describedby="search-help"
        />
        <span id="search-help" className="sr-only">
          Use this search to find places, events, and restaurants
        </span>
      </div>
      <button
        onClick={onOpenFilters}
        className={`flex items-center gap-2 rounded-2xl border px-5 py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 relative ${
          hasActiveFilters
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md'
        }`}
        aria-label={hasActiveFilters ? `Filtros (activos)` : 'Filtros'}
        aria-expanded="false"
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span className="hidden sm:inline">Filtros</span>
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
          </span>
        )}
      </button>
    </form>
  );
}