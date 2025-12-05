import { Hono } from "hono";
import { capabilities_route } from "./capabilities.js";
import { health_route } from "./health.js";
import { itinerary_route } from "./itinerary.js";
import { places_route } from "./places.js";
import { prompt_route } from "./prompt.js";
import { vision_route } from "./vision.js";

export const ia_routes = new Hono();

ia_routes.route("/prompt", prompt_route);
ia_routes.route("/places", places_route);
ia_routes.route("/vision", vision_route);
ia_routes.route("/itinerary", itinerary_route);
ia_routes.route("/capabilities", capabilities_route);

export { health_route };
