const express = require("express");
const authContextMiddleware = require("../../middlewares/auth-context.middleware");
const controller = require("./finance.controller");
const { createFinanceRawLogMiddleware } = require("./finance-log.middleware");

const router = express.Router();

router.use(authContextMiddleware);

router.post("/projects", createFinanceRawLogMiddleware("Add Project"), controller.addProject);
router.post("/projects/validate", createFinanceRawLogMiddleware("Validate Project"), controller.validateProject);
router.put("/projects/:companyId/:projectId", createFinanceRawLogMiddleware("Update Project"), controller.updateProject);
router.delete("/projects/:companyId/:projectId", createFinanceRawLogMiddleware("Delete Project"), controller.deleteProject);
router.post("/projects/:companyId/:projectId/data-entries", createFinanceRawLogMiddleware("Add Data Entry"), controller.addDataEntries);
router.get("/projects/:companyId", createFinanceRawLogMiddleware("Get Project"), controller.getProject);
router.post("/calculations", createFinanceRawLogMiddleware("Calculate FE"), controller.calculateDataEntry);
router.get("/logs", controller.listApiLogs);

router.post("/add-project", createFinanceRawLogMiddleware("Add Project"), controller.addProject);
router.post("/validate-project", createFinanceRawLogMiddleware("Validate Project"), controller.validateProject);
router.post("/update-project", createFinanceRawLogMiddleware("Update Project"), controller.updateProject);
router.delete("/project/:companyId/:projectId", createFinanceRawLogMiddleware("Delete Project"), controller.deleteProject);
router.delete("/project/:companyId", createFinanceRawLogMiddleware("Delete Project"), controller.deleteProject);
router.post("/add-dataEntry", createFinanceRawLogMiddleware("Add Data Entry"), controller.addDataEntries);
router.get("/project/:companyId", createFinanceRawLogMiddleware("Get Project"), controller.getProject);
router.post("/calculate-dataEntry", createFinanceRawLogMiddleware("Calculate FE"), controller.calculateDataEntry);

module.exports = router;
