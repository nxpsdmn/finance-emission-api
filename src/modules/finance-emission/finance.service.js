const { AppError } = require("../../config/errors");
const { toMonthKey } = require("../../utils/date.util");
const referenceDataService = require("../reference-data/reference-data.service");
const repository = require("./finance.repository");
const validator = require("./finance.validator");
const { toRequesterContext, normalizeDataEntry } = require("./finance.mapper");
const { calculateEntry, calculateFinanceProject } = require("./domain/finance-calculator");

const hasCrossCompanyAccess = (auth, companyId) => {
  if (!auth.companyId || auth.companyId === companyId) {
    return true;
  }

  const elevatedRoles = ["finance:admin", "admin", "super-admin"];
  return (auth.roles || []).some((role) => elevatedRoles.includes(role));
};

const assertCompanyAccess = (auth, companyId) => {
  if (!hasCrossCompanyAccess(auth, companyId)) {
    throw new AppError("Authenticated user is not allowed to access this company.", 403);
  }
};

const addBasicProjectDetail = async (payload, auth) => {
  await validator.validateBasicProjectDetail(payload);
  assertCompanyAccess(auth, payload.companyId);

  const requester = toRequesterContext(auth);
  const financeProject = await repository.findFinanceProjectByCompanyId(payload.companyId);
  const newProject = {
    createdDate: new Date().toISOString().slice(0, 10),
    createdBy: requester.subject,
    projectId: payload.projectId,
    projectName: payload.projectName,
    projectType: payload.projectType,
    location: payload.location,
    city: payload.city,
    loanStartDate: payload.loanStartDate,
    loanEndDate: payload.loanEndDate,
    ...(payload.projectOperationDate && payload.projectType === "PP"
      ? { projectOperationDate: payload.projectOperationDate }
      : {}),
  };

  if (financeProject) {
    if (financeProject.projects.some((project) => project.projectId === newProject.projectId)) {
      throw new AppError(`${newProject.projectId} already exists. Please choose another project Id!`);
    }

    await repository.appendProject(payload.companyId, newProject);
    return "success";
  }

  await repository.createFinanceProject({
    ownerCompanyId: requester.ownerCompanyId,
    ownerSubject: requester.subject,
    clientCompanyKey: requester.clientCompanyKey,
    clientUserId: requester.clientUserId,
    bankName: payload.bankName,
    companyName: payload.companyName,
    portfolioName: payload.portfolioName,
    companyId: payload.companyId,
    projects: [newProject],
  });

  return "success";
};

const validateProject = async (payload) => {
  await validator.validateProject(payload);
  return "success";
};

const updateBasicProjectDetail = async (payload, auth) => {
  await validator.validateBasicProjectDetailUpdate(payload);
  assertCompanyAccess(auth, payload.companyId);

  const financeProject = await repository.findFinanceProjectByCompanyId(payload.companyId);
  const project = financeProject?.projects?.find((item) => item.projectId === payload.projectId);
  if (!project) {
    throw new AppError(`Project with ID ${payload.projectId} not found.`, 404);
  }

  const updateFields = {
    "projects.$.location": payload.location,
    "projects.$.city": payload.city,
    "projects.$.loanStartDate": payload.loanStartDate,
    "projects.$.loanEndDate": payload.loanEndDate,
  };

  if (payload.projectOperationDate) {
    updateFields["projects.$.projectOperationDate"] = payload.projectOperationDate;
  }

  await repository.updateProject(payload.companyId, payload.projectId, updateFields);
  return "success";
};

