import { Worker } from "bullmq";
import { randomUUID } from "node:crypto";
import { logger } from "./logger.js";

new Worker("reminders", async (job) => {
  // fresh id per job run
  const log = logger.child({ trace_id: randomUUID() });
  await send(job.data.scheduleId);
  log.info("done");
});

async function send(_scheduleId: string) {}
