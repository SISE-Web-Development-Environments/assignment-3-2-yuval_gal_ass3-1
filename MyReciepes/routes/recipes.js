var express = require("express");
var router = express.Router();
const DButils = require("../../modules/DButils");
const axios = require("axios");

const api_domain = "https://api.spoonacular.com/recipes";

router.get("/", (req, res) => res.send("im here"));

// recId can be only a single integer
router.get("/preview/recId/:recId", async (req, res, next) => {

  try {
    let { recId } = req.params;
    const recipe = await getRecipeInfo(recId);
    let { id, title, vegetarian, vegan, glutenFree, preparationMinutes, sourceUrl, image, aggregateLikes } = recipe.data;

    if(!id)
    {
      id = recId
    }
    if(!title)
    {
      title = "Unkown"
    }
    if(vegetarian === undefined)
    {
      vegetarian = "Unkown"
    }
    if(vegan === undefined)
    {
      vegan = "Unkown"
    }
    if(glutenFree === undefined)
    {
      glutenFree = "Unkown"
    }
    if(!preparationMinutes)
    {
      preparationMinutes = "Unkown"
    }
    else
    {
      preparationMinutes = preparationMinutes + " min"
    }
    if(!sourceUrl)
    {
      sourceUrl = "Unkown"
    }
    if(!image)
    {
      image = ""
    }
    if(!aggregateLikes)
    {
      aggregateLikes = 0
    }

    let watchedRecipe = false;
    let savedRecipe = false;
    const watchedRecipeTableName = "watchedRecipes";
    const savedRecipeTableName = "savedRecipes";
    watchedRecipe = await is_recipe_in_db_for_user(watchedRecipeTableName, recId, req.username);
    savedRecipe = await is_recipe_in_db_for_user(savedRecipeTableName, recId, req.username);

    // res.send({ data: recipe.data})
    res.send({
      id: id,
      image_url: image,
      title: title,
      prepTime: preparationMinutes,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      url: sourceUrl,
      watched: watchedRecipe,
      saved: savedRecipe
    });
  } catch (error) {
    next(error);
  }
});

function getStepsJson(steps) {
  if(steps == null){
    return [];
  }
  let instructions = [];
  for( i in steps){
    instructions.push("step" + steps[i].number+": "+steps[i].step)
  }
  return instructions;
}

async function getIngredientWidget(recipe_id) {
  return axios.get(`${api_domain}/${recipe_id}/ingredientWidget.json`, {
    params: {
      apiKey: process.env.spooncular_apiKey
    }
  });
}

function getIngredientsJson(ingredients) {
  if(ingredients == null){
    return [];
  }
  let ingredientsJson = [];
  for( i in ingredients){
    ingredientsJson.push({name: ingredients[i].name , count: ingredients[i].amount.us.value +" "+ingredients[i].amount.us.unit})
  }
  return ingredientsJson;
}

router.get("/Information", async (req, res, next) => {
  try {
    const recipe_id = req.query.recipe_id;
    const recipeInformation = await getRecipeInfo(req.query.recipe_id);
    const num_of_dishes = recipeInformation.data.servings;
    const instructions = await getRecipeAnalyzedInstructions(req.query.recipe_id);
    const ingredients = await getIngredientWidget(req.query.recipe_id);
    let jsonIngredients = getIngredientsJson(ingredients.data.ingredients);
    let jsonSteps= getStepsJson(instructions.data[0].steps);
    let watchedRecipe = false;
    let savedRecipe = false;
    const watchedRecipeTableName = "watchedRecipes";
    const savedRecipeTableName = "savedRecipes";
    watchedRecipe = await is_recipe_in_db_for_user(watchedRecipeTableName, recipe_id, req.username);
    savedRecipe = await is_recipe_in_db_for_user(savedRecipeTableName, recipe_id, req.username);
    if(watchedRecipe !== true){
      await updateWatchValueForUserAndRecipe(watchedRecipe, recipe_id, req.username);
    }
    let { id, title, vegetarian, vegan, glutenFree, preparationMinutes, sourceUrl, image, aggregateLikes } = recipeInformation.data;
    res.send({
      id: id,
      image_url: image,
      title: title,
      prepTime: preparationMinutes,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      url: sourceUrl,
      watched: watchedRecipe,
      saved: savedRecipe,
      num_of_dishes: num_of_dishes ,
      ingredients: jsonIngredients ,
      instructions: jsonSteps });
  } catch (error) {
    next(error);
  }
});

async function updateWatchValueForUserAndRecipe(db_table_name, recId, username) {
  let result = false;
  if (username) {
    await DButils.execQuery(
        `INSERT INTO users VALUES ('${username}', '${recId}')`
    );
  }
}

async function is_recipe_in_db_for_user(db_table_name, recId, username) {
  let result = false;
  if (username) {
    // IF there is a cookie, then find out if the user already watched this recipe
    let watchedRecipes = await DButils.execQuery(`SELECT recipeID FROM ${db_table_name} where username = '${username}'`);
    watchedRecipes.forEach((recipeIdDB, index, array) => {
      let recIdUrl = parseInt(recId);
      if (recIdUrl === recipeIdDB.recipeID) {
        result = true;
      }
    });
  }
  return result;
}


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

function getRecipeAnalyzedInstructions(id) {
  return axios.get(`${api_domain}/${id}/analyzedInstructions`, {
    params: {
      stepBreakdown: true,
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
