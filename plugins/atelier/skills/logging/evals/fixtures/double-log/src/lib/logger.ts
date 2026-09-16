import pino from "pino";
export const logger = pino({ base: { service: "cadence-api" } });
