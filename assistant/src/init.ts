import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { logger } from "./logs/logger.js";
import { health_route, ia_routes } from "./routes/index.js";

const app = new Hono();

app.use(
	"*",
	cors({
		origin: env.FRONTEND_URL,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Accept", "Authorization"],
		credentials: true,
	}),
);

app.route("/health", health_route);
app.route("/ia", ia_routes);

app.onError((err, c) => {
	logger.error({ error: err.message, stack: err.stack }, "Unhandled error");
	return c.json({ error: "Internal server error" }, 500);
});

const server = serve(
	{
		fetch: app.fetch,
		port: env.AI_PORT,
	},
	(info) => {
		logger.info({ port: info.port }, "Server started");
	},
);

process.on("uncaughtException", (err) => {
	logger.fatal({ error: err.message, stack: err.stack }, "Uncaught exception");
});

process.on("unhandledRejection", (reason) => {
	logger.fatal({ reason }, "Unhandled rejection");
});

process.on("SIGTERM", () => {
	logger.info("SIGTERM received, shutting down");
	server.close();
	process.exit(0);
});
