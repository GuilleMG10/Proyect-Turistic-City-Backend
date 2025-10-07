import type { Event, User, Place, EventWithStatus, EventStatus, UserInterest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility function to determine event status
export function getEventStatus(eventDate: string): EventStatus {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  
  // Assuming events last 3 hours if no end time provided
  const eventEndTime = new Date(eventDateTime.getTime() + (3 * 60 * 60 * 1000));
  
  if (now < eventDateTime) {
    return 'upcoming';
  } else if (now >= eventDateTime && now <= eventEndTime) {
    return 'happening';
  } else {
    return 'finished';
  }
}

// API Service Functions
export class ApiService {
  private static getCacheKey(endpoint: string, options?: RequestInit): string {
    return `${endpoint}-${JSON.stringify(options?.body || '')}`;
  }

  private static getCachedData<T>(key: string): T | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      cache.delete(key); // Remove expired cache
    }
    return null;
  }

  private static setCachedData(key: string, data: any): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cachedData = this.getCachedData<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache successful GET responses
      if (!options.method || options.method === 'GET') {
        this.setCachedData(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Events API
  static async getEvents(query?: string): Promise<EventWithStatus[]> {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    const events = await this.request<Event[]>(`/events${params}`);
    
    // Add status to each event
    return events.map(event => ({
      ...event,
      status: getEventStatus(event.event_date)
    }));
  }

  static async getEventById(id: number): Promise<EventWithStatus> {
    const event = await this.request<Event>(`/events/${id}`);
    return {
      ...event,
      status: getEventStatus(event.event_date)
    };
  }

  static async createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // Places API
  static async getPlaces(query?: string): Promise<Place[]> {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request<Place[]>(`/places${params}`);
  }

  static async createPlace(place: Omit<Place, 'id' | 'created_at'>): Promise<Place> {
    return this.request<Place>('/places', {
      method: 'POST',
      body: JSON.stringify(place),
    });
  }

  // Users API
  static async getUserById(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  static async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  // Auth API
  static async login(username: string, password: string): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  static async register(data: {
    name: string;
    username: string;
    password: string;
    email?: string;
    age?: number;
  }): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reviews API
  static async getPlaceReviews(placeId: number): Promise<any[]> {
    return this.request<any[]>(`/places/${placeId}/reviews`);
  }

  // User Interests API (for favorites)
  static async getUserInterests(userId: number): Promise<UserInterest[]> {
    return this.request<UserInterest[]>(`/users/${userId}/interests`);
  }

  static async addUserInterest(userId: number, eventId: number): Promise<UserInterest> {
    return this.request<UserInterest>(`/users/${userId}/interests`, {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId }),
    });
  }

  static async removeUserInterest(userId: number, eventId: number): Promise<void> {
    return this.request<void>(`/users/${userId}/interests/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Place Favorites API
  static async getPlaceFavorites(userId: number): Promise<any[]> {
    return this.request<any[]>(`/users/${userId}/favorites`);
  }

  static async addPlaceFavorite(userId: number, placeId: number): Promise<any> {
    return this.request<any>(`/users/${userId}/favorites`, {
      method: 'POST',
      body: JSON.stringify({ place_id: placeId }),
    });
  }

  static async removePlaceFavorite(userId: number, placeId: number): Promise<void> {
    return this.request<void>(`/users/${userId}/favorites/${placeId}`, {
      method: 'DELETE',
    });
  }
}

