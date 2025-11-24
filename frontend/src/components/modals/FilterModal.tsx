import { useState, useEffect } from "react";
import { X, Star, MapPin, DollarSign, Users } from "lucide-react";

type FilterOptions = {
  categories: string[];
  priceRange: [number, number];
  ageRange: [number, number];
  minRating: number;
  zones: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
};

export default function FilterModal({ isOpen, onClose, onApplyFilters, currentFilters }: Props) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the modal dialog when it opens
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modal) {
        modal.focus();
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const zones = ["Centro", "Norte", "Sur", "Este", "Oeste"];
  const priceRanges = [
    { label: "Gratis", min: 0, max: 0 },
    { label: "1-50 Bs", min: 1, max: 50 },
    { label: "51-100 Bs", min: 51, max: 100 },
    { label: "101-200 Bs", min: 101, max: 200 },
    { label: "200+ Bs", min: 200, max: 1000 },
  ];
  const ageRanges = [
    { label: "Todas las edades", min: 0, max: 100 },
    { label: "8+ años", min: 8, max: 100 },
    { label: "12+ años", min: 12, max: 100 },
    { label: "18+ años", min: 18, max: 100 },
    { label: "21+ años", min: 21, max: 100 },
  ];

  const handleZoneToggle = (zone: string) => {
    setFilters(prev => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter(z => z !== zone)
        : [...prev.zones, zone]
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterOptions = {
      categories: [],
      priceRange: [0, 1000],
      ageRange: [0, 100],
      minRating: 0,
      zones: [],
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="filter-modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" role="document">
        {/* Header */}
        <header className="border-b border-gray-100 dark:border-gray-700 p-5 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
          <h2 id="filter-modal-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Filtros
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Cerrar ventana de filtros"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <section className="p-5 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600" aria-label="Opciones de filtro">
          {/* Zones */}
          <fieldset>
            <legend className="flex items-center gap-2 font-semibold mb-4 text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4 text-cyan-500" />
              Zona
            </legend>
            <div id="zones-desc" className="sr-only">
              Selecciona una o más zonas geográficas para filtrar los resultados
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Selección de zonas" aria-describedby="zones-desc">
              {zones.map(zone => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    filters.zones.includes(zone)
                      ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 shadow-sm"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-cyan-300 dark:hover:border-cyan-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={filters.zones.includes(zone)}
                  aria-describedby={`zone-${zone}-status`}
                >
                  {zone}
                  <span id={`zone-${zone}-status`} className="sr-only">
                    {filters.zones.includes(zone) ? 'Seleccionado' : 'No seleccionado'}
                  </span>
                </button>
              ))}
            </nav>
          </fieldset>

          {/* Age Range */}
          <fieldset>
            <legend className="flex items-center gap-2 font-semibold mb-4 text-gray-900 dark:text-white">
              <Users className="h-4 w-4 text-cyan-500" />
              Rango de Edad
            </legend>
            <div id="age-desc" className="sr-only">
              Selecciona el rango de edad recomendado para filtrar los resultados
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-describedby="age-desc">
              {ageRanges.map(range => {
                const isSelected = filters.ageRange[0] === range.min && filters.ageRange[1] === range.max;
                return (
                  <label 
                    key={range.label}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800" 
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-cyan-500" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />}
                    </div>
                    <input
                      type="radio"
                      name="ageRange"
                      checked={isSelected}
                      onChange={() => setFilters(prev => ({ ...prev, ageRange: [range.min, range.max] }))}
                      className="sr-only"
                      aria-describedby={`age-${range.min}-${range.max}-help`}
                    />
                    <span className={`text-sm font-medium ${isSelected ? "text-cyan-900 dark:text-cyan-100" : "text-gray-700 dark:text-gray-300"}`}>
                      {range.label}
                    </span>
                    <span id={`age-${range.min}-${range.max}-help`} className="sr-only">
                      {isSelected ? 'Seleccionado' : 'No seleccionado'}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Price Range */}
          <fieldset>
            <legend className="flex items-center gap-2 font-semibold mb-4 text-gray-900 dark:text-white">
              <DollarSign className="h-4 w-4 text-green-500" />
              Rango de Precio
            </legend>
            <div id="price-desc" className="sr-only">
              Selecciona el rango de precio para filtrar los resultados en bolívares
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-describedby="price-desc">
              {priceRanges.map(range => {
                const isSelected = filters.priceRange[0] === range.min && filters.priceRange[1] === range.max;
                return (
                  <label 
                    key={range.label}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-green-500" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                    </div>
                    <input
                      type="radio"
                      name="priceRange"
                      checked={isSelected}
                      onChange={() => setFilters(prev => ({ ...prev, priceRange: [range.min, range.max] }))}
                      className="sr-only"
                      aria-describedby={`price-${range.min}-${range.max}-help`}
                    />
                    <span className={`text-sm font-medium ${isSelected ? "text-green-900 dark:text-green-100" : "text-gray-700 dark:text-gray-300"}`}>
                      {range.label}
                    </span>
                    <span id={`price-${range.min}-${range.max}-help`} className="sr-only">
                      {isSelected ? 'Seleccionado' : 'No seleccionado'}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Rating */}
          <fieldset>
            <legend className="flex items-center gap-2 font-semibold mb-4 text-gray-900 dark:text-white">
              <Star className="h-4 w-4 text-amber-500" />
              Calificación Mínima
            </legend>
            <div id="rating-desc" className="sr-only">
              Selecciona la calificación mínima en estrellas para filtrar los resultados
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Selección de calificación mínima" aria-describedby="rating-desc">
              {[0, 1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    filters.minRating === rating
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-200 shadow-sm"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  aria-pressed={filters.minRating === rating}
                  aria-describedby={`rating-${rating}-status`}
                >
                  <Star className={`h-4 w-4 ${filters.minRating === rating ? "fill-amber-500 text-amber-500" : "text-gray-400"}`} aria-hidden="true" />
                  {rating === 0 ? "Todas" : `${rating}+`}
                  <span id={`rating-${rating}-status`} className="sr-only">
                    {filters.minRating === rating ? 'Seleccionado' : 'No seleccionado'}
                  </span>
                </button>
              ))}
            </nav>
          </fieldset>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 dark:border-gray-700 p-5 flex gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            Aplicar Filtros
          </button>
        </footer>
      </div>
    </div>
  );
}