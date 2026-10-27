import { col, fn } from "sequelize";
import { Customer, Order, OrderItem, Product } from "../models/index.js";

/**
 * Serializes many orders with a fixed number of queries (customers, items + products,
 * lifetime order counts), however many orders there are. Avoids N+1 lazy loading.
 */
export async function serializeOrders(orders) {
  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => order.id);
  const customerIds = [...new Set(orders.map((order) => order.customerId))];

  const [customers, items, orderCounts] = await Promise.all([
    Customer.findAll({ where: { id: customerIds } }),
    OrderItem.findAll({
      where: { orderId: orderIds },
      include: [{ model: Product, as: "product" }],
      order: [["id", "ASC"]],
    }),
    Order.findAll({
      attributes: ["customerId", [fn("COUNT", col("id")), "total"]],
      where: { customerId: customerIds },
      group: ["customerId"],
      raw: true,
    }),
  ]);

  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const lifetimeOrders = new Map(orderCounts.map((row) => [row.customerId, Number(row.total)]));
  const itemsByOrder = Map.groupBy(items, (item) => item.orderId);

  return orders.map((order) => {
    const customer = customersById.get(order.customerId);
    const orderItems = itemsByOrder.get(order.id) ?? [];

    return {
      id: order.id,
      reference: order.reference,
      status: order.status,
      total_cents: order.totalCents,
      placed_at: order.placedAt?.toISOString() ?? null,
      item_count: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        lifetime_orders: lifetimeOrders.get(customer.id) ?? 0,
      },
      items: orderItems.map(orderItemResource),
    };
  });
}

export async function orderResource(order) {
  const [serialized] = await serializeOrders([order]);
  return serialized;
}

function orderItemResource(item) {
  return {
    id: item.id,
    sku: item.product.sku,
    name: item.product.name,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  };
}
