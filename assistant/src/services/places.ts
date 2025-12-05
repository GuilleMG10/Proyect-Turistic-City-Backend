import { get_places_store } from "../chroma/index.js";
import { create_child_logger } from "../logs/logger.js";
import type {
	Place,
	PlaceDocument,
	PlaceUpsertResult,
} from "../types/places.js";

const log = create_child_logger("places");

export async function upsert_places(
	places: Place[],
): Promise<PlaceUpsertResult[]> {
	const store = await get_places_store();
	const processed: PlaceUpsertResult[] = [];

	for (const place of places) {
		if (!place.name) continue;

		const name = place.name.trim();
		const description = place.description || "Sin descripción";
		const category = place.category || "Categoria no especificada";
		const type = place.type?.toLowerCase() === "evento" ? "evento" : "lugar";
		const atencion = place.atencion || "Horario no especificado";
		const tiempo_estimado_visita =
			place.tiempo_estimado_visita || "Tiempo de visita no especificado";
		const lo_mas_iconico_del_lugar =
			place.lo_mas_iconico_del_lugar || "No especificado";
		const estimated_price =
			place.estimated_price || "Precio estimado no especificado";

		const content = [
			`Nombre: ${name}`,
			`Descripcion: ${description}`,
			`Categoria: ${category}`,
			`Tipo: ${type}`,
			`Atención: ${atencion}`,
			`Tiempo estimado de visita: ${tiempo_estimado_visita}`,
			`Lo mas iconico del lugar: ${lo_mas_iconico_del_lugar}`,
			`Precio estimado: ${estimated_price} Bs`,
		].join("\n");

		const doc_id = `place_${name.toLowerCase().replace(/\s+/g, "_")}`;

		try {
			await store.delete([doc_id]);
			log.debug({ name }, "Deleted previous document if existed");
		} catch (err) {
			log.warn({ name, error: err }, "Could not delete previous document");
		}

		await store.add([
			{
				id: doc_id,
				content,
				metadata: {
					name,
					description,
					category,
					type,
					atencion,
					tiempo_estimado_visita,
					lo_mas_iconico_del_lugar,
					estimated_price,
				},
			},
		]);

		processed.push({ name, type, status: "upserted" });
	}

	log.info({ count: processed.length }, "Places upserted");
	return processed;
}

export async function search_places(
	query: string,
	top_k = 10,
): Promise<PlaceDocument[]> {
	const store = await get_places_store();

	const results = await store.search(query, top_k);

	log.debug({ query, count: results.length }, "Places search completed");

	return results.map((r) => ({
		name: (r.metadata.name as string) || "",
		description: (r.metadata.description as string) || "",
		category: (r.metadata.category as string) || "",
		type: (r.metadata.type as "lugar" | "evento") || "lugar",
		atencion: (r.metadata.atencion as string) || "",
		tiempo_estimado_visita: (r.metadata.tiempo_estimado_visita as string) || "",
		lo_mas_iconico_del_lugar:
			(r.metadata.lo_mas_iconico_del_lugar as string) || "",
		estimated_price: (r.metadata.estimated_price as string) || "",
		content: r.content,
	}));
}
