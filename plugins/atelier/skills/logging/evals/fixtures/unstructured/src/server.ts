import Fastify from "fastify";
import { checkoutRoutes } from "./routes/checkout.js";

const app = Fastify();
app.register(checkoutRoutes);
app.listen({ port: 3000 });
