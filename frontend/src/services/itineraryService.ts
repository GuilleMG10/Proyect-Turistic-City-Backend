import { ApiService } from "./api";
import type {
  Itinerary,
  ItineraryItem,
  ItineraryGenerateRequest,
  GeneratedItinerary,
  Place,
  EventWithStatus,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class ItineraryService {
  private static getAuthToken(): string | null {
    const userStorage = localStorage.getItem("user-storage");
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
    onProgress?: (text: string) => void,
  ): Promise<GeneratedItinerary> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      // Modificado: Llama al nuevo endpoint /ia/itinerary
      const response = await fetch(`${API_BASE_URL}/ia/itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Modificado: Envía el objeto request directamente
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
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
      // Modificado: Se quitan places y events, ya no son necesarios aquí
      return this.parseAIResponse(fullResponse);
    } catch (error) {
      console.error("Error generating itinerary:", error);
      throw error;
    }
  }

  /**
   * Build the prompt for AI to generate itinerary
   */
  // Eliminado: buildItineraryPrompt ya no es necesario

  /**
   * Parse AI response to extract itinerary structure
   */
  private static parseAIResponse(response: string): GeneratedItinerary {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate the structure
      if (!parsed.itinerario || !parsed.resumen) {
        throw new Error(
          'Invalid JSON structure from AI. Missing "itinerario" or "resumen".',
        );
      }

      return parsed as GeneratedItinerary;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.log("Raw response:", response);
      throw new Error(
        "Failed to parse AI response. The AI might have returned an invalid format.",
      );
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
  static async createItinerary(
    itinerary: Omit<Itinerary, "id" | "created_at">,
  ): Promise<Itinerary> {
    return ApiService.createItinerary(itinerary);
  }

  /**
   * Update an existing itinerary
   */
  static async updateItinerary(
    id: number,
    itinerary: Partial<Omit<Itinerary, "id" | "created_at">>,
  ): Promise<Itinerary> {
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
  static async addItem(
    itineraryId: number,
    item: Omit<ItineraryItem, "id" | "itinerary_id">,
  ): Promise<ItineraryItem> {
    return ApiService.addItineraryItem(itineraryId, item);
  }

  /**
   * Delete an item from an itinerary
   */
  static async deleteItem(itineraryId: number, itemId: number): Promise<void> {
    return ApiService.deleteItineraryItem(itineraryId, itemId);
  }
}
