const financeService = require("../modules/finance-emission/finance.service");

const runFinanceLogRetentionJob = async () => financeService.purgeFinanceLogsOlderThanOneYear();

module.exports = {
  runFinanceLogRetentionJob,
};
