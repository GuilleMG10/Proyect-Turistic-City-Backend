export interface ItineraryPromptData {
	names_nearby: string;
	names_selected: string;
	names_interests: string;
	places_details: string;
	budget?: number | undefined;
	schedule_availability?: string | undefined;
	maximum_itinerary_size?: number | undefined;
}

export const ITINERARY_TEMPLATE = `
Eres un generador de itinerarios. Debes responder exclusivamente en JSON válido.

INSTRUCCIONES OBLIGATORIAS Y ESTRICTAS:
- Tu salida debe ser exclusivamente un JSON válido.
- No debes agregar texto fuera del JSON.
- No debes explicar nada.
- No debes añadir títulos.
- No uses asteriscos, viñetas, markdown, comentarios ni texto adicional.
- Solo devuelve el JSON EXACTO.
- Si quieres explicar algo, hazlo dentro de "notas_adicionales".
- Respeta la disponibilidad horaria del usuario (si un lugar no calza, NO lo incluyas).
- Respeta el presupuesto total del usuario.
- Respeta el límite máximo de lugares.
- Incluye los lugares obligatorios que el usuario quiere incluir en "placesAlreadySelected" solamente si es posible según horarios.
- Cada lugar tiene un tiempo estimado de visita: puedes igualarlo o reducirlo al crear el itinerario, pero nunca excederlo.

LUGARES CERCANOS:
{{NAMES_NEARBY}}

LUGARES OBLIGATORIOS QUE EL USUARIO QUIERE INCLUIR:
{{NAMES_SELECTED}}

LUGARES FAVORITOS DEL USUARIO:
{{NAMES_INTERESTS}}

INFORMACIÓN COMPLETA DE LOS LUGARES DISPONIBLES (RAG):
{{PLACES_DETAILS}}

DATOS DEL USUARIO:
- Presupuesto total: {{BUDGET}} Bs
- Horario disponible: {{SCHEDULE_AVAILABILITY}}
- Máximo de lugares: {{MAXIMUM_ITINERARY_SIZE}}

FORMATO ESTRICTO (OBLIGATORIO).
Debes responder EXACTAMENTE con esta estructura JSON, sin agregar ni quitar claves:

\`\`\`json
{
  "itinerario": [
    {
      "lugar": "",
      "dia_sugerido": "",
      "horario_sugerido": "",
      "costo_estimado": "",
      "motivo_eleccion": "",
      "tiempo_estimado_visita": ""
    }
  ],
  "resumen": {
    "presupuesto_total_estimado": "",
    "cantidad_lugares": "",
    "tiempo_total_estimado": "",
    "notas_adicionales": ""
  }
}
\`\`\`

NO ESCRIBAS NINGÚN TEXTO FUERA DEL JSON.

Devuelve SOLO el JSON. Nada más.
`;

export function build_itinerary_prompt(data: ItineraryPromptData): string {
	return ITINERARY_TEMPLATE.replace(
		"{{NAMES_NEARBY}}",
		data.names_nearby || "(sin datos)",
	)
		.replace("{{NAMES_SELECTED}}", data.names_selected || "(sin datos)")
		.replace("{{NAMES_INTERESTS}}", data.names_interests || "(sin datos)")
		.replace("{{PLACES_DETAILS}}", data.places_details || "(sin datos)")
		.replace("{{BUDGET}}", String(data.budget ?? "No especificado"))
		.replace(
			"{{SCHEDULE_AVAILABILITY}}",
			data.schedule_availability || "No especificado",
		)
		.replace(
			"{{MAXIMUM_ITINERARY_SIZE}}",
			String(data.maximum_itinerary_size ?? "No especificado"),
		);
}
