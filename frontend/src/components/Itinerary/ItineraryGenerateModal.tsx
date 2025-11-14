import React, { useState, useEffect } from "react";
import { X, Sparkles, Calendar, Clock, DollarSign, Tag } from "lucide-react";
import type { ItineraryGenerateRequest } from "../../types";
import ErrorModal from "../ErrorModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: ItineraryGenerateRequest) => void;
};

const AVAILABLE_CATEGORIES = [
  'Lugares turísticos',
  'Cultural',
  'Gastronomía',
  'Entretenimiento',
  'Naturaleza',
  'Historia',
  'Compras',
  'Deportes'
];

const PACE_OPTIONS = [
  { value: 'relaxed' as const, label: 'Relajado', description: 'Más tiempo en cada lugar' },
  { value: 'moderate' as const, label: 'Moderado', description: 'Balance entre visitas y descanso' },
  { value: 'intense' as const, label: 'Intenso', description: 'Máximo de lugares posible' }
];

export default function ItineraryGenerateModal({ isOpen, onClose, onGenerate }: Props) {
  const [formData, setFormData] = useState<ItineraryGenerateRequest>({
    date: '',
    start_time: '09:00',
    end_time: '18:00',
    budget: 500,
    preferences: [],
    pace: 'moderate'
  });
  const [error, setError] = useState<string | null>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.date) {
      setError('Por favor selecciona una fecha para el itinerario.');
      return;
    }
    if (formData.preferences.length === 0) {
      setError('Por favor selecciona al menos una preferencia para personalizar tu itinerario.');
      return;
    }
    if (formData.budget <= 0) {
      setError('El presupuesto debe ser mayor a 0 Bs.');
      return;
    }

    onGenerate(formData);
  };

  const togglePreference = (category: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(category)
        ? prev.preferences.filter(c => c !== category)
        : [...prev.preferences, category]
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Mobile: Slide from bottom | Desktop: Center modal */}
      <div className="w-full md:w-auto md:max-w-2xl max-h-[90vh] md:max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <header className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 md:p-6 rounded-t-3xl md:rounded-t-xl flex items-center justify-between">
          {/* Mobile: Drag indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full md:hidden" />
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Generar itinerario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date Selection */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Fecha del Itinerario
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </section>

          {/* Time Range */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Hora de Inicio
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Fin
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
          </section>

          {/* Budget */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Presupuesto Aproximado (Bs.)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
              min="0"
              step="10"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              El itinerario se ajustará a este presupuesto
            </p>
          </section>

          {/* Pace Selection */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ritmo del Tour
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PACE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pace: option.value }))}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.pace === option.value
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 dark:text-white'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 dark:text-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Preferences */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Tag className="h-4 w-4 inline mr-2" />
              Preferencias de Itinerario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => togglePreference(category)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.preferences.includes(category)
                      ? 'border-cyan-500 bg-cyan-500 text-white'
                      : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-cyan-300 dark:hover:border-cyan-500'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Selecciona las categorías que te interesan
            </p>
          </section>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-cyan-600 dark:bg-cyan-700 text-white rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              <span>Generar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={error !== null}
        onClose={() => setError(null)}
        title="Validación de Formulario"
        message={error || ''}
      />
    </div>
  );
}
