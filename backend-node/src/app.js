import express from "express";
import { errorHandler } from "./http/errors.js";
import { simulateFaults } from "./http/simulateFaults.js";
import { catalogRouter } from "./routes/catalog.js";
import { ordersRouter } from "./routes/orders.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api", simulateFaults);
  app.use("/api", catalogRouter);
  app.use("/api/orders", ordersRouter);
  app.get("/up", (req, res) => res.json({ status: "ok" }));
  app.use("/api", (req, res) => res.status(404).json({ message: "Not Found" }));
  app.use(errorHandler);

  return app;
}
