import type { Event, User, Place, EventWithStatus, EventStatus, UserInterest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

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
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
      
      return await response.json();
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
}

