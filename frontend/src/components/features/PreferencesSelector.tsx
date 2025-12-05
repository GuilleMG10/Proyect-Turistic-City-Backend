import { useState, useEffect } from 'react';
import { Heart, Save, Loader2 } from 'lucide-react';
import { ApiService } from '../../services/api';
import { USER_PREFERENCE_CATEGORIES } from '../../constants/categories';
import type { UserPreference } from '../../types';

type Props = {
  userId: number;
};

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
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <Heart className="h-6 w-6 text-red-500 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Tus Gustos e Intereses
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Selecciona las categorías que te interesan para recibir mejores recomendaciones
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {USER_PREFERENCE_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              onClick={() => handleToggleCategory(category)}
              className={`
                px-4 py-3 rounded-xl border transition-all text-left font-medium
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${
                  isSelected
                    ? 'bg-primary-600 dark:bg-primary-600 border-primary-600 dark:border-primary-600 text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 dark:hover:bg-primary-500'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                    ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}
                  `}
                >
                  {isSelected && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
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
      <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
        {selectedCategories.length} {selectedCategories.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || selectedCategories.length === 0}
        className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 dark:bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 dark:ring-offset-slate-800 focus:ring-offset-2 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 hover:-translate-y-0.5"
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
