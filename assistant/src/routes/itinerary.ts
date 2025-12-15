import { Hono } from "hono";
import { stream } from "hono/streaming";
import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import { build_itinerary_prompt } from "../prompts/index.js";
import { get_provider, is_thinking_provider } from "../providers/index.js";
import { search_places } from "../services/places.js";
import { STREAM_DONE } from "../types/ai.js";
import type { PlaceDocument } from "../types/places.js";
import { itinerary_request_schema } from "../types/schemas.js";

const log = create_child_logger("routes:itinerary");

export const itinerary_route = new Hono();

itinerary_route.post("/", async (c) => {
	const body = await c.req.json();
	const result = itinerary_request_schema.safeParse(body);

	if (!result.success) {
		return c.json({ error: result.error.issues[0]?.message }, 400);
	}

	const {
		nearby_places = [],
		interests = [],
		places_already_selected = [],
		budget,
		schedule_availability,
		maximum_itinerary_size,
		provider: req_provider,
	} = result.data;

	log.info("Itinerary generation request");

	c.header("Content-Type", "text/event-stream");
	c.header("Cache-Control", "no-cache");
	c.header("Connection", "keep-alive");

	return stream(c, async (s) => {
		try {
			const collected: PlaceDocument[] = [];

			const add_unique = (places: PlaceDocument[]) => {
				for (const p of places) {
					if (!collected.some((c) => c.name === p.name)) {
						collected.push(p);
					}
				}
			};

			for (const place of nearby_places) {
				const results = await search_places(place.name, 1);
				add_unique(results);
			}

			for (const place of places_already_selected) {
				const results = await search_places(place.name, 1);
				add_unique(results);
			}

			for (const place of interests) {
				const results = await search_places(place.name, 2);
				add_unique(results);
			}

			if (schedule_availability) {
				const schedule_results = await search_places(schedule_availability, 5);
				add_unique(schedule_results);
			}

			log.debug({ count: collected.length }, "Places collected for itinerary");

			const names_nearby = nearby_places.map((p) => p.name).join(", ");
			const names_selected = places_already_selected
				.map((p) => p.name)
				.join(", ");
			const names_interests = interests.map((p) => p.name).join(", ");

			const places_details = collected
				.map(
					(p) => `• ${p.name}
  - Tipo: ${p.type || "lugar"}
  - Categoria: ${p.category}
  - Horario: ${p.atencion}
  - Precio estimado: ${p.estimated_price || "Gratis"}
  - Lo más iconico: ${p.lo_mas_iconico_del_lugar}
  - Tiempo estimado de visita: ${p.tiempo_estimado_visita}
  `,
				)
				.join("\n\n");

			const final_prompt = build_itinerary_prompt({
				names_nearby,
				names_selected,
				names_interests,
				places_details,
				budget,
				schedule_availability,
				maximum_itinerary_size,
			});

			const on_data = (chunk: string) => {
				s.write(`data: ${chunk}\n\n`);
			};

			const provider_name = req_provider || env.AI_PROVIDER;
			const provider = get_provider(
				provider_name === "modal" ? "modal-thinking" : provider_name,
			);

			log.debug({ provider: provider_name }, "Generating itinerary");

			if (is_thinking_provider(provider_name) && provider.stream_thinking) {
				await provider.stream_thinking(final_prompt, on_data);
			} else {
				await provider.stream(final_prompt, on_data);
			}

			s.write(`data: ${STREAM_DONE}\n\n`);
		} catch (error) {
			log.error({ error }, "Error generating itinerary");
			s.write(`data: {"error": "Error generating itinerary"}\n\n`);
		}
	});
});
