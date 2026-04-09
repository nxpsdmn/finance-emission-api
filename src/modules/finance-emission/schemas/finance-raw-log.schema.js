const mongoose = require("mongoose");
const env = require("../../../config/env");

const logEntrySchema = new mongoose.Schema(
  {
    createdDate: { type: String, required: true },
    timestamp_request: { type: Date, required: true },
    timestamp_response: { type: Date, required: true },
    apiType: { type: String, required: true },
    ipAddress: String,
    location: String,
    responseStatus: Number,
    durationMs: Number,
    method: String,
    endpoint: String,
  },
  { _id: false }
);

const monthlyLogSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    entries: { type: [logEntrySchema], default: [] },
  },
  { _id: false }
);

const financeRawLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    email: String,
    company: String,
    monthlyLogs: { type: [monthlyLogSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.FinanceRawLog ||
  mongoose.model("FinanceRawLog", financeRawLogSchema, env.collectionNames.financeRawLogs);
