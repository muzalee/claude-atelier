import Fastify from "fastify";
import { inviteRoutes } from "./routes/invites.js";

const app = Fastify({ logger: true });
app.register(inviteRoutes);

app.setErrorHandler((err, req, reply) => {
  req.log.error({ err }, "request failed");
  reply.code(500).send({ error: "internal error" });
});

app.listen({ port: 3000 });
