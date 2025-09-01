import express from "express";
import maskRoute from "./routes/mask";
import unmaskRoute from "./routes/unmask";
import healthRoute from "./routes/health";
import rateLimit from "express-rate-limit";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));

  app.use("/api", maskRoute);
  app.use("/api", unmaskRoute);
  app.use("/api", healthRoute);

  app.use((req: any, _res: any, next: any) => {
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT ?? 5000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}
