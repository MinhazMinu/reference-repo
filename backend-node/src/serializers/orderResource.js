export async function orderResource(order) {
  const customer = await order.getCustomer();
  const items = await order.getItems();

  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    total_cents: order.totalCents,
    placed_at: order.placedAt?.toISOString() ?? null,
    item_count: await order.itemCount(),
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      lifetime_orders: await customer.countOrders(),
    },
    items: await Promise.all(items.map(orderItemResource)),
  };
}

export async function orderItemResource(item) {
  const product = await item.getProduct();

  return {
    id: item.id,
    sku: product.sku,
    name: product.name,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  };
}
