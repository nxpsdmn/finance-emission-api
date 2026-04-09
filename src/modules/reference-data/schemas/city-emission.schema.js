const mongoose = require("mongoose");
const env = require("../../../config/env");

const citySubSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    emission_factor: { type: Number, required: true },
  },
  { _id: false }
);

const citySchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    cities: [citySubSchema],
    emission: Number,
  },
  { versionKey: false }
);

module.exports = mongoose.models.FinanceCityEmission ||
  mongoose.model("FinanceCityEmission", citySchema, env.collectionNames.cities);
