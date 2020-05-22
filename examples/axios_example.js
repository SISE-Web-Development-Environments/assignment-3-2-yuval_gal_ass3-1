require("dotenv").config();
const axios = require("axios");
let id = 1;

//#region promise Version
axios
  .get(`https://api.spoonacular.com/recipes/${id}/information`, {
    params: {
      apiKey: process.env.spooncular_apiKey,
      includeNutrition: false
    }
  })
  .then((res) => console.log(res.data))
  .catch((error) => console.log(error.message));
//#endregion

//#region async await Version
// (async () => {
//   try {
//     const res = await axios.get(
//       `https://api.spoonacular.com/recipes/${id}/information`,
//       {
//         params: {
//           includeNutrition: false,
//           apiKey: process.env.spooncular_apiKey
//         }
//       }
//     );
//     console.log(res.data);
//   } catch (error) {
//     console.log(error.message);
//   }
// })();
//#endregion
