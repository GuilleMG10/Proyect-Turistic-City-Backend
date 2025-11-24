import React, { useState, useEffect } from "react";
import { X, Sparkles, Calendar, Clock, DollarSign, Tag } from "lucide-react";
import type { ItineraryGenerateRequest } from "../../types";
import ErrorModal from "../modals/ErrorModal";

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
      <div className="w-full md:w-auto md:max-w-2xl max-h-[90vh] md:max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-3xl md:rounded-t-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          {/* Mobile: Drag indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full md:hidden z-10" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Generar itinerario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors relative z-10"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date Selection */}
          <section>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-2 text-blue-500" />
              Fecha del Itinerario
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              required
            />
          </section>

          {/* Time Range */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Clock className="h-4 w-4 inline mr-2 text-blue-500" />
                Hora de Inicio
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hora de Fin
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
            </div>
          </section>

          {/* Budget */}
          <section>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2 text-blue-500" />
              Presupuesto Aproximado (Bs.)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="10"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all pl-10"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Bs.</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-1">
              El itinerario se ajustará a este presupuesto
            </p>
          </section>

          {/* Pace Selection */}
          <section>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Ritmo del Tour
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PACE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pace: option.value }))}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.pace === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white ring-2 ring-blue-200 dark:ring-blue-900'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 dark:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Preferences */}
          <section>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              <Tag className="h-4 w-4 inline mr-2 text-blue-500" />
              Preferencias de Itinerario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => togglePreference(category)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    formData.preferences.includes(category)
                      ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1">
              Selecciona las categorías que te interesan
            </p>
          </section>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3.5 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5"
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
