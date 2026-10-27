import { config } from "../config.js";
import { withFaultMode } from "../faults/faultInjector.js";

/**
 * Lets QA trigger simulated database faults with an `X-Simulate-Fault` header
 * (or FAULT_ORDER_EVENTS for every request). Never active in production.
 */
export function simulateFaults(req, res, next) {
  if (config.env === "production") return next();

  withFaultMode(req.get("X-Simulate-Fault") ?? config.faults.orderEvents, next);
}
