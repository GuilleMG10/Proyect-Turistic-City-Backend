export interface Place {
	name: string;
	description?: string | undefined;
	category?: string | undefined;
	type?: "lugar" | "evento" | undefined;
	atencion?: string | undefined;
	tiempo_estimado_visita?: string | undefined;
	lo_mas_iconico_del_lugar?: string | undefined;
	estimated_price?: string | undefined;
}

export interface PlaceDocument extends Place {
	content: string;
}

export interface PlaceUpsertResult {
	name: string;
	type: string;
	status: "upserted";
}
