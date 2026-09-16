import type { FastifyInstance } from "fastify";
import { sendInvite } from "../lib/invites.js";

export async function inviteRoutes(app: FastifyInstance) {
  app.post("/invites", async (req, reply) => {
    const { email } = req.body as { email: string };
    try {
      return await sendInvite(req.user.id, email);
    } catch (e) {
      req.log.error({ err: e }, "invite failed");
      throw e;
    }
  });
}
