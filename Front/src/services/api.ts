import type { Place, BackendPlace, BackendReview, BackendEvent, Event } from '../types';

export interface Review {
  id: number;
  user_id: number;
  place_id?: number;
  event_id?: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export class ApiService {
  static async getPlaces(query?: string): Promise<Place[]> {
    const cacheKey = `getPlaces:${query || ''}`;

    // If a request for the same query is already in flight, return its promise
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    const request = (async () => {
      try {
        const url = new URL('/places', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081');
        if (query) {
          url.searchParams.set('q', query);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          // Log the detailed error from the backend if available
          const errorBody = await response.text();
          console.error('Backend error:', errorBody);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const backendPlaces: BackendPlace[] = await response.json();
        
        // Transform backend data to frontend format
        return backendPlaces.map((backendPlace): Place => ({
          id: backendPlace.id.toString(),
          name: backendPlace.name,
          description: backendPlace.description,
          image_url: backendPlace.link_image || null,
          category: backendPlace.category,
          min_age: null, // Not available in backend model
          max_age: null, // Not available in backend model
          price_min: null, // Not available in backend model
          price_max: null, // Not available in backend model
          rating: backendPlace.reviews ? 
            backendPlace.reviews.reduce((sum, review) => sum + review.rating, 0) / backendPlace.reviews.length : 
            null,
          city: backendPlace.location,
          is_active: backendPlace.active,
          latitude: backendPlace.latitude,
          longitude: backendPlace.longitude,
          created_at: backendPlace.created_at,
        }));
      } catch (error) {
        console.error('Failed to fetch places:', error);
        // Important: Remove the failed promise from the cache
        requestCache.delete(cacheKey);
        // Re-throw the error to be handled by the calling component
        throw error;
      }
    })();

    // Store the promise in the cache
    requestCache.set(cacheKey, request);

    // Set a timeout to clear the cache entry after a short period (e.g., 2 seconds)
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 2000);

    return request;
  }

  static async getEvents(query?: string): Promise<Event[]> {
    const cacheKey = `getEvents:${query || ''}`;

    // If a request for the same query is already in flight, return its promise
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    const request = (async () => {
      try {
        const url = new URL('/events', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081');
        if (query) {
          url.searchParams.set('q', query);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          // Log the detailed error from the backend if available
          const errorBody = await response.text();
          console.error('Backend error:', errorBody);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const backendEvents: BackendEvent[] = await response.json();
        
        // Transform backend data to frontend format
        return backendEvents.map((backendEvent): Event => ({
          id: backendEvent.id.toString(),
          name: backendEvent.name,
          description: backendEvent.description,
          image_url: null, // Will need to add image field to backend later
          category: backendEvent.category,
          min_age: null, // Will need to add to backend later
          max_age: null, // Will need to add to backend later
          price_min: backendEvent.price,
          price_max: backendEvent.price,
          rating: backendEvent.reviews ? 
            backendEvent.reviews.reduce((sum, review) => sum + review.rating, 0) / backendEvent.reviews.length : 
            null,
          city: backendEvent.location,
          is_active: true, // Assuming all events in DB are active
          event_date: backendEvent.event_date,
          venue: backendEvent.location,
          latitude: backendEvent.latitude,
          longitude: backendEvent.longitude,
          created_at: backendEvent.created_at,
        }));
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // Important: Remove the failed promise from the cache
        requestCache.delete(cacheKey);
        // Re-throw the error to be handled by the calling component
        throw error;
      }
    })();

    // Store the promise in the cache
    requestCache.set(cacheKey, request);

    // Set a timeout to clear the cache entry after a short period (e.g., 2 seconds)
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 2000);

    return request;
  }

  static async getPlaceReviews(placeId: string): Promise<Review[]> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${baseUrl}/places/${placeId}/reviews`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendReviews: BackendReview[] = await response.json();
      
      // Transform backend reviews to frontend format
      return backendReviews.map((backendReview): Review => ({
        id: backendReview.id,
        user_id: backendReview.user_id,
        place_id: backendReview.place_id,
        event_id: backendReview.event_id,
        rating: backendReview.rating,
        comment: backendReview.comment,
        created_at: backendReview.created_at,
        user: backendReview.user,
      }));
    } catch (error) {
      console.error('Error fetching place reviews:', error);
      throw error;
    }
  }

  static async createPlace(place: Omit<Place, 'id'>): Promise<Place> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${baseUrl}/places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Transform frontend format to backend format
          user_id: 1, // Default user, you might want to get this from auth
          name: place.name,
          description: place.description,
          location: place.city || '',
          latitude: place.latitude || 0,
          longitude: place.longitude || 0,
          category: place.category,
          link_image: place.image_url || '',
          active: place.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendPlace: BackendPlace = await response.json();
      
      // Transform response back to frontend format
      return {
        id: backendPlace.id.toString(),
        name: backendPlace.name,
        description: backendPlace.description,
        image_url: backendPlace.link_image || null,
        category: backendPlace.category,
        min_age: null,
        max_age: null,
        price_min: null,
        price_max: null,
        rating: null,
        city: backendPlace.location,
        is_active: backendPlace.active,
        latitude: backendPlace.latitude,
        longitude: backendPlace.longitude,
        created_at: backendPlace.created_at,
      };
    } catch (error) {
      console.error('Error creating place:', error);
      throw error;
    }
  }
}

// In-memory cache and request deduplication
const requestCache = new Map<string, Promise<any>>();