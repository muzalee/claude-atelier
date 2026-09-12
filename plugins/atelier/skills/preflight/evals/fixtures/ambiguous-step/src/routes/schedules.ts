import type { FastifyInstance } from "fastify";

export async function scheduleRoutes(app: FastifyInstance) {
  app.get("/", async (request) => {
    return { schedules: [], tenantId: request.headers["x-tenant-id"] };
  });
}
