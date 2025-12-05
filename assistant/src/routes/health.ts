import { Hono } from "hono";

export const health_route = new Hono();

health_route.get("/", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});
