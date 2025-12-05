import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { health_route } from "../routes/health.js";

interface HealthResponse {
	status: string;
	timestamp: string;
	uptime: number;
}

describe("health route", () => {
	let app: Hono;

	beforeEach(() => {
		app = new Hono();
		app.route("/health", health_route);
	});

	it("should return status ok", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);

		const json = (await res.json()) as HealthResponse;
		expect(json.status).toBe("ok");
	});

	it("should include timestamp", async () => {
		const res = await app.request("/health");
		const json = (await res.json()) as HealthResponse;

		expect(json.timestamp).toBeDefined();
		expect(new Date(json.timestamp).getTime()).not.toBeNaN();
	});

	it("should include uptime", async () => {
		const res = await app.request("/health");
		const json = (await res.json()) as HealthResponse;

		expect(json.uptime).toBeDefined();
		expect(typeof json.uptime).toBe("number");
		expect(json.uptime).toBeGreaterThan(0);
	});
});