const addProjectDataEntries = async (payload, auth) => {
  if (!Array.isArray(payload.datas) || payload.datas.length === 0) {
    throw new AppError(
      "At least one full year of data entry is required.Please complete the entry before proceeding with the calculation."
    );
  }

  assertCompanyAccess(auth, payload.companyId);
  const financeProject = await repository.findFinanceProjectByCompanyId(payload.companyId);
  if (!financeProject) {
    throw new AppError("Invalid companyId and projectId!", 404);
  }

  const projectIndex = financeProject.projects.findIndex(
    (project) => project.projectId === payload.projectId && project.projectType === payload.projectType
  );

  if (projectIndex < 0) {
    throw new AppError("ProjectId and ProjectType are incorrect. Please create a new one!", 404);
  }

  const project = financeProject.projects[projectIndex];
  if (project.loanStartDate !== payload.loanStartDate || project.loanEndDate !== payload.loanEndDate) {
    throw new AppError("The loanStart date and LoanEnd date must be the same with project existing data.");
  }

  if (project.projectType === "PP" && project.projectOperationDate !== payload.projectOperationDate) {
    throw new AppError("The projectOperationDate must be the same with project existing data.");
  }

  for (const entry of payload.datas) {
    await validator.validateProjectDataEntry({ ...payload, ...entry });

    const normalizedEntry = normalizeDataEntry(entry);
    const dataEntryIndex = (project.dataEntries || []).findIndex(
      (item) => item.loanStartYear === normalizedEntry.loanStartYear
    );
    await repository.upsertProjectDataEntry(
      payload.companyId,
      payload.projectId,
      projectIndex,
      dataEntryIndex,
      {
        loanStartYear: normalizedEntry.loanStartYear,
        typesOfAvailable: normalizedEntry.typesOfAvailable,
        ...normalizedEntry,
      }
    );
  }

  return "success";
};

const getProject = async ({ companyId, projectId }, auth) => {
  assertCompanyAccess(auth, companyId);

  const financeProject = await repository.findFinanceProjectByCompanyIdLean(companyId);
  if (!financeProject) {
    throw new AppError("There is no company found!", 404);
  }

  const scopedProject = projectId
    ? {
        ...financeProject,
        projects: financeProject.projects.filter((project) => project.projectId === projectId),
      }
    : financeProject;

  const referenceData = await referenceDataService.getReferenceData();
  return calculateFinanceProject(scopedProject, referenceData);
};

const deleteProject = async ({ companyId, projectId }, auth) => {
  await validator.validateDeleteProject({ companyId, projectId });
  assertCompanyAccess(auth, companyId);

  const financeProject = await repository.findFinanceProjectByCompanyId(companyId);
  const project = financeProject?.projects?.find((item) => item.projectId === projectId);
  if (!project) {
    throw new AppError("Company or Project not found!", 404);
  }

  const deleted = await repository.deleteProject(companyId, projectId);
  if (!deleted) {
    throw new AppError("Company or Project not found!", 404);
  }

  return "success";
};

const calculateDataEntry = async (payload) => {
  await validator.validateDataEntry(payload);
  const referenceData = await referenceDataService.getReferenceData();

  return calculateEntry(payload, payload, referenceData);
};

const recordApiLog = async ({
  apiType,
  auth,
  ipAddress,
  responseStatus,
  method,
  endpoint,
  timestampRequest,
  timestampResponse,
}) => {
  if (!auth?.subject) {
    return;
  }

  const month = toMonthKey(timestampRequest);
  const document = await repository.upsertFinanceRawLog({
    id: auth.subject,
    set: {
      name: auth.displayName || undefined,
      email: auth.email || undefined,
      company: auth.companyKey || auth.companyId || undefined,
    },
  });

  await repository.pushMonthlyLogEntry(
    auth.subject,
    month,
    {
      createdDate: new Date().toISOString().slice(0, 10),
      timestamp_request: timestampRequest,
      timestamp_response: timestampResponse,
      apiType,
      ipAddress,
      responseStatus,
      durationMs: timestampResponse.getTime() - timestampRequest.getTime(),
      method,
      endpoint,
    },
    document.monthlyLogs.some((entry) => entry.month === month)
  );
};

const listApiLogs = async () => repository.listFinanceRawLogs();

const purgeFinanceLogsOlderThanOneYear = async () => {
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 365);
  const cutoffMonthKey = toMonthKey(cutoffDate);

  return repository.purgeRawLogEntriesBefore(cutoffDate, cutoffMonthKey);
};

module.exports = {
  addBasicProjectDetail,
  validateProject,
  updateBasicProjectDetail,
  addProjectDataEntries,
  getProject,
  deleteProject,
  calculateDataEntry,
  recordApiLog,
  listApiLogs,
  purgeFinanceLogsOlderThanOneYear,
};
