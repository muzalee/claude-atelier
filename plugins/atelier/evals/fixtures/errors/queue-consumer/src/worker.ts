import { Worker } from "bullmq";
import { sendExport } from "./export.js";

// processes export jobs queued by POST /exports
new Worker("exports", async (job) => {
  try {
    await sendExport(job.data.exportId, job.data.userId);
  } catch (e) {
    console.error("export failed", e);
    // swallow so the queue doesn't keep retrying
  }
});
