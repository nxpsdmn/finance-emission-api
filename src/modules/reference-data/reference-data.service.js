const repository = require("./reference-data.repository");

const getReferenceData = async () => repository.getReferenceData();

module.exports = {
  getReferenceData,
};
