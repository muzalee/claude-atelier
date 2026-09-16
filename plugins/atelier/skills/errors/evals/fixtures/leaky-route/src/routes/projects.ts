import type { FastifyInstance } from "fastify";
import { db } from "../lib/db.js";

export async function projectRoutes(app: FastifyInstance) {
  app.get("/projects/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await db.projects.byId(id);
    if (!project) {
      throw new Error("not found");
    }
    return project;
  });

  app.post("/projects", async (req, reply) => {
    const body = req.body as { name?: string; tenantId?: string };
    if (!body.name) {
      return reply.code(400).send({ error: "name is required" });
    }
    try {
      return await db.projects.create(body);
    } catch (e) {
      // surface the DB message so the client knows what went wrong
      return reply.code(500).send({ error: (e as Error).message });
    }
  });
}
