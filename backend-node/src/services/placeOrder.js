import { randomUUID } from "node:crypto";
import { DatabaseError } from "sequelize";
import { sequelize } from "../db/sequelize.js";
import { InsufficientStockError, OrderPlacementFailed } from "../http/errors.js";
import { Order, OrderEvent, OrderItem, Product } from "../models/index.js";

const ATTEMPTS = 3;

// MySQL rolls back the whole transaction on these, so the whole transaction must be retried.
const RETRYABLE = new Set(["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"]);

const isRetryable = (err) => err instanceof DatabaseError && RETRYABLE.has(err.parent?.code);

/**
 * @param {import("sequelize").Model} customer
 * @param {{ product_id: number, quantity: number }[]} lines
 */
export async function placeOrder(customer, lines) {
  for (let attempt = 1; ; attempt++) {
    try {
      // Managed transaction: commits if the callback resolves, rolls back if it throws.
      return await sequelize.transaction((transaction) => place(customer, lines, transaction));
    } catch (err) {
      if (isRetryable(err) && attempt < ATTEMPTS) continue;

      if (err instanceof DatabaseError) {
        console.error(err);
        throw new OrderPlacementFailed();
      }

      throw err;
    }
  }
}

async function place(customer, lines, transaction) {
  // Lock the rows so concurrent orders can't both pass the stock check (lost update).
  const products = await Product.findAll({
    where: { id: lines.map((line) => line.product_id) },
    order: [["id", "ASC"]],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  // Validate every line before writing anything.
  for (const line of lines) {
    const product = productsById.get(line.product_id);
    if (product.stock < line.quantity) {
      throw new InsufficientStockError(product, line.quantity);
    }
  }

  const order = await Order.create(
    {
      // Placeholder keeps the unique column valid until we know the id; avoids the MAX(id)+1 race.
      reference: `TMP-${randomUUID()}`,
      customerId: customer.id,
      status: "pending",
      placedAt: new Date(),
    },
    { transaction },
  );

  let total = 0;

  for (const line of lines) {
    const product = productsById.get(line.product_id);

    await product.decrement("stock", { by: line.quantity, transaction });

    await OrderItem.create(
      { orderId: order.id, productId: product.id, quantity: line.quantity, unitPriceCents: product.priceCents },
      { transaction },
    );

    total += product.priceCents * line.quantity;
  }

  await order.update({ reference: `ORD-${String(order.id).padStart(6, "0")}`, totalCents: total }, { transaction });

  // The warehouse sync job tails this table, so every placed order must have one.
  await OrderEvent.create(
    { orderId: order.id, type: "order.placed", payload: { total_cents: total, lines: lines.length } },
    { transaction },
  );

  return order;
}
