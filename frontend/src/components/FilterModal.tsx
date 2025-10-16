import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="filter-modal-title">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden" role="document">
        {/* Header */}
        <header className="border-b p-4 flex items-center justify-between">
          <h2 id="filter-modal-title" className="text-lg font-semibold">Filtros</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar ventana de filtros"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <section className="p-4 overflow-y-auto max-h-96 space-y-6" aria-label="Opciones de filtro">
          {/* Zones */}
          <fieldset>
            <legend className="font-medium mb-3">Zona</legend>
            <div id="zones-desc" className="sr-only">
              Selecciona una o más zonas geográficas para filtrar los resultados
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Selección de zonas" aria-describedby="zones-desc">
              {zones.map(zone => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone)}
                  className={`px-3 py-1 text-sm rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    filters.zones.includes(zone)
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-100 border-gray-300"
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
            <legend className="font-medium mb-3">Rango de Edad</legend>
            <div id="age-desc" className="sr-only">
              Selecciona el rango de edad recomendado para filtrar los resultados
            </div>
            <ul className="space-y-2" aria-describedby="age-desc">
              {ageRanges.map(range => (
                <li key={range.label}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ageRange"
                      checked={filters.ageRange[0] === range.min && filters.ageRange[1] === range.max}
                      onChange={() => setFilters(prev => ({ ...prev, ageRange: [range.min, range.max] }))}
                      className="text-blue-600 focus:ring-blue-500 focus:ring-2"
                      aria-describedby={`age-${range.min}-${range.max}-help`}
                    />
                    {range.label}
                    <span id={`age-${range.min}-${range.max}-help`} className="sr-only">
                      {filters.ageRange[0] === range.min && filters.ageRange[1] === range.max ? 'Seleccionado' : 'No seleccionado'}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          {/* Price Range */}
          <fieldset>
            <legend className="font-medium mb-3">Rango de Precio</legend>
            <div id="price-desc" className="sr-only">
              Selecciona el rango de precio para filtrar los resultados en bolívares
            </div>
            <ul className="space-y-2" aria-describedby="price-desc">
              {priceRanges.map(range => (
                <li key={range.label}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={filters.priceRange[0] === range.min && filters.priceRange[1] === range.max}
                      onChange={() => setFilters(prev => ({ ...prev, priceRange: [range.min, range.max] }))}
                      className="text-blue-600 focus:ring-blue-500 focus:ring-2"
                      aria-describedby={`price-${range.min}-${range.max}-help`}
                    />
                    {range.label}
                    <span id={`price-${range.min}-${range.max}-help`} className="sr-only">
                      {filters.priceRange[0] === range.min && filters.priceRange[1] === range.max ? 'Seleccionado' : 'No seleccionado'}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>          {/* Rating */}
          <fieldset>
            <legend className="font-medium mb-3">Calificación Mínima</legend>
            <div id="rating-desc" className="sr-only">
              Selecciona la calificación mínima en estrellas para filtrar los resultados
            </div>
            <nav className="flex gap-2" aria-label="Selección de calificación mínima" aria-describedby="rating-desc">
              {[0, 1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    filters.minRating === rating
                      ? "bg-amber-100 border-amber-300 text-amber-700"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  aria-pressed={filters.minRating === rating}
                  aria-describedby={`rating-${rating}-status`}
                >
                  <Star className={`h-4 w-4 ${filters.minRating === rating ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} aria-hidden="true" />
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
        <footer className="border-t p-4 flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 border-2 border-gray-300 py-2.5 px-4 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Aplicar Filtros
          </button>
        </footer>
      </div>
    </div>
  );
}