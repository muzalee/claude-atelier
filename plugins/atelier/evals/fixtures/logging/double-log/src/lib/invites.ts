import { logger } from "./logger.js";

export async function sendInvite(actorId: string, email: string) {
  try {
    return await deliver(email);
  } catch (e) {
    logger.error({ err: e, actorId }, "delivery failed");
    throw new Error("invite failed");
  }
}

async function deliver(_email: string) {
  throw new Error("smtp timeout");
}
