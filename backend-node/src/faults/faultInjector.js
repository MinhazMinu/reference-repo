/**
 * Simulates MySQL write failures on the order_events table so the
 * order flow can be exercised against realistic database errors.
 *
 * Modes:
 *  - deadlock_once: the first insert in a request fails with a MySQL 1213 deadlock, later inserts succeed.
 *  - table_full:    every insert fails with MySQL 1114 "table is full".
 *
 * The thrown errors are real Sequelize DatabaseErrors wrapping mysql2-shaped errors
 * (err.parent.code / errno / sqlState), exactly what the driver produces.
 *
 * DO NOT MODIFY - this file stands in for the database. Fix the application code instead.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { DatabaseError } from "sequelize";

export const FAULT_MODES = ["deadlock_once", "table_full"];

const requestFaults = new AsyncLocalStorage();

const ERRORS = {
  deadlock_once: {
    code: "ER_LOCK_DEADLOCK",
    errno: 1213,
    sqlState: "40001",
    message: "Deadlock found when trying to get lock; try restarting transaction",
  },
  table_full: {
    code: "ER_RECORD_FILE_FULL",
    errno: 1114,
    sqlState: "HY000",
    message: "The table 'order_events' is full",
  },
};

/** Runs `next` with a fault mode scoped to the current request. */
export function withFaultMode(mode, next) {
  return requestFaults.run({ mode: FAULT_MODES.includes(mode) ? mode : null, hits: 0 }, next);
}

function maybeFail(model) {
  const fault = requestFaults.getStore();
  if (!fault?.mode) return;

  fault.hits++;

  if (fault.mode === "deadlock_once" && fault.hits > 1) return;

  const { code, errno, sqlState, message } = ERRORS[fault.mode];
  const parent = Object.assign(new Error(message), {
    code,
    errno,
    sqlState,
    sqlMessage: message,
    sql: `INSERT INTO \`${model.getTableName()}\` (...) VALUES (...)`,
  });

  throw new DatabaseError(parent);
}

export function registerFaultInjector(model) {
  model.addHook("beforeCreate", "faultInjector", () => maybeFail(model));
  model.addHook("beforeBulkCreate", "faultInjector", () => maybeFail(model));
}
