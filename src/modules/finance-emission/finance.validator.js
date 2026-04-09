const { AppError } = require("../../config/errors");
const { AVAILABLE_TYPES, PROJECT_TYPES } = require("./finance.constants");

const ensureRequiredFields = (data, fields) => {
  const missingFields = fields.filter((field) => !data[field]);
  if (missingFields.length > 0) {
    throw new AppError(`Missing required fields: ${missingFields.join(", ")}`);
  }
};

const ensureNumberRange = (data, field, min, max, inclusiveMin = false, inclusiveMax = false) => {
  if (!(field in data)) {
    return;
  }

  const value = data[field];
  if (typeof value !== "number") {
    throw new AppError(`${field} must be a number.`);
  }

  const isValid =
    (inclusiveMin ? value >= min : value > min) &&
    (inclusiveMax ? value <= max : value < max);

  if (!isValid) {
    throw new AppError(
      `${field} must be in range ${inclusiveMin ? "[" : "("}${min}, ${max}${inclusiveMax ? "]" : ")"}`
    );
  }
};

const validateProjectType = (projectType) => {
  if (!PROJECT_TYPES.includes(projectType)) {
    throw new AppError(`Invalid projectType: ${projectType}. Allowed values are: ${PROJECT_TYPES.join(", ")}`);
  }
};

const validateBasicProjectDetail = async (data) => {
  ensureRequiredFields(data, ["companyId", "projectId", "projectType", "location", "loanStartDate", "loanEndDate"]);

  if (
    typeof data.companyId !== "string" ||
    typeof data.projectId !== "string" ||
    typeof data.projectType !== "string" ||
    typeof data.location !== "string" ||
    typeof data.loanStartDate !== "number" ||
    typeof data.loanEndDate !== "number"
  ) {
    throw new AppError("Invalid data types. Ensure all fields have correct types.");
  }

  validateProjectType(data.projectType);

  if (data.projectType === "PP" && !data.projectOperationDate) {
    throw new AppError("Missing required fields: projectOperationDate");
  }

  const startDate = data.projectType === "PP" ? data.projectOperationDate : data.loanStartDate;
  if (data.loanEndDate < startDate) {
    throw new AppError(
      `loanEndDate must be greater than ${data.projectType === "PP" ? "projectOperationDate" : "loanStartDate"}.`
    );
  }
};

const validateProject = async (data) => {
  ensureRequiredFields(data, ["projectType", "location", "loanStartDate", "loanEndDate"]);
  validateProjectType(data.projectType);
};

const validateBasicProjectDetailUpdate = async (data) => {
  await validateBasicProjectDetail(data);
  if (typeof data.city !== "string") {
    throw new AppError("Invalid data types. Ensure all fields have correct types.");
  }
};

