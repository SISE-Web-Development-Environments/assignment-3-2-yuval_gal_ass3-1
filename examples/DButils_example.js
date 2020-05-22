const DButils = require("../modules/DButils");

// const query = `INSERT INTO users (username, password) VALUES ('demossed', 'demossed')`;
const query = `SELECT * FROM users`;
// const query = `DROP TABLE users`;

//#region promise Version
DButils.execQuery(query)
  .then((res) => {
    console.log(res);
  })
  .catch((error) => console.log(error.message));
//#endregion

//#region async await Version
// (async () => {
//   try {
//     res = await DButils.execQuery(query);
//     console.log(res);
//   } catch (error) {
//     console.log(error.message);
//   }
// })();
//#endregion
