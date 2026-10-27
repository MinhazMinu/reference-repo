import { DataTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

// Append-only audit trail consumed by the warehouse sync job.
export const OrderEvent = sequelize.define(
  "OrderEvent",
  {
    type: { type: DataTypes.STRING, allowNull: false },
    payload: { type: DataTypes.JSON },
  },
  { tableName: "order_events", updatedAt: false },
);
