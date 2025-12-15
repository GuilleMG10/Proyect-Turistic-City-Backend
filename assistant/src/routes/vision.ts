import { Hono } from "hono";
import { stream } from "hono/streaming";
import { env } from "../config/env.js";
import { create_child_logger } from "../logs/logger.js";
import { analyze_profile_image } from "../services/vision.js";
import { STREAM_DONE } from "../types/ai.js";

const log = create_child_logger("routes:vision");

export const vision_route = new Hono();

// Generic vision endpoint - handles image analysis requests
vision_route.post("/", async (c) => {
	const content_type = c.req.header("content-type") || "";

	let image_base64: string | undefined;
	let context: string | undefined;
	let provider: string | undefined;

	if (content_type.includes("multipart/form-data")) {
		const form_data = await c.req.formData();
		const image_file = form_data.get("image");
		context = form_data.get("context")?.toString();
		provider = form_data.get("provider")?.toString();

		if (image_file instanceof File) {
			const array_buffer = await image_file.arrayBuffer();
			image_base64 = Buffer.from(array_buffer).toString("base64");
		}
	} else {
		const body = await c.req.json();
		// Accept both snake_case and camelCase for compatibility
		image_base64 = body.image_base64 || body.imageBase64;
		context = body.context;
		provider = body.provider;
	}

	if (!image_base64) {
		return c.json(
			{ error: "You must send an image in base64 or as a file." },
			400,
		);
	}

	const provider_name = provider || env.AI_PROVIDER;

	log.info({ provider: provider_name }, "Vision request");

	c.header("Content-Type", "text/event-stream");
	c.header("Cache-Control", "no-cache");
	c.header("Connection", "keep-alive");

	return stream(c, async (s) => {
		try {
			let full_response = "";

			const on_data = (chunk: string) => {
				full_response += chunk;
				s.write(`data: ${chunk}\n\n`);
			};

			await analyze_profile_image(
				image_base64,
				provider_name,
				on_data,
				context,
			);

			s.write(`data: ${STREAM_DONE}\n\n`);

			log.debug({ response_length: full_response.length }, "Vision complete");
		} catch (error) {
			const err_msg = error instanceof Error ? error.message : String(error);
			log.error({ error: err_msg }, "Error processing vision request");
			s.write(`data: {"error": "${err_msg}"}\n\n`);
			s.write(`data: ${STREAM_DONE}\n\n`);
		}
	});
});

vision_route.post("/profile", async (c) => {
	const content_type = c.req.header("content-type") || "";

	let image_base64: string | undefined;
	let context: string | undefined;
	let provider: string | undefined;

	if (content_type.includes("multipart/form-data")) {
		const form_data = await c.req.formData();
		const image_file = form_data.get("image");
		context = form_data.get("context")?.toString();
		provider = form_data.get("provider")?.toString();

		if (image_file instanceof File) {
			const array_buffer = await image_file.arrayBuffer();
			image_base64 = Buffer.from(array_buffer).toString("base64");
		}
	} else {
		const body = await c.req.json();
		// Accept both snake_case and camelCase for compatibility
		image_base64 = body.image_base64 || body.imageBase64;
		context = body.context;
		provider = body.provider;
	}

	if (!image_base64) {
		return c.json(
			{ error: "You must send an image in base64 or as a file." },
			400,
		);
	}

	const provider_name = provider || env.AI_PROVIDER;

	log.info({ provider: provider_name }, "Profile vision request");

	c.header("Content-Type", "text/event-stream");
	c.header("Cache-Control", "no-cache");
	c.header("Connection", "keep-alive");

	return stream(c, async (s) => {
		try {
			let full_response = "";

			const on_data = (chunk: string) => {
				full_response += chunk;
				s.write(`data: ${chunk}\n\n`);
			};

			await analyze_profile_image(
				image_base64,
				provider_name,
				on_data,
				context,
			);

			s.write(`data: ${STREAM_DONE}\n\n`);

			log.debug(
				{ response_length: full_response.length },
				"Profile vision complete",
			);
		} catch (error) {
			const err_msg = error instanceof Error ? error.message : String(error);
			log.error({ error: err_msg }, "Error processing profile vision request");
			s.write(`data: {"error": "${err_msg}"}\n\n`);
			s.write(`data: ${STREAM_DONE}\n\n`);
		}
	});
});
