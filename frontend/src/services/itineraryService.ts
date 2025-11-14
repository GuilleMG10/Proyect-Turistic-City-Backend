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
    const selectedDate = new Date(request.date).toDateString();
    const availableEvents = events.filter(event => 
      new Date(event.event_date).toDateString() === selectedDate
    );

    // Build the AI prompt
    const prompt = this.buildItineraryPrompt(request, places, availableEvents);

    try {
      const response = await fetch(`${API_BASE_URL}/ia/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
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
              const data = line.slice(6);
              if (data === '[DONE]') break;
              if (data.trim()) {
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
    
    // Format places information
    const placesInfo = places
      .filter(p => p.active)
      .map(p => `- ${p.name} (${p.category}, Precio: Bs.${p.price}, Ubicación: ${p.location}, Lat: ${p.latitude}, Lng: ${p.longitude})`)
      .join('\n');

    // Format events information
    const eventsInfo = events.length > 0
      ? events.map(e => `- ${e.name} (${e.category}, Precio: Bs.${e.price}, Ubicación: ${e.location}, Fecha: ${e.event_date})`)
          .join('\n')
      : 'No hay eventos disponibles para esta fecha.';

    return `Eres un asistente turístico experto en Cochabamba, Bolivia. Tu tarea es crear un itinerario optimizado para un turista.

**DATOS DEL TURISTA:**
- Fecha: ${request.date}
- Horario: de ${request.start_time} a ${request.end_time}
- Presupuesto: Bs.${request.budget}
- Preferencias: ${preferences}
- Ritmo del tour: ${pace} (${pace === 'relaxed' ? 'más tiempo en cada lugar' : pace === 'moderate' ? 'balance entre visitas y descanso' : 'máximo de lugares posible'})
${request.starting_point ? `- Punto de inicio: Lat ${request.starting_point.latitude}, Lng ${request.starting_point.longitude}` : ''}

**LUGARES DISPONIBLES:**
${placesInfo}

**EVENTOS DISPONIBLES:**
${eventsInfo}

**INSTRUCCIONES:**
1. Selecciona lugares y/o eventos que se ajusten a las preferencias del turista
2. Optimiza la ruta geográficamente para minimizar desplazamientos
3. Respeta el presupuesto total (suma de todos los costos debe ser ≤ Bs.${request.budget})
4. Distribuye el tiempo según el ritmo seleccionado
5. Incluye tiempo de desplazamiento entre ubicaciones
6. Proporciona una breve nota explicativa para cada parada

**FORMATO DE RESPUESTA (JSON):**
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después. El formato debe ser exactamente así:

{
  "items": [
    {
      "type": "place" o "event",
      "item_id": ID_del_lugar_o_evento,
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "estimated_cost": costo_en_bolivianos,
      "notes": "Breve descripción de por qué incluir esta parada"
    }
  ],
  "total_cost": suma_total_de_costos,
  "total_duration": "X horas Y minutos",
  "route_optimization": "Explicación breve de cómo optimizaste la ruta"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`;
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
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and enrich the response
      const enrichedItems = parsed.items.map((item: { type: string; item_id: number; [key: string]: unknown }) => {
        if (item.type === 'place') {
          const place = places.find(p => p.id === item.item_id);
          if (!place) throw new Error(`Place with ID ${item.item_id} not found`);
        } else if (item.type === 'event') {
          const event = events.find(e => e.id === item.item_id);
          if (!event) throw new Error(`Event with ID ${item.item_id} not found`);
        }
        return item;
      });

      return {
        items: enrichedItems,
        total_cost: parsed.total_cost || 0,
        total_duration: parsed.total_duration || '',
        route_optimization: parsed.route_optimization || ''
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw response:', response);
      throw new Error('Failed to parse AI response. The AI might have returned an invalid format.');
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
