import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";

const queue = new Queue("reminders");

export async function reminderRoutes(app: FastifyInstance) {
  app.post("/reminders", async (req) => {
    const { scheduleId } = req.body as { scheduleId: string };
    req.log.info({ operation: "reminder.queue", schedule_id: scheduleId }, "reminder queued");
    await queue.add("remind", { scheduleId, userId: req.user.id });
    return { queued: true };
  });
}
