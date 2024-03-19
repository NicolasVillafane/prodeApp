console.log('=== Testing Started ===');

const FootballDataApi = require('./FootballDataApi.cjs');

const footballDataApiKey = 'fee44aef4a6a4b0c8b0a3105bcbcd543';
const fd = new FootballDataApi(footballDataApiKey);

fd.getCompetitionScorers(2021)
  .then((res) => {
    console.info(JSON.stringify(res, null, 4));
  })
  .catch((err) => {
    console.error(JSON.stringify(err, null, 4));
  });
