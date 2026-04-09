const { ok } = require("../../config/response");
const financeService = require("./finance.service");

const addProject = async (req, res, next) => {
  try {
    const result = await financeService.addBasicProjectDetail(req.body, req.auth);
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const validateProject = async (req, res, next) => {
  try {
    const result = await financeService.validateProject(req.body);
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      companyId: req.params.companyId || req.body.companyId,
      projectId: req.params.projectId || req.body.projectId,
    };
    const result = await financeService.updateBasicProjectDetail(payload, req.auth);
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const addDataEntries = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      companyId: req.params.companyId || req.body.companyId,
      projectId: req.params.projectId || req.body.projectId,
    };
    const result = await financeService.addProjectDataEntries(payload, req.auth);
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const result = await financeService.getProject(
      {
        companyId: req.params.companyId,
        projectId: req.query.projectId,
      },
      req.auth
    );
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await financeService.deleteProject(
      {
        companyId: req.params.companyId,
        projectId: req.params.projectId || req.query.projectId,
      },
      req.auth
    );
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const calculateDataEntry = async (req, res, next) => {
  try {
    const result = await financeService.calculateDataEntry(req.body);
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const listApiLogs = async (req, res, next) => {
  try {
    const result = await financeService.listApiLogs();
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProject,
  validateProject,
  updateProject,
  addDataEntries,
  getProject,
  deleteProject,
  calculateDataEntry,
  listApiLogs,
};
