import { DataTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export const Product = sequelize.define(
  "Product",
  {
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    priceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    stock: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  { tableName: "products" },
);
