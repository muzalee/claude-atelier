import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";

const queue = new Queue("exports");

export async function exportRoutes(app: FastifyInstance) {
  app.post("/exports", async (req) => {
    const { exportId } = req.body as { exportId: string };
    await queue.add("export", { exportId, userId: req.user.id });
    return { queued: true };
  });
}
