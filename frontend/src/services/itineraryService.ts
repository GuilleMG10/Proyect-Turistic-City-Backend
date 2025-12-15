import { ApiService } from './api';
import type {
  Itinerary,
  ItineraryItem,
  ItineraryGenerateRequest,
  GeneratedItinerary,
  Place,
  EventWithStatus
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class ItineraryService {
  private static getAuthToken(): string | null {
    const userStorage = localStorage.getItem('user-storage');
    if (!userStorage) return null;

    try {
      const parsed = JSON.parse(userStorage);
      return parsed.state?.token || null;
    } catch {
      return null;
    }
  }

  /**
   * Generate itinerary using AI
   * This will call the AI service to create an optimized itinerary based on user preferences
   */
  static async generateItinerary(
    request: ItineraryGenerateRequest,
    onProgress?: (text: string) => void
  ): Promise<GeneratedItinerary> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Get all available places and events for the AI
    const [places, events] = await Promise.all([
      ApiService.getPlaces(),
      ApiService.getEvents()
    ]);

    // Filter events for the selected date
    // Normalize dates to YYYY-MM-DD for reliable comparison
    const selectedDateStr = request.date.split('T')[0]; // Get just the date part
    const availableEvents = events.filter(event => {
      const eventDateStr = event.event_date.split('T')[0]; // Get just the date part
      return eventDateStr === selectedDateStr;
    });

    // Build the AI prompt
    const prompt = this.buildItineraryPrompt(request, places, availableEvents);

    try {
      const response = await fetch(`${API_BASE_URL}/ia/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          skipMemory: true, // Don't save itinerary prompts to chat memory
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              let data = line.slice(6);
              if (data === '[DONE]') break;

              // Parse JSON-encoded data
              if (data.startsWith('"')) {
                try {
                  data = JSON.parse(data);
                } catch {
                  // Use as-is if parsing fails
                }
              }

              if (data && data.trim()) {
                fullResponse += data;
                if (onProgress) {
                  onProgress(data);
                }
              }
            }
          }
        }
      }

      // Parse the AI response to extract the itinerary structure
      return this.parseAIResponse(fullResponse, places, availableEvents);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for AI to generate itinerary
   */
  private static buildItineraryPrompt(
    request: ItineraryGenerateRequest,
    places: Place[],
    events: EventWithStatus[]
  ): string {
    const preferences = request.preferences.join(', ');
    const pace = request.pace || 'moderate';

    // Filter places by user preferences to reduce prompt size
    const preferenceSet = new Set(request.preferences.map(p => p.toLowerCase()));
    const filteredPlaces = places
      .filter(p => p.active)
      .filter(p => {
        // Include if category matches any preference, or if it's a general interest (Gastronómico, Recreativo)
        const category = (p.category || '').toLowerCase();
        return preferenceSet.has(category) ||
          preferenceSet.size === 0 ||
          ['gastronómico', 'recreativo'].includes(category);
      })
      .slice(0, 20); // Limit to 20 places max to keep prompt size manageable

    // Format places information - include ID and handle undefined prices
    const placesInfo = filteredPlaces
      .map(p => {
        const price = p.price != null && !isNaN(p.price) ? `Bs.${p.price}` : 'Gratis';
        return `- ID:${p.id} | ${p.name} (${p.category}, Precio: ${price}, Ubicación: ${p.location})`;
      })
      .join('\n');

    // Format events information - include ID and handle undefined prices
    const eventsInfo = events.length > 0
      ? events.map(e => {
        const price = e.price != null && !isNaN(e.price) ? `Bs.${e.price}` : 'Gratis';
        return `- ID:${e.id} | ${e.name} (${e.category}, Precio: ${price}, Ubicación: ${e.location})`;
      }).join('\n')
      : 'No hay eventos disponibles para esta fecha.';

    return `Eres un asistente turístico experto en Cochabamba, Bolivia. Debes crear un itinerario para un turista.

DATOS DEL TURISTA:
- Fecha: ${request.date}
- Horario: de ${request.start_time} a ${request.end_time}
- Presupuesto: Bs.${request.budget}
- Preferencias: ${preferences}
- Ritmo: ${pace === 'relaxed' ? 'Relajado (más tiempo en cada lugar)' : pace === 'moderate' ? 'Moderado (balance entre visitas y descanso)' : 'Intenso (máximo de lugares posible)'}

LUGARES DISPONIBLES (usa el número ID para referenciar):
${placesInfo}

EVENTOS DISPONIBLES (tienen fecha específica y pueden tener costo de entrada):
${eventsInfo}

INSTRUCCIONES:
1. Selecciona 4-6 lugares/eventos que coincidan con las preferencias
2. Usa el ID numérico de cada lugar/evento en "item_id"
3. Para "estimated_cost", USA EL PRECIO indicado en cada lugar/evento. Si dice "Gratis" = 0, si dice "Bs.50" = 50
4. "total_cost" debe ser la SUMA de todos los "estimated_cost" de los items
5. Incluye tiempos realistas (1-2 horas por lugar)
6. Respeta el presupuesto máximo del turista
7. Si hay eventos disponibles para la fecha, considera incluirlos

RESPONDE SOLO CON ESTE JSON (sin texto adicional):
{
  "items": [
    {"type": "place", "item_id": 1, "start_time": "09:00", "end_time": "10:30", "estimated_cost": 0, "notes": "Descripción breve"},
    {"type": "event", "item_id": 5, "start_time": "11:00", "end_time": "13:00", "estimated_cost": 50, "notes": "Evento con entrada"}
  ],
  "total_cost": 50,
  "total_duration": "6 horas",
  "route_optimization": "Ruta optimizada por cercanía"
}`;
  }

  /**
   * Parse AI response to extract itinerary structure
   */
  private static parseAIResponse(
    response: string,
    places: Place[],
    events: EventWithStatus[]
  ): GeneratedItinerary {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON en la respuesta del asistente');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Check if items array is empty
      if (!parsed.items || parsed.items.length === 0) {
        throw new Error('El asistente no pudo generar un itinerario con los criterios especificados. Intenta con diferentes preferencias o un presupuesto mayor.');
      }

      // Validate and enrich the response - filter out invalid items instead of throwing
      const enrichedItems = parsed.items
        .filter((item: { type: string; item_id: number;[key: string]: unknown }) => {
          if (item.type === 'place') {
            const place = places.find(p => p.id === item.item_id);
            if (!place) {
              console.warn(`Place with ID ${item.item_id} not found, skipping`);
              return false;
            }
          } else if (item.type === 'event') {
            const event = events.find(e => e.id === item.item_id);
            if (!event) {
              console.warn(`Event with ID ${item.item_id} not found, skipping`);
              return false;
            }
          }
          return true;
        });

      // If all items were filtered out, throw an error
      if (enrichedItems.length === 0) {
        throw new Error('No se pudieron encontrar los lugares sugeridos por el asistente. Intenta generar de nuevo.');
      }

      return {
        items: enrichedItems,
        total_cost: parsed.total_cost || 0,
        total_duration: parsed.total_duration || '',
        route_optimization: parsed.route_optimization || ''
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw response:', response);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Hubo un problema al mostrarte las respuestas del asistente. Por favor intenta de nuevo.');
    }
  }

  /**
   * Get all itineraries for the current user
   */
  static async getItineraries(): Promise<Itinerary[]> {
    return ApiService.getItineraries();
  }

  /**
   * Create a new itinerary
   */
  static async createItinerary(itinerary: Omit<Itinerary, 'id' | 'created_at'>): Promise<Itinerary> {
    return ApiService.createItinerary(itinerary);
  }

  /**
   * Update an existing itinerary
   */
  static async updateItinerary(id: number, itinerary: Partial<Omit<Itinerary, 'id' | 'created_at'>>): Promise<Itinerary> {
    return ApiService.updateItinerary(id, itinerary);
  }

  /**
   * Delete an itinerary
   */
  static async deleteItinerary(id: number): Promise<void> {
    return ApiService.deleteItinerary(id);
  }

  /**
   * Add an item to an itinerary
   */
  static async addItem(itineraryId: number, item: Omit<ItineraryItem, 'id' | 'itinerary_id'>): Promise<ItineraryItem> {
    return ApiService.addItineraryItem(itineraryId, item);
  }

  /**
   * Delete an item from an itinerary
   */
  static async deleteItem(itineraryId: number, itemId: number): Promise<void> {
    return ApiService.deleteItineraryItem(itineraryId, itemId);
  }
}
