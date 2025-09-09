export type Place = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  category: string;            // turismo | cultura | etc.
  min_age: number | null;
  max_age: number | null;
  price_min: number | null;
  price_max: number | null;
  rating: number | null;       // promedio reseñas
  city: string | null;
  is_active: boolean;
};
