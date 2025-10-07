// Database-aligned types
export type Place = {
  id: number;                  // integer in DB
  user_id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  created_at: string;          // timestamp
  link_image: string | null;   // matches DB field name
  active: boolean;             // matches DB field name
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
  event_date: string;          // timestamp without time zone
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
  rating: number;              // 1-5 rating
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

// Event status based on current time
export type EventStatus = 'upcoming' | 'happening' | 'finished';

export type EventWithStatus = Event & {
  status: EventStatus;
};
