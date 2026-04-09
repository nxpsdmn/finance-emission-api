const mongoose = require("mongoose");
const env = require("../../../config/env");
const {
  PROJECT_TYPES,
  AVAILABLE_TYPES,
  TARGET_TYPES,
  INDUSTRY_SECTORS,
} = require("../finance.constants");

const dataEntrySchema = new mongoose.Schema(
  {
    loanStartYear: { type: Number, required: true },
    typesOfAvailable: { type: String, enum: AVAILABLE_TYPES, required: true },
    verifiedEmission: Number,
    unverifiedEmission: Number,
    electricProductionCapacity: Number,
    totalElectricProduced: Number,
    totalEnergyConsumed: Number,
    processedEmission: Number,
    actualBuildingEnergyConsumption: Number,
    actualEmissionFactor: Number,
    floorArea: Number,
    buildingMainFunction: String,
    totalFloorAreaOfBuildingUnit: Number,
    totalNumberOfBuildings: Number,
    attributionFactor_value: Number,
    attributionFactor_key: String,
    emissionFactor: Number,
    avgEmissionFactor: Number,
    energyUseIntensity: Number,
    s1s2BaseYear: Number,
    s1s2TargetYear: Number,
    s1s2TargetType: { type: String, enum: TARGET_TYPES },
    s1s2IndustrySector: { type: String, enum: INDUSTRY_SECTORS },
    s1s2TargetScope: Boolean,
    s1s2Emission: Number,
    s1s2ReductionTarget: Number,
    s1s2TargetCoverage: Number,
    s1s2TargetPublishedYear: Number,
    s3BaseYear: Number,
    s3TargetYear: Number,
    s3TargetType: { type: String, enum: TARGET_TYPES },
    s3IndustrySector: { type: String, enum: INDUSTRY_SECTORS },
    s3TargetScope: Boolean,
    s3Emission: Number,
    s3ReductionTarget: Number,
    s3TargetCoverage: Number,
    s3TargetPublishedYear: Number,
    source: String,
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    projectName: String,
    externalProjectRefId: String,
    projectType: { type: String, enum: PROJECT_TYPES, required: true },
    location: String,
    city: String,
    loanStartDate: Number,
    loanEndDate: Number,
    projectOperationDate: Number,
    dataEntries: [dataEntrySchema],
  },
  { timestamps: true }
);

const financeProjectSchema = new mongoose.Schema(
  {
    ownerCompanyId: { type: String, index: true },
    ownerSubject: String,
    clientCompanyKey: String,
    clientUserId: String,
    bankName: String,
    companyName: String,
    portfolioName: String,
    companyId: { type: String, required: true, unique: true },
    companyDetails: [{ type: mongoose.Schema.Types.Mixed }],
    projects: [projectSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.FinanceProject ||
  mongoose.model("FinanceProject", financeProjectSchema, env.collectionNames.financeProjects);
