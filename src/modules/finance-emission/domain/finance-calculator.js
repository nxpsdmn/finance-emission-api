const { AppError } = require("../../../config/errors");

const clone = (value) => JSON.parse(JSON.stringify(value));

const getAttributionFactor = (record = {}) => {
  if (record.attributionFactor?.value !== undefined) {
    return record.attributionFactor;
  }

  if (record.attribution_factor?.value !== undefined) {
    return record.attribution_factor;
  }

  if (record.attributionFactor_value !== undefined && record.attributionFactor_key) {
    return {
      value: record.attributionFactor_value,
      key: record.attributionFactor_key,
    };
  }

  return {
    value: 1,
    key: "default",
  };
};

const resolveDataQualityScore = (projectType, typesOfAvailable, referenceData) => {
  const project = referenceData.dataQualityScores.find((item) => item.projectType === projectType);
  return project?.datas?.find((item) => item.typesOfAvailable === typesOfAvailable)?.dataQualityScore || 1;
};

const resolveCityEmission = (location, referenceData) => {
  const cityRecord = referenceData.cities.find((item) => item.country === location);
  const emissionFactor = cityRecord?.cities?.[0]?.emission_factor;
  if (!emissionFactor) {
    throw new AppError(`Invalid location: ${location}`);
  }
  return emissionFactor;
};

const resolveEnergyUseIntensity = (buildingMainFunction, referenceData) => {
  const value = referenceData.euiDatas.find((item) => item.mainBuilding === buildingMainFunction)?.euiValue;
  if (!value) {
    throw new AppError(`Invalid buildingMainFunction: ${buildingMainFunction}`);
  }
  return value;
};

const applyPfOrPpCalculation = (entry, project, referenceData) => {
  const emissionFactorFromCity = resolveCityEmission(project.location, referenceData);

  switch (entry.typesOfAvailable) {
    case "1A":
      entry.financedEmission = entry.verifiedEmission * entry.attributionFactor.value;
      entry.emissionIntensity = entry.financedEmission / (entry.electricProductionCapacity * entry.attributionFactor.value);
      break;
    case "1B":
      entry.financedEmission = entry.unverifiedEmission * entry.attributionFactor.value;
      entry.emissionIntensity = entry.financedEmission / (entry.electricProductionCapacity * entry.attributionFactor.value);
      break;
    case "2A":
      entry.emissionFactor = entry.emissionFactor ?? emissionFactorFromCity;
      entry.financedEmission =
        ((entry.totalEnergyConsumed * entry.emissionFactor) + entry.processedEmission) * entry.attributionFactor.value / 1000;
      entry.emissionIntensity = entry.financedEmission / (entry.electricProductionCapacity * entry.attributionFactor.value);
      break;
    case "2B":
      entry.electricProductionCapacity = entry.electricProductionCapacity ?? entry.totalElectricProduced / 1000;
      entry.emissionFactor = entry.emissionFactor ?? emissionFactorFromCity;
      entry.financedEmission = (entry.totalElectricProduced * entry.emissionFactor) * entry.attributionFactor.value / 1000;
      entry.emissionIntensity = entry.financedEmission / (entry.electricProductionCapacity * entry.attributionFactor.value);
      break;
    default:
      break;
  }
};

const applyCreCalculation = (entry, project, referenceData) => {
  const emissionFactorFromCity = resolveCityEmission(project.location, referenceData);
  entry.avgEmissionFactor = entry.avgEmissionFactor ?? emissionFactorFromCity;

  switch (entry.typesOfAvailable) {
    case "1A":
      entry.financedEmission =
        entry.actualEmissionFactor * entry.actualBuildingEnergyConsumption * entry.attributionFactor.value / 1000;
      break;
    case "1B":
      entry.financedEmission =
        entry.actualBuildingEnergyConsumption * entry.avgEmissionFactor * entry.attributionFactor.value / 1000;
      break;
    case "2B":
      entry.energyUseIntensity = entry.energyUseIntensity ?? resolveEnergyUseIntensity(entry.buildingMainFunction, referenceData);
      entry.financedEmission =
        entry.energyUseIntensity * entry.avgEmissionFactor * entry.floorArea * entry.attributionFactor.value / 1000;
      break;
    case "3":
      entry.energyUseIntensity = entry.energyUseIntensity ?? resolveEnergyUseIntensity(entry.buildingMainFunction, referenceData);
      entry.floorArea = entry.totalFloorAreaOfBuildingUnit * entry.totalNumberOfBuildings;
      entry.financedEmission =
        entry.avgEmissionFactor *
        entry.attributionFactor.value *
        entry.totalNumberOfBuildings *
        entry.energyUseIntensity *
        entry.totalFloorAreaOfBuildingUnit /
        1000;
      break;
    default:
      break;
  }

  entry.emissionIntensity = entry.financedEmission / (entry.floorArea * entry.attributionFactor.value);
};

