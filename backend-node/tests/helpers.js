import { sequelize } from "../src/db/sequelize.js";
import { Customer, Order, OrderItem, Product } from "../src/models/index.js";

let seq = 0;
const next = () => ++seq;

export function createCustomer(attrs = {}) {
  const n = next();
  return Customer.create({ name: `Customer ${n}`, email: `customer${n}@example.com`, ...attrs });
}

export function createProduct(attrs = {}) {
  const n = next();
  return Product.create({ sku: `SKU-${n}`, name: `Product ${n}`, priceCents: 1000, stock: 50, ...attrs });
}

export async function createOrder(attrs = {}) {
  const n = next();
  const customerId = attrs.customerId ?? (await createCustomer()).id;
  return Order.create({
    reference: `ORD-${String(n).padStart(6, "0")}`,
    status: "pending",
    placedAt: new Date(Date.now() - n * 60_000),
    ...attrs,
    customerId,
  });
}

export async function createOrderItem(attrs = {}) {
  const productId = attrs.productId ?? (await createProduct()).id;
  return OrderItem.create({ quantity: 1, unitPriceCents: 1000, ...attrs, productId });
}

/** Runs `fn` and returns how many SQL queries it executed. */
export async function countQueries(fn) {
  let count = 0;
  const original = sequelize.options.logging;
  sequelize.options.logging = () => count++;
  try {
    await fn();
  } finally {
    sequelize.options.logging = original;
  }
  return count;
}
