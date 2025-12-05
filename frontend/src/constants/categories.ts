/**
 * Centralized category definitions for the application.
 * These are used across PreferencesSelector, ItineraryGenerateModal, and filtering.
 */

// User preference categories - used in Profile preferences selector
export const USER_PREFERENCE_CATEGORIES = [
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
] as const;

// Itinerary generation categories - used in AI itinerary generation
export const ITINERARY_CATEGORIES = [
  'Lugares turísticos',
  'Cultural',
  'Gastronomía',
  'Entretenimiento',
  'Naturaleza',
  'Historia',
  'Compras',
  'Deportes',
] as const;

// Itinerary pace options
export const PACE_OPTIONS = [
  { value: 'relaxed' as const, label: 'Relajado', description: 'Más tiempo en cada lugar' },
  { value: 'moderate' as const, label: 'Moderado', description: 'Balance entre visitas y descanso' },
  { value: 'intense' as const, label: 'Intenso', description: 'Máximo de lugares posible' },
] as const;

// Type exports for type-safe usage
export type UserPreferenceCategory = typeof USER_PREFERENCE_CATEGORIES[number];
export type ItineraryCategory = typeof ITINERARY_CATEGORIES[number];
export type PaceOption = typeof PACE_OPTIONS[number];
export type PaceValue = PaceOption['value'];
