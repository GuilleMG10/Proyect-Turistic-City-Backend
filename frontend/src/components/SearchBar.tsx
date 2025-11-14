import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

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
    <form className="flex items-center gap-3" onSubmit={(e) => e.preventDefault()}>
      <div className="relative flex-1">
        <label htmlFor="search-input" className="sr-only">
          Buscar lugares, eventos, restaurantes
        </label>
        <input
          id="search-input"
          placeholder="Buscar lugares, eventos, restaurantes..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="w-full rounded-full border dark:border-gray-600 px-5 py-2.5 bg-white dark:bg-gray-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-describedby="search-help"
        />
        <span id="search-help" className="sr-only">
          Use this search to find places, events, and restaurants
        </span>
      </div>
      <button
        onClick={onOpenFilters}
        className={`rounded-full border dark:border-gray-600 px-4 py-2 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 relative ${
          hasActiveFilters
            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
            : 'bg-white dark:bg-gray-800 dark:text-gray-200'
        }`}
        aria-label={hasActiveFilters ? `Filtros (activos)` : 'Filtros'}
        aria-expanded="false"
      >
        Filtros
        {hasActiveFilters && (
          <mark className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full" aria-label="Filtros activos"></mark>
        )}
      </button>
    </form>
  );
}