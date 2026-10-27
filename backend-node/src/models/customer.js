import { DataTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export const Customer = sequelize.define(
  "Customer",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    tier: { type: DataTypes.STRING, allowNull: false, defaultValue: "standard" },
  },
  { tableName: "customers" },
);
