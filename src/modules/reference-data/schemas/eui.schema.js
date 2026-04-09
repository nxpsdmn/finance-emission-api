const mongoose = require("mongoose");
const env = require("../../../config/env");

const euiSchema = new mongoose.Schema(
  {
    mainBuilding: { type: String, required: true },
    euiValue: { type: Number, required: true },
  },
  { versionKey: false }
);

module.exports = mongoose.models.FinanceEui ||
  mongoose.model("FinanceEui", euiSchema, env.collectionNames.euiDatas);
