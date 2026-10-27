import { Customer } from "./customer.js";
import { Order, ORDER_STATUSES } from "./order.js";
import { OrderEvent } from "./orderEvent.js";
import { OrderItem } from "./orderItem.js";
import { Product } from "./product.js";
import { registerFaultInjector } from "../faults/faultInjector.js";

Customer.hasMany(Order, { as: "orders", foreignKey: { name: "customerId", allowNull: false } });
Order.belongsTo(Customer, { as: "customer", foreignKey: { name: "customerId", allowNull: false } });

Order.hasMany(OrderItem, { as: "items", foreignKey: { name: "orderId", allowNull: false }, onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { as: "order", foreignKey: { name: "orderId", allowNull: false } });

OrderItem.belongsTo(Product, { as: "product", foreignKey: { name: "productId", allowNull: false } });

Order.hasMany(OrderEvent, { as: "events", foreignKey: { name: "orderId", allowNull: false }, onDelete: "CASCADE" });
OrderEvent.belongsTo(Order, { as: "order", foreignKey: { name: "orderId", allowNull: false } });

Order.prototype.itemCount = async function () {
  return (await OrderItem.sum("quantity", { where: { orderId: this.id } })) ?? 0;
};

registerFaultInjector(OrderEvent);

export { Customer, Order, OrderEvent, OrderItem, Product, ORDER_STATUSES };
