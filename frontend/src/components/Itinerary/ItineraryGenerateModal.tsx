import React, { useState, useMemo } from "react";
import { X, Sparkles, DollarSign, Tag } from "lucide-react";
import { useModalEscape } from "../../hooks/useModalEscape";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useDraggableModal } from "../../hooks/useDraggableModal";
import { PACE_OPTIONS } from "../../constants/categories";
import type { ItineraryGenerateRequest, Place } from "../../types";
import ErrorModal from "../modals/ErrorModal";
import DatePicker from "../ui/DatePicker";
import TimePicker from "../ui/TimePicker";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: ItineraryGenerateRequest) => void;
  places?: Place[]; // Optional - used to derive categories dynamically
};

export default function ItineraryGenerateModal({ isOpen, onClose, onGenerate, places = [] }: Props) {
  const [formData, setFormData] = useState<ItineraryGenerateRequest>({
    date: '',
    start_time: '09:00',
    end_time: '18:00',
    budget: 500,
    preferences: [],
    pace: 'moderate'
  });
  const [error, setError] = useState<string | null>(null);

  // Derive unique categories from places
  const availableCategories = useMemo(() => {
    const categories = new Set(places.map(p => p.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [places]);

  // Handle Escape key to close modal
  useModalEscape(isOpen, onClose);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Draggable modal for mobile
  const { dragHandleProps, modalStyle, isDragging } = useDraggableModal({
    isOpen,
    onClose,
    threshold: 25,
  });

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
      <div 
        className="w-full md:w-auto md:max-w-2xl h-[95vh] md:h-auto max-h-[95vh] md:max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300"
        data-modal-content
        style={modalStyle}
      >
        {/* Mobile drag handle */}
        <div 
          className="sticky top-0 z-30 md:hidden bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-3xl cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <div className="flex justify-center py-3">
            <div className={`w-12 h-1.5 rounded-full transition-colors ${isDragging ? 'bg-white/60' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 md:rounded-t-2xl flex items-center justify-between relative overflow-hidden -mt-2 md:mt-0">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Generar itinerario</h2>
          </div>
          <button
            onClick={onClose}
            className="hidden md:block p-2 hover:bg-white/20 rounded-xl transition-colors relative z-10"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date Selection */}
          <section>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData(prev => ({ ...prev, date }))}
              minDate={new Date().toISOString().split('T')[0]}
              label="Fecha del Itinerario"
              placeholder="Selecciona una fecha"
              required
            />
          </section>

          {/* Time Range */}
          <section className="grid grid-cols-2 gap-4">
            <TimePicker
              value={formData.start_time}
              onChange={(time) => setFormData(prev => ({ ...prev, start_time: time }))}
              label="Hora de Inicio"
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hora de Fin
              </label>
              <TimePicker
                value={formData.end_time}
                onChange={(time) => setFormData(prev => ({ ...prev, end_time: time }))}
                placeholder="Seleccionar hora"
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
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <Tag className="h-4 w-4 inline mr-2 text-blue-500" />
                Preferencias de Itinerario
              </label>
              {formData.preferences.length > 0 && (
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  {formData.preferences.length} seleccionadas
                </span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 p-3 bg-slate-50/50 dark:bg-slate-700/30">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableCategories.length > 0 ? (
                  availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => togglePreference(category)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left truncate ${
                        formData.preferences.includes(category)
                          ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
                      }`}
                      title={category}
                    >
                      {category}
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">
                    Cargando categorías...
                  </p>
                )}
              </div>
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
