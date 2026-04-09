const DataQualityScore = require("./schemas/data-quality-score.schema");
const CityEmission = require("./schemas/city-emission.schema");
const Eui = require("./schemas/eui.schema");

const getReferenceData = async () => {
  const [dataQualityScores, cities, euiDatas] = await Promise.all([
    DataQualityScore.find().lean(),
    CityEmission.find().lean(),
    Eui.find().lean(),
  ]);

  return {
    dataQualityScores,
    cities,
    euiDatas,
  };
};

module.exports = {
  getReferenceData,
};
