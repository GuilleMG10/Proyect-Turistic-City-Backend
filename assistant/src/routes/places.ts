import { Hono } from "hono";
import { create_child_logger } from "../logs/logger.js";
import { upsert_places } from "../services/places.js";
import { places_request_schema } from "../types/schemas.js";

const log = create_child_logger("routes:places");

export const places_route = new Hono();

places_route.post("/", async (c) => {
	const body = await c.req.json();
	const result = places_request_schema.safeParse(body);

	if (!result.success) {
		return c.json({ error: result.error.issues[0]?.message }, 400);
	}

	const { places } = result.data;

	log.info({ count: places.length }, "Places registration request");

	try {
		const result = await upsert_places(places);

		log.info({ processed: result.length }, "Places processed");

		return c.json({
			message: "Lugares registrados o actualizados correctamente",
			processed: result,
		});
	} catch (error) {
		log.error({ error }, "Error registering places");
		return c.json({ error: "Error registrando o actualizando lugares" }, 500);
	}
});
