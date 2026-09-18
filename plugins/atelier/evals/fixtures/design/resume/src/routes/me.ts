import type { FastifyInstance } from "fastify";
import { db } from "../lib/db.js";

export async function meRoutes(app: FastifyInstance) {
  app.get("/me", async (req) => ({ id: req.user.id }));
}
