const FinanceProject = require("./schemas/finance-project.schema");
const FinanceRawLog = require("./schemas/finance-raw-log.schema");

const findFinanceProjectByCompanyId = async (companyId) =>
  FinanceProject.findOne({ companyId });

const findFinanceProjectByCompanyIdLean = async (companyId) =>
  FinanceProject.findOne({ companyId }).lean();

const createFinanceProject = async (payload) => FinanceProject.create(payload);

const appendProject = async (companyId, project) =>
  FinanceProject.findOneAndUpdate(
    { companyId },
    { $push: { projects: project } },
    { new: true }
  );

const updateProject = async (companyId, projectId, fields) =>
  FinanceProject.findOneAndUpdate(
    { companyId, "projects.projectId": projectId },
    { $set: fields },
    { new: true }
  );

const deleteProject = async (companyId, projectId) =>
  FinanceProject.findOneAndUpdate(
    { companyId },
    { $pull: { projects: { projectId } } },
    { new: true }
  );

const upsertProjectDataEntry = async (companyId, projectId, projectIndex, dataEntryIndex, dataEntry) => {
  const updateQuery =
    dataEntryIndex >= 0
      ? {
          $set: {
            [`projects.${projectIndex}.dataEntries.${dataEntryIndex}`]: dataEntry,
          },
        }
      : {
          $push: {
            [`projects.${projectIndex}.dataEntries`]: dataEntry,
          },
        };

  return FinanceProject.findOneAndUpdate(
    { companyId, "projects.projectId": projectId },
    updateQuery,
    { new: true, runValidators: true }
  );
};

const upsertFinanceRawLog = async ({ id, set }) =>
  FinanceRawLog.findOneAndUpdate(
    { id },
    {
      $setOnInsert: { id },
      ...(set ? { $set: set } : {}),
    },
    { upsert: true, new: true }
  );

const pushMonthlyLogEntry = async (id, month, entry, hasMonth) => {
  if (hasMonth) {
    return FinanceRawLog.updateOne(
      { id, "monthlyLogs.month": month },
      { $push: { "monthlyLogs.$.entries": entry } }
    );
  }

  return FinanceRawLog.updateOne(
    { id },
    { $push: { monthlyLogs: { month, entries: [entry] } } }
  );
};

const listFinanceRawLogs = async (filters = {}) => FinanceRawLog.find(filters).lean();

const purgeRawLogEntriesBefore = async (cutoffDate, cutoffMonthKey) => {
  const documents = await FinanceRawLog.find();
  let modified = 0;

  for (const document of documents) {
    let changed = false;
    const monthlyLogs = (document.monthlyLogs || [])
      .map((monthlyLog) => {
        const nextEntries = (monthlyLog.entries || []).filter((entry) => {
          return new Date(entry.timestamp_request) >= cutoffDate;
        });

        if (nextEntries.length !== monthlyLog.entries.length) {
          changed = true;
        }

        return {
          month: monthlyLog.month,
          entries: nextEntries,
        };
      })
      .filter((monthlyLog) => {
        const keep = monthlyLog.entries.length > 0 || monthlyLog.month >= cutoffMonthKey;
        if (!keep) {
          changed = true;
        }
        return keep;
      });

    if (changed) {
      document.monthlyLogs = monthlyLogs;
      await document.save();
      modified += 1;
    }
  }

  return { modified };
};

module.exports = {
  findFinanceProjectByCompanyId,
  findFinanceProjectByCompanyIdLean,
  createFinanceProject,
  appendProject,
  updateProject,
  deleteProject,
  upsertProjectDataEntry,
  upsertFinanceRawLog,
  pushMonthlyLogEntry,
  listFinanceRawLogs,
  purgeRawLogEntriesBefore,
};
