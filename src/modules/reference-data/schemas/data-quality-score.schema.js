const mongoose = require("mongoose");
const env = require("../../../config/env");

const dataSchema = new mongoose.Schema(
  {
    typesOfAvailable: { type: String, required: true },
    dataQualityScore: { type: Number, required: true },
  },
  { _id: false }
);

const dataQualityScoreSchema = new mongoose.Schema(
  {
    projectType: { type: String, required: true },
    datas: [dataSchema],
  },
  { versionKey: false }
);

module.exports = mongoose.models.FinanceDataQualityScore ||
  mongoose.model(
    "FinanceDataQualityScore",
    dataQualityScoreSchema,
    env.collectionNames.dataQualityScores
  );
