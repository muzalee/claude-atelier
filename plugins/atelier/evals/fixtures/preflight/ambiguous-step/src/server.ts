import Fastify from "fastify";
import { scheduleRoutes } from "./routes/schedules.js";

export const app = Fastify({ logger: true });

await app.register(scheduleRoutes, { prefix: "/api/schedules" });
