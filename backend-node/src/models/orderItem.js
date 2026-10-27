import { DataTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export const OrderItem = sequelize.define(
  "OrderItem",
  {
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPriceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { tableName: "order_items" },
);
