import { useState } from "react";
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
  availableCategories: string[];
};

export default function FilterModal({ isOpen, onClose, onApplyFilters, currentFilters, availableCategories }: Props) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  // Use dynamic categories (exclude "Todos" from filter modal)
  const categories = availableCategories.filter(cat => cat !== "Todos");
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

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-medium mb-3">Categorías</h3>
            <div className="space-y-2">
              {categories.map(category => (
                <label key={category} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Zones */}
          <div>
            <h3 className="font-medium mb-3">Zona</h3>
            <div className="flex flex-wrap gap-2">
              {zones.map(zone => (
                <button
                  key={zone}
                  onClick={() => handleZoneToggle(zone)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.zones.includes(zone)
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <h3 className="font-medium mb-3">Rango de Edad</h3>
            <div className="space-y-2">
              {ageRanges.map(range => (
                <label key={range.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="ageRange"
                    checked={filters.ageRange[0] === range.min && filters.ageRange[1] === range.max}
                    onChange={() => setFilters(prev => ({ ...prev, ageRange: [range.min, range.max] }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-medium mb-3">Rango de Precio</h3>
            <div className="space-y-2">
              {priceRanges.map(range => (
                <label key={range.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={filters.priceRange[0] === range.min && filters.priceRange[1] === range.max}
                    onChange={() => setFilters(prev => ({ ...prev, priceRange: [range.min, range.max] }))}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="font-medium mb-3">Calificación Mínima</h3>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm ${
                    filters.minRating === rating
                      ? "bg-amber-100 border-amber-300 text-amber-700"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <Star className={`h-4 w-4 ${filters.minRating === rating ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
                  <span>{rating === 0 ? "Todas" : `${rating}+`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}