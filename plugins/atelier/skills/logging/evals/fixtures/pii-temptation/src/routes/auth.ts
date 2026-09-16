import type { FastifyInstance } from "fastify";
import { verify, issueToken } from "../lib/auth.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = await verify(email, password);
    if (!user) {
      return reply.code(401).send({ error: "bad credentials" });
    }

    const token = await issueToken(user.id);
    return { token };
  });

  app.post("/password-reset", async (req) => {
    const { email } = req.body as { email: string };
    // support keeps asking us who requested a reset and when
    return { sent: true };
  });
}
