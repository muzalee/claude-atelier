import type { FastifyInstance } from "fastify";
import { db } from "../lib/db.js";

// one flat schedule per workspace — see README
export async function scheduleRoutes(app: FastifyInstance) {
  app.get("/schedule", async (req) => db.schedule.forWorkspace(req.user.workspaceId));

  app.post("/schedule/shifts", async (req) => {
    const shift = req.body as { start: string; end: string; assigneeId: string };
    return db.schedule.addShift(req.user.workspaceId, shift);
  });
}
