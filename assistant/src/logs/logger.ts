import pino from "pino";
import { env } from "../config/env.js";

if (process.platform === "win32") {
	process.stdout.setDefaultEncoding?.("utf8");
	process.stderr.setDefaultEncoding?.("utf8");
}

const is_production = process.env.NODE_ENV === "production";

function get_transport():
	| pino.TransportSingleOptions
	| pino.TransportMultiOptions
	| undefined {
	const targets: pino.TransportTargetOptions[] = [];

	if (!is_production) {
		targets.push({
			level: env.LOG_LEVEL,
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "SYS:standard",
				ignore: "pid,hostname",
			},
		});
	}

	if (env.LOG_FILE) {
		targets.push({
			level: env.LOG_LEVEL,
			target: "pino/file",
			options: { destination: env.LOG_FILE, mkdir: true },
		});
	}

	if (targets.length === 0) return undefined;
	if (targets.length === 1) return targets[0];
	return { targets };
}

const transport = get_transport();

export const logger = transport
	? pino({ level: env.LOG_LEVEL, transport })
	: pino({ level: env.LOG_LEVEL });

export const create_child_logger = (name: string) =>
	logger.child({ module: name });