const calculateTemperatureScoreY = (xValue, targetType, industrySector, yearDifference) => {
  const defaultValue = 3.2;

  if (yearDifference < 15) {
    if (targetType === "Absolute") {
      if (industrySector === "Industry") return xValue ? -0.31 * xValue + 2.7 : defaultValue;
      if (industrySector === "Energy and Industrial Processes") return xValue ? -0.31 * xValue + 2.62 : defaultValue;
    }

    if (targetType === "Intensity") {
      if (industrySector === "Economic and Industrial Material Production (Cement, Steel, etc)") return xValue ? -0.53 * xValue + 4.11 : defaultValue;
      if (industrySector === "Electricity Generation") return xValue ? -0.33 * xValue + 3.33 : defaultValue;
      if (industrySector === "Primary Energy") return xValue ? -0.51 * xValue + 3 : defaultValue;
    }
  }

  if (yearDifference < 30) {
    if (targetType === "Absolute") {
      if (industrySector === "Industry") return xValue ? -0.48 * xValue + 2.84 : defaultValue;
      if (industrySector === "Energy and Industrial Processes") return xValue ? 0.44 * xValue + 2.72 : defaultValue;
    }

    if (targetType === "Intensity") {
      if (industrySector === "Economic and Industrial Material Production (Cement, Steel, etc)") return xValue ? -1.1 * xValue + 4.93 : defaultValue;
      if (industrySector === "Electricity Generation") return xValue ? 0.78 * xValue + 3.9 : defaultValue;
      if (industrySector === "Primary Energy") return xValue ? 0.66 * xValue + 3.21 : defaultValue;
    }
  }

  return null;
};

const applyClCalculation = (entry) => {
  const s1s2X = entry.s1s2ReductionTarget ? entry.s1s2ReductionTarget / (entry.s1s2TargetYear - entry.s1s2BaseYear) : null;
  const s3X = entry.s3ReductionTarget ? entry.s3ReductionTarget / (entry.s3TargetYear - entry.s3BaseYear) : null;
  const s1s2Y = calculateTemperatureScoreY(
    s1s2X,
    entry.s1s2TargetType,
    entry.s1s2IndustrySector,
    Number(entry.s1s2TargetYear) - Number(entry.s1s2BaseYear)
  );
  const s3Y = calculateTemperatureScoreY(
    s3X,
    entry.s3TargetType,
    entry.s3IndustrySector,
    Number(entry.s3TargetYear) - Number(entry.s3BaseYear)
  );

  const scopeLabel = Object.entries({
    s1s2TargetScope: "S1+S2",
    s3TargetScope: "S3",
  })
    .filter(([key]) => entry[key])
    .map(([, label]) => label)
    .join("+");

  const scopeCondition = scopeLabel ? `(${scopeLabel})` : "";
  entry.temperatureScore = { value: null, key: scopeCondition };

  if (entry.s1s2TargetScope && entry.s3TargetScope) {
    entry.temperatureScore.value =
      ((entry.s1s2Emission * entry.s1s2TargetCoverage * s1s2Y) + (entry.s3Emission * entry.s3TargetCoverage * s3Y)) /
      (entry.s1s2Emission * entry.s1s2TargetCoverage + entry.s3Emission * entry.s3TargetCoverage);
  } else if (entry.s1s2TargetScope) {
    entry.temperatureScore.value =
      (entry.s1s2Emission * entry.s1s2TargetCoverage * s1s2Y) /
      (entry.s1s2Emission * entry.s1s2TargetCoverage);
  }

  if (typeof entry.temperatureScore.value === "number" && entry.temperatureScore.value < 0 && entry.temperatureScore.value !== -Infinity) {
    entry.temperatureScore.message = "The calculated temperature score is negative, please verify your data entry.";
  }

  if (entry.typesOfAvailable === "1A") {
    entry.financedEmission = entry.verifiedEmission * entry.attributionFactor.value;
  }

  if (entry.typesOfAvailable === "1B") {
    entry.financedEmission = entry.unverifiedEmission * entry.attributionFactor.value;
  }
};

const calculateEntry = (entryInput, project, referenceData) => {
  const entry = clone(entryInput);
  entry.dataQualityScore = resolveDataQualityScore(project.projectType, entry.typesOfAvailable, referenceData);
  entry.attributionFactor = getAttributionFactor(entry);
  delete entry.attributionFactor_value;
  delete entry.attributionFactor_key;

  if (["PF", "PP"].includes(project.projectType)) {
    applyPfOrPpCalculation(entry, project, referenceData);
  } else if (project.projectType === "CRE") {
    applyCreCalculation(entry, project, referenceData);
  } else if (project.projectType === "CL") {
    applyClCalculation(entry, project, referenceData);
  }

  return entry;
};

const calculateProject = (projectInput, referenceData) => {
  const project = clone(projectInput);
  project.dataEntries = (project.dataEntries || []).map((entry) => calculateEntry(entry, project, referenceData));
  return project;
};

const calculateFinanceProject = (financeProjectInput, referenceData) => {
  const financeProject = clone(financeProjectInput);
  financeProject.projects = (financeProject.projects || []).map((project) => calculateProject(project, referenceData));
  return financeProject;
};

module.exports = {
  calculateEntry,
  calculateProject,
  calculateFinanceProject,
};
