import { InsufficientStockError } from "../http/errors.js";
import { Order, OrderEvent, OrderItem, Product } from "../models/index.js";

/**
 * @param {import("sequelize").Model} customer
 * @param {{ product_id: number, quantity: number }[]} lines
 */
export async function placeOrder(customer, lines) {
  const products = await Product.findAll({ where: { id: lines.map((line) => line.product_id) } });
  const productsById = new Map(products.map((product) => [product.id, product]));

  const order = await Order.create({
    reference: await nextReference(),
    customerId: customer.id,
    status: "pending",
    placedAt: new Date(),
  });

  let total = 0;

  for (const line of lines) {
    const product = productsById.get(line.product_id);

    if (product.stock < line.quantity) {
      throw new InsufficientStockError(product, line.quantity);
    }

    product.stock -= line.quantity;
    await product.save();

    await OrderItem.create({
      orderId: order.id,
      productId: product.id,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
    });

    total += product.priceCents * line.quantity;
  }

  await order.update({ totalCents: total });

  // The warehouse sync job tails this table, so every placed order must have one.
  await OrderEvent.create({
    orderId: order.id,
    type: "order.placed",
    payload: { total_cents: total, lines: lines.length },
  });

  return order;
}

async function nextReference() {
  const maxId = (await Order.max("id")) ?? 0;
  return `ORD-${String(maxId + 1).padStart(6, "0")}`;
}
