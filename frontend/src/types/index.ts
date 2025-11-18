// Database-aligned types
export type Place = {
  id: number; // integer in DB
  user_id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  price: number; // Added price field for itinerary
  created_at: string; // timestamp
  link_image: string | null; // matches DB field name
  active: boolean; // matches DB field name
  display_number?: number; // Frontend-only: assigned display number
  reviews?: Review[];
  user?: User;
};

export type Event = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  event_date: string; // timestamp without time zone
  category: string;
  price: number;
  created_at: string;
  reviews?: Review[];
  user?: User;
};

export type User = {
  id: number;
  name: string;
  age: number | null;
  username: string;
  password_hash: string;
  role_id: number | null;
  email: string | null;
  created_at: string;
  active: boolean;
};

export type Review = {
  id: number;
  user_id: number;
  place_id: number | null;
  event_id: number | null;
  rating: number; // 1-5 rating
  comment: string;
  created_at: string;
  user?: User;
};

// Use existing user_interests table for favorites
export type UserInterest = {
  id: number;
  user_id: number;
  event_id: number;
  active: boolean;
  created_at: string;
};

// Place favorites (similar to user interests but for places)
export type PlaceFavorite = {
  id: number;
  user_id: number;
  place_id: number;
  active: boolean;
  created_at: string;
};

// User preferences for categories
export type UserPreference = {
  id: number;
  user_id: number;
  category: string;
  active: boolean;
  created_at: string;
};

// Event status based on current time
export type EventStatus = "upcoming" | "happening" | "finished";

export type EventWithStatus = Event & {
  status: EventStatus;
};

// Itinerary types
export type Itinerary = {
  id: number;
  user_id: number;
  name: string;
  date: string; // Date of the itinerary
  start_time: string; // Start time (e.g., "09:00")
  end_time: string; // End time (e.g., "18:00")
  budget: number; // Total budget
  preferences: string; // JSON string of category preferences
  total_cost: number; // Calculated total cost
  created_at: string;
  items?: ItineraryItem[];
};

export type ItineraryItem = {
  id: number;
  itinerary_id: number;
  place_id: number | null; // Reference to place
  event_id: number | null; // Reference to event
  order: number; // Order in the itinerary
  start_time: string; // Start time for this item (e.g., "09:00")
  end_time: string; // End time for this item (e.g., "11:00")
  notes: string; // Additional notes
  place?: Place; // Populated place data
  event?: EventWithStatus; // Populated event data
};

// For AI generation request
export type ItineraryGenerateRequest = {
  date: string;
  start_time: string;
  end_time: string;
  budget: number;
  preferences: string[]; // Array of category preferences
  pace?: "relaxed" | "moderate" | "intense";
  starting_point?: {
    latitude: number;
    longitude: number;
  };
};

// AI generated itinerary response (before saving)
// Modificado para coincidir con la respuesta real de la IA
export type GeneratedItinerary = {
  itinerario: Array<{
    lugar: string;
    dia_sugerido: string;
    horario_sugerido: string;
    costo_estimado: string;
    motivo_eleccion: string;
    tiempo_estimado_visita: string;
  }>;
  resumen: {
    presupuesto_total_estimado: string;
    cantidad_lugares: string;
    tiempo_total_estimado: string;
    notas_adicionales: string;
  };
};
