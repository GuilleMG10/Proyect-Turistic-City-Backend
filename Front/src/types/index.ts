// Backend response structure (matches Go model exactly)
export type BackendPlace = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  created_at: string;
  link_image: string;
  active: boolean;
  reviews?: BackendReview[];
  user?: BackendUser;
};

export type BackendReview = {
  id: number;
  user_id: number;
  place_id?: number;
  event_id?: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: BackendUser;
};

export type BackendUser = {
  id: number;
  name: string;
  email: string;
};

export type BackendEvent = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  event_date: string;
  category: string;
  price: number;
  created_at: string;
  reviews?: BackendReview[];
  user?: BackendUser;
};

// Frontend display structure (what our components expect)
export type Place = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  category: string;
  min_age: number | null;
  max_age: number | null;
  price_min: number | null;
  price_max: number | null;
  rating: number | null;
  city: string | null;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  created_at?: string;
};

export type Event = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  category: string;
  min_age: number | null;
  max_age: number | null;
  price_min: number | null;
  price_max: number | null;
  rating: number | null;
  city: string | null;
  is_active: boolean;
  event_date: string; // ISO date string
  venue: string | null;
  latitude?: number;
  longitude?: number;
  created_at?: string;
};
