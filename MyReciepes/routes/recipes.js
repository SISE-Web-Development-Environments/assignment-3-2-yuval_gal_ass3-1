var express = require("express");
var router = express.Router();
const axios = require("axios");

const api_domain = "https://api.spoonacular.com/recipes";

router.get("/", (req, res) => res.send("im here"));

router.get("/Information", async (req, res, next) => {
  try {
    const recipe = await getRecipeInfo(req.query.recipe_id);
    res.send({ data: recipe.data });
  } catch (error) {
    next(error);
  }
});

//recipes/Search/food_name/5ergd/num/5?cuisine=American&diet=Ketogenic&intolerance=Egg
//#region example1 - make serach endpoint
router.get("/search/food_name/:food_name/num/:num", async (req, res, next) => {
  try {
    const { food_name, num } = req.params;
    const { cuisine, diet, intolerance } = req.query;
    const search_response = await axios.get(`${api_domain}/search`, {
      params: {
        query: food_name,
        // cuisine: cuisine,
        // diet: diet,
        // intolerances: intolerance,
        number: parseInt(num),
        // instructionsRequired: false,
        apiKey: process.env.spooncular_apiKey
      }
    });
    let recipes = await Promise.all(
      search_response.data.results.map((recipe_raw) =>
        getRecipeInfo(recipe_raw.id)
      )
    );
    recipes = recipes.map((recipe) => recipe.data);
    res.send(search_response.data );
  } catch (error) {
    next(error);
  }
});
//#endregion

function getRecipeInfo(id) {
  return axios.get(`${api_domain}/${id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey
    }
  });
}
//recipes/getRandomRecipeId?numberToRetrieve=5
router.get("/getRandomRecipeId",async (req, res, next) => {
  try {
    let { numberToRetrieve } = req.query;
    if(!numberToRetrieve)
    {
      numberToRetrieve = 1;
    }
    const search_response = await axios.get(`${api_domain}/random`, {
      params: {
        number: numberToRetrieve,
        apiKey: process.env.spooncular_apiKey
      }
    });

    let recipes = getIdsFromResult(search_response.data.recipes)

    res.send(recipes );
  } catch (error) {
    next(error);
  }
});


function getIdsFromResult(search_results)
{
  let all_ids = [];
  for (index in search_results)
  {
    all_ids.push(search_results[index].id);
  }
  return all_ids;
}

module.exports = router;
