import type { Place } from "./places.js";

export interface PromptRequest {
	prompt: string;
	user_id?: string;
	interests?: Array<{ name: string; description: string; category?: string }>;
	skip_memory?: boolean;
	provider?: string;
}

export interface PlacesRequest {
	places: Place[];
}

export interface VisionRequest {
	context?: string;
	provider?: string;
	image_base64?: string;
}

export interface ItineraryRequest {
	nearby_places?: Array<{ name: string }>;
	interests?: Array<{ name: string }>;
	places_already_selected?: Array<{ name: string }>;
	budget?: number;
	schedule_availability?: string;
	maximum_itinerary_size?: number;
	provider?: string;
}

export interface ItineraryItem {
	lugar: string;
	dia_sugerido: string;
	horario_sugerido: string;
	costo_estimado: string;
	motivo_eleccion: string;
	tiempo_estimado_visita: string;
}

export interface ItineraryResponse {
	itinerario: ItineraryItem[];
	resumen: {
		presupuesto_total_estimado: string;
		cantidad_lugares: string;
		tiempo_total_estimado: string;
		notas_adicionales: string;
	};
}
