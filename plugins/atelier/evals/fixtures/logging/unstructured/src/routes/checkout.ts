import type { FastifyInstance } from "fastify";
import { charge } from "../lib/payments.js";

export async function checkoutRoutes(app: FastifyInstance) {
  app.post("/checkout", async (req, reply) => {
    const { cartId, amountCents } = req.body as { cartId: string; amountCents: number };
    console.log("processing");

    try {
      const result = await charge(req.user.id, amountCents);
      console.log("user " + req.user.id + " checkout ok, order " + result.orderId);
      return result;
    } catch (e) {
      console.log("an error occurred");
      return reply.code(500).send({ error: "failed" });
    }
  });
}
