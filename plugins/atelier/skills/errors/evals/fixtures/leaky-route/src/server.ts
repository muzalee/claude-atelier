import Fastify from "fastify";
import { projectRoutes } from "./routes/projects.js";

const app = Fastify({ logger: true });
app.register(projectRoutes);
app.listen({ port: 3000 });
