import { describe, expect, it } from "vitest";
import {
	itinerary_request_schema,
	places_request_schema,
	prompt_request_schema,
	vision_request_schema,
} from "../types/schemas.js";

describe("prompt_request_schema", () => {
	it("should validate a valid prompt request", () => {
		const result = prompt_request_schema.safeParse({
			prompt: "Hello, world!",
		});
		expect(result.success).toBe(true);
	});

	it("should reject empty prompt", () => {
		const result = prompt_request_schema.safeParse({
			prompt: "",
		});
		expect(result.success).toBe(false);
	});

	it("should reject missing prompt", () => {
		const result = prompt_request_schema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("should accept optional fields", () => {
		const result = prompt_request_schema.safeParse({
			prompt: "Test",
			user_id: "user123",
			skip_memory: true,
			provider: "ollama",
			interests: [{ name: "Museum", description: "Art museum" }],
		});
		expect(result.success).toBe(true);
	});
});

describe("places_request_schema", () => {
	it("should validate a valid places request", () => {
		const result = places_request_schema.safeParse({
			places: [{ name: "Test Place" }],
		});
		expect(result.success).toBe(true);
	});

	it("should reject empty places array", () => {
		const result = places_request_schema.safeParse({
			places: [],
		});
		expect(result.success).toBe(false);
	});

	it("should reject missing places", () => {
		const result = places_request_schema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("should accept full place object", () => {
		const result = places_request_schema.safeParse({
			places: [
				{
					name: "Museo",
					description: "Museo de arte",
					category: "Cultura",
					type: "lugar",
					atencion: "9am - 5pm",
					tiempo_estimado_visita: "2 horas",
					lo_mas_iconico_del_lugar: "Pinturas",
					estimated_price: "50",
				},
			],
		});
		expect(result.success).toBe(true);
	});
});

describe("vision_request_schema", () => {
	it("should validate empty object", () => {
		const result = vision_request_schema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("should accept all optional fields", () => {
		const result = vision_request_schema.safeParse({
			context: "Professional photo",
			provider: "modal",
			image_base64: "base64string",
		});
		expect(result.success).toBe(true);
	});
});

describe("itinerary_request_schema", () => {
	it("should validate empty object", () => {
		const result = itinerary_request_schema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("should accept full itinerary request", () => {
		const result = itinerary_request_schema.safeParse({
			nearby_places: [{ name: "Plaza" }],
			interests: [{ name: "Food" }],
			places_already_selected: [{ name: "Museum" }],
			budget: 500,
			schedule_availability: "Morning",
			maximum_itinerary_size: 5,
			provider: "modal-thinking",
		});
		expect(result.success).toBe(true);
	});
});