const validateProjectDataEntry = async (data) => {
  ensureRequiredFields(data, [
    "companyId",
    "projectId",
    "projectType",
    "loanStartYear",
    "typesOfAvailable",
    "loanStartDate",
    "loanEndDate",
  ]);

  validateProjectType(data.projectType);

  if (typeof data.loanStartYear !== "number") {
    throw new AppError("loanStartYear must be a number.");
  }

  if (!AVAILABLE_TYPES.includes(data.typesOfAvailable)) {
    throw new AppError(`Invalid typesOfAvailable: ${data.typesOfAvailable}. Allowed values are: ${AVAILABLE_TYPES.join(", ")}`);
  }

  if (data.projectType === "PP" && !data.projectOperationDate) {
    throw new AppError("Missing required field: projectOperationDate for projectType 'PP'");
  }

  const startDate = data.projectType === "PP" ? data.projectOperationDate : data.loanStartDate;
  if (data.loanStartYear < startDate || data.loanStartYear > data.loanEndDate) {
    throw new AppError(
      `loanStartYear (${data.loanStartYear}) must be between ${data.projectType === "PP" ? "projectOperationDate" : "loanStartDate"} (${startDate}) and loanEndDate (${data.loanEndDate}).`
    );
  }

  const typeRequirements = {
    PF: {
      "1A": ["verifiedEmission", "electricProductionCapacity"],
      "1B": ["unverifiedEmission", "electricProductionCapacity"],
      "2A": ["totalEnergyConsumed", "processedEmission", "electricProductionCapacity", "emissionFactor"],
      "2B": ["totalElectricProduced", "emissionFactor"],
    },
    PP: {
      "1A": ["verifiedEmission", "electricProductionCapacity"],
      "1B": ["unverifiedEmission", "electricProductionCapacity"],
      "2A": ["totalEnergyConsumed", "processedEmission", "electricProductionCapacity", "emissionFactor"],
      "2B": ["totalElectricProduced", "emissionFactor"],
    },
    CRE: {
      "1A": ["actualBuildingEnergyConsumption", "actualEmissionFactor", "floorArea"],
      "1B": ["actualBuildingEnergyConsumption", "floorArea", "avgEmissionFactor"],
      "2B": ["buildingMainFunction", "floorArea", "avgEmissionFactor", "energyUseIntensity"],
      "3": ["buildingMainFunction", "totalFloorAreaOfBuildingUnit", "totalNumberOfBuildings", "avgEmissionFactor", "energyUseIntensity"],
    },
    CL: {
      "1A": ["verifiedEmission"],
      "1B": ["unverifiedEmission"],
    },
  };

  const requiredFieldsForType = typeRequirements[data.projectType]?.[data.typesOfAvailable] || [];
  const missingFieldsForType = requiredFieldsForType.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
  });

  if (missingFieldsForType.length > 0) {
    throw new AppError(`Missing required fields: ${missingFieldsForType.join(", ")}`);
  }

  if (data.projectType === "CL") {
    const scopeConfig = {
      s1s2TargetScope: [
        "s1s2Emission",
        "s1s2TargetCoverage",
        "s1s2BaseYear",
        "s1s2TargetYear",
        "s1s2TargetType",
        "s1s2IndustrySector",
        "s1s2TargetScope",
        "s1s2TargetPublishedYear",
      ],
      s3TargetScope: [
        "s3Emission",
        "s3TargetCoverage",
        "s3BaseYear",
        "s3TargetYear",
        "s3TargetType",
        "s3IndustrySector",
        "s3TargetScope",
        "s3TargetPublishedYear",
      ],
    };

    for (const [scopeKey, requiredFields] of Object.entries(scopeConfig)) {
      if (data[scopeKey]) {
        const missing = requiredFields.filter((field) => data[field] === undefined || data[field] === null || data[field] === "");
        if (missing.length > 0) {
          throw new AppError(`Missing required fields for ${scopeKey}: ${missing.join(", ")}`);
        }
      }
    }
  }

  const MAX = 1e15;
  const MAX_ENERGY_INTENSITY = 1e6;

  if (["PF", "PP"].includes(data.projectType)) {
    ensureNumberRange(data, "verifiedEmission", 0, MAX, true, true);
    ensureNumberRange(data, "unverifiedEmission", 0, MAX, true, true);
    ensureNumberRange(data, "totalEnergyConsumed", 0, MAX, true, true);
    ensureNumberRange(data, "processedEmission", 0, MAX, true, true);
    ensureNumberRange(data, "totalElectricProduced", 0, MAX, true, true);
    ensureNumberRange(data, "electricProductionCapacity", 0, MAX, true, true);
    ensureNumberRange(data, "emissionFactor", 0, 1, true, true);
  }

  if (data.projectType === "CRE") {
    ensureNumberRange(data, "actualBuildingEnergyConsumption", 0, MAX, true, true);
    ensureNumberRange(data, "actualEmissionFactor", 0, MAX, true, true);
    ensureNumberRange(data, "totalFloorAreaOfBuildingUnit", 0, MAX, true, true);
    ensureNumberRange(data, "totalNumberOfBuildings", 0, 1e9, true, true);
    ensureNumberRange(data, "floorArea", 0, 1e24, true, true);
    ensureNumberRange(data, "avgEmissionFactor", 0, 1, true, true);
    ensureNumberRange(data, "energyUseIntensity", 0, MAX_ENERGY_INTENSITY, true, true);
  }

  if (data.attribution_factor && typeof data.attribution_factor.value !== "undefined") {
    const { value } = data.attribution_factor;
    if (typeof value !== "number" || value < 0 || value > 1) {
      throw new AppError("attribution_factor.value must be a number between 0 and 1 inclusive.");
    }
  }
};

const validateDeleteProject = async (data) => {
  ensureRequiredFields(data, ["companyId", "projectId"]);
};

const validateDataEntry = async (data) => {
  ensureRequiredFields(data, ["projectType", "typesOfAvailable", "location"]);
  await validateProjectDataEntry({
    companyId: data.companyId || "calculation-only",
    projectId: data.projectId || "calculation-only",
    loanStartYear: data.loanStartYear || data.loanStartDate || 1,
    loanStartDate: data.loanStartDate || 1,
    loanEndDate: data.loanEndDate || Number.MAX_SAFE_INTEGER,
    ...data,
  });
};

module.exports = {
  validateBasicProjectDetail,
  validateProject,
  validateBasicProjectDetailUpdate,
  validateProjectDataEntry,
  validateDeleteProject,
  validateDataEntry,
};
