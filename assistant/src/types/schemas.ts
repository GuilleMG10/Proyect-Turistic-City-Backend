import { z } from "zod";

export const prompt_request_schema = z
	.object({
		prompt: z.string().min(1, "The 'prompt' field is required."),
		user_id: z.union([z.string(), z.number()]).optional(),
		userId: z.union([z.string(), z.number()]).optional(),
		image_base64: z.string().optional(),
		interests: z
			.array(
				z.object({
					name: z.string(),
					description: z.string(),
					category: z.string().optional(),
				}),
			)
			.optional(),
		skip_memory: z.boolean().optional(),
		skipMemory: z.boolean().optional(),
		provider: z.string().optional(),
		model: z.enum(["fast", "thinking"]).optional().or(z.literal("")),
	})
	.transform((data) => {
		const raw_id = data.user_id ?? data.userId;
		return {
			...data,
			user_id: raw_id ? String(raw_id) : undefined,
			skip_memory: data.skip_memory ?? data.skipMemory ?? false,
		};
	});

export const places_request_schema = z.object({
	places: z
		.array(
			z.object({
				name: z.string(),
				description: z.string().optional(),
				category: z.string().optional(),
				type: z.enum(["lugar", "evento"]).optional(),
				atencion: z.string().optional(),
				tiempo_estimado_visita: z.string().optional(),
				lo_mas_iconico_del_lugar: z.string().optional(),
				estimated_price: z.string().optional(),
			}),
		)
		.min(1, "The 'places' field must have at least one element."),
});

export const vision_request_schema = z.object({
	context: z.string().optional(),
	provider: z.string().optional(),
	image_base64: z.string().optional(),
});

export const itinerary_request_schema = z.object({
	nearby_places: z.array(z.object({ name: z.string() })).optional(),
	interests: z.array(z.object({ name: z.string() })).optional(),
	places_already_selected: z.array(z.object({ name: z.string() })).optional(),
	budget: z.number().optional(),
	schedule_availability: z.string().optional(),
	maximum_itinerary_size: z.number().optional(),
	provider: z.string().optional(),
});

export type PromptRequestValidated = z.infer<typeof prompt_request_schema>;
export type PlacesRequestValidated = z.infer<typeof places_request_schema>;
export type VisionRequestValidated = z.infer<typeof vision_request_schema>;
export type ItineraryRequestValidated = z.infer<
	typeof itinerary_request_schema
>;
