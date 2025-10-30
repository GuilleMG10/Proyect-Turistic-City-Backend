import { useState, useEffect } from 'react';
import { Heart, Save, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';
import type { UserPreference } from '../types';

type Props = {
  userId: number;
};

// All available categories
const AVAILABLE_CATEGORIES = [
  'Restaurante',
  'Museo',
  'Parque',
  'Teatro',
  'Café',
  'Bar',
  'Monumento',
  'Galería',
  'Mercado',
  'Deportes',
  'Música',
  'Arte',
  'Cultura',
  'Naturaleza',
  'Historia',
  'Compras',
  'Vida Nocturna',
  'Familiar',
  'Aventura',
  'Relajación',
];

export default function PreferencesSelector({ userId }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadPreferences = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const preferences = await ApiService.getUserPreferences(userId);
      const categories = preferences.map((pref: UserPreference) => pref.category);
      setSelectedCategories(categories);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('No se pudieron cargar tus preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setSuccessMessage(null); // Clear success message when user makes changes
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      setError('Debes seleccionar al menos una categoría');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await ApiService.saveUserPreferences(userId, selectedCategories);
      setSuccessMessage('¡Preferencias guardadas exitosamente!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('No se pudieron guardar tus preferencias. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Heart className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Tus Gustos e Intereses
          </h3>
          <p className="text-gray-600 mt-1">
            Selecciona las categorías que te interesan para recibir mejores recomendaciones
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {AVAILABLE_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              onClick={() => handleToggleCategory(category)}
              className={`
                px-4 py-3 rounded-lg border-2 transition-all text-left font-medium
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    h-5 w-5 rounded flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'bg-white' : 'bg-gray-200'}
                  `}
                >
                  {isSelected && (
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{category}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Count */}
      <div className="text-sm text-gray-600">
        {selectedCategories.length} {selectedCategories.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || selectedCategories.length === 0}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Guardar Preferencias
          </>
        )}
      </button>
    </div>
  );
}
