require("dotenv").config();
var express = require("express");
var router = express.Router();
const generic = require("./genericFunctions");
const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("../../modules/DButils");

router.get("/", (req, res) => res.send("im here"));

// recId can be only a single integer
router.get("/preview/recId/:recId", async (req, res, next) => {
  try {
    let { recId } = req.params;
    //let {id, title, vegetarian, vegan, glutenFree, preparationMinutes, sourceUrl, image, popularity} = await generic.getRecipeInfoOurVersion(recId);
    //  let {watchedRecipe, savedRecipe} = await generic.getWatchAndFavorite(recId, req.username);
    let promises = [];
    if(recId < 10000000) {
      promises.push(generic.getRecipeInfoOurVersion(recId));
      promises.push(generic.getWatchAndFavorite(recId, req.username));
    }
    else
    {
      let array_of_id = [];
      array_of_id.push(recId);
      promises.push(generic.get_recipes_details_from_db_by_IDs(array_of_id));
      promises.push(generic.getWatchAndFavorite(recId, req.username));
    }
    try {
      let result = await Promise.all(promises);
      let {id, title, vegetarian, vegan, glutenFree, prepTime, url, image_url, popularity} = ((result[0] instanceof Array) ? result[0][0] : result[0])
      let {watchedRecipe, savedRecipe} = result[1];

      res.send({
        id: id,
        image_url: image_url,
        title: title,
        prepTime: prepTime,
        popularity: popularity,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        url: url,
        watched: watchedRecipe,
        saved: savedRecipe
      });
    }
    catch (error) {
      res.status(400).send({message: "Could not find the recId"});
    }

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
    instructions.push("Step" + steps[i].number+": "+steps[i].step)
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
  if(ingredients == null ){
    return [];
  }
  let ingredientsJson = [];
  for(let i in ingredients){
    ingredientsJson.push({name: ingredients[i].name , count: ingredients[i].amount.us.value +" "+ingredients[i].amount.us.unit})
  }
  return ingredientsJson;
}

router.get("/recipe_page/recId/:recId", async (req, res, next) => {
  try {
    const recipe_id = req.params.recId;
    const username = req.username;
    if(recipe_id < 10000000) {
      try {
        res.send(await get_recipe_page_api(recipe_id, username));
      }
      catch (err) {
        res.status(400).send({message: "Could bla blabla"})
      }
    }
    else
    {
      console.log("username =", username);
      console.log("ID =", recipe_id);
      if(username)
      {
        let get_all_ids_of_user_promises = [];
        let personal_table_name = "personalRecipes";
        let family_table_name = "familyRecipes";
        get_all_ids_of_user_promises.push(DButils.execQuery(`SELECT recipeID from ${personal_table_name} where username='${username}'`));
        get_all_ids_of_user_promises.push(DButils.execQuery(`SELECT recipeID from ${family_table_name} where username='${username}'`));
        let allIDs = await Promise.all(get_all_ids_of_user_promises);
        let index;
        let recipe_id_int = parseInt(recipe_id);
        for (index = 0; index < allIDs.length ; index++)
        {
          for(let specific_recipe in allIDs[index])
          {
            if(allIDs[index][specific_recipe].recipeID === recipe_id_int){
              res.send(await get_recipe_page_db(recipe_id, username));
              return;
            }
          }
        }

      }
      else
      {
        res.status(403).send({message: "Unauthorized"})
        return;
      }
      throw {status: 400, message: "Could not find the recipe ID"};
    }

  } catch (error) {
    next({status: 400, message: "Could not find the recipe ID"});
  }
});


async function get_recipe_page_db(recipeID, username)
{
  let promises = [];
  let array_of_id = [];
  array_of_id.push(recipeID);
  promises.push(generic.get_instructions_and_ingredients(recipeID));
  promises.push(generic.get_recipes_details_from_db_by_IDs(array_of_id));
  promises.push(generic.getWatchAndFavorite(recipeID, username));
  let result = await Promise.all(promises);
  const instructions = result[0].instructions;
  const ingredients = result[0].ingredients;
  let {watchedRecipe, savedRecipe} = result[2];
  const watchedRecipeTableName = "watchedRecipes";
  if(watchedRecipe !== true){
    await generic.updateValueForUserAndRecipe(watchedRecipeTableName, recipeID, username);
  }
  else {
    await generic.updateWatchedDate(username, recipeID);
  }
  let { id, title, vegetarian, vegan, glutenFree, prepTime, url, image_url, popularity, num_of_dishes } = result[1][0];

  return ({
    id,
    image_url,
    title,
    prepTime,
    popularity,
    vegan,
    vegetarian,
    glutenFree,
    url,
    watched: watchedRecipe,
    saved: savedRecipe,
    num_of_dishes,
    ingredients,
    instructions});
}

/**
 * Get Recipe Details from Spoonacular API
 */
async function get_recipe_page_api(recipeID, username)
{
  let promises = [];
  promises.push(getRecipeAnalyzedInstructions(recipeID));
  promises.push(getIngredientWidget(recipeID));
  promises.push(generic.getWatchAndFavorite(recipeID, username));
  promises.push(generic.getRecipeInfoOurVersion(recipeID));
  let result = await Promise.all(promises);
  const instructions = result[0];
  const ingredients = result[1];
  let jsonIngredients,jsonSteps;
  if(instructions.data.length !== 0)
  {
    jsonSteps = getStepsJson(instructions.data[0].steps);
  }
  else
  {
    jsonSteps = [];
  }
  if( ingredients.data.length !== 0)
  {
    jsonIngredients = getIngredientsJson(ingredients.data.ingredients);
  }
  else
  {
    jsonIngredients = [];
  }
  let {watchedRecipe, savedRecipe} = result[2];
  const watchedRecipeTableName = "watchedRecipes";
  if(watchedRecipe !== true){
    await generic.updateValueForUserAndRecipe(watchedRecipeTableName, recipeID, username);
  }
  else {
    await generic.updateWatchedDate(username, recipeID);
  }
  let { id, title, vegetarian, vegan, glutenFree, prepTime, url, image_url, popularity, num_of_dishes } = result[3];
  return {
    id,
    title,
    vegetarian,
    vegan,
    glutenFree,
    prepTime,
    url,
    image_url,
    popularity,
    num_of_dishes,
    watched: watchedRecipe,
    saved: savedRecipe,
    ingredients: jsonIngredients ,
    instructions: jsonSteps
  }

}

//recipes/Search/food_name/5ergd/num/5?cuisine=American&diet=Ketogenic&intolerance=Egg
function getAllIdsFromResponse(search_response) {
  let ids = [];
  let recipes = search_response.data.results;
  for ( r in recipes) {
    ids.push(recipes[r].id);
  }
  return ids;
}

function getRelevantData(response) {
  return response.map((response) => {
    const{
      id,
      image,
      title,
      preparationMinutes,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      sourceUrl,
    } = response.data;
    return {
      id: id,
      image_url: image,
      title: title,
      prepTime: preparationMinutes,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      url: sourceUrl,
      watched:"",
      saved:"",
    }
  })

}

//#region example1 - make serach endpoint
router.get("/search/food_name/:food_name/num/:num", async (req, res, next) => {
  try {
    console.log("search");
    const {food_name, num} = req.params;
    let checkNumber = parseInt(num);
    if ((!(checkNumber === 5 || checkNumber === 10 || checkNumber === 15))) {
      throw {status: 400, message: "Wrong parameters given"};
    }
    let searchParams = {};
    const queryList = ["diet", "cuisine", "intolerance"];
    queryList.forEach((param) => {
      if (req.query[param]) {
        searchParams[param] = req.query[param];
      }
    });
    searchParams.number =checkNumber;
    searchParams.query = food_name;
    searchParams.instructionsRequired= true;
    searchParams.apiKey = process.env.spooncular_apiKey;
    const search_response = await axios.get(`${api_domain}/search`, {
      params: searchParams,
    });
    let ids = getAllIdsFromResponse(search_response);
    let promise = [] ;
    for (i in ids){
      promise.push(axios.get(`${api_domain}/${ids[i]}/information`, {
        params: {
          includeNutrition: false,
          apiKey: process.env.spooncular_apiKey
        }}));}
    let response = await Promise.all(promise);
    let relevantResponse = getRelevantData(response);
    for( i in relevantResponse){
      let {watchedRecipe, savedRecipe} = await generic.getWatchAndFavorite(relevantResponse[i].id, req.username);
      relevantResponse[i].watched=  watchedRecipe;
      relevantResponse[i].saved=  savedRecipe;
    }
    res.send(relevantResponse);
  } catch (error) {
    next(error);
  }
});
//#endregion


function getRecipeAnalyzedInstructions(id) {
  return axios.get(`${api_domain}/${id}/analyzedInstructions`, {
    params: {
      stepBreakdown: true,
      apiKey: process.env.spooncular_apiKey
    }
  });
}

function getPreviewInformation(recipePrev){
  return recipePrev.map((recipePrev) =>{
    const{
      id: id,
      image_url: image,
      title: title,
      prepTime: preparationMinutes,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      url: sourceUrl,
    } = recipePrev.data;
    return{
      id: id,
      image_url: image,
      title: title,
      prepTime: preparationMinutes,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree,
      url: sourceUrl,
    };
  });


}


//recipes/getRandomRecipeId?numberToRetrieve=5
router.get("/get_random_recipe_id",async (req, res, next) => {
  try {
    let { numberToRetrieve } = req.query;
    if(!numberToRetrieve)
    {
      numberToRetrieve = 3;
    }
    let promises = [];
    var search_response;
    let recipeWithoutInstruction = false;
    while (!recipeWithoutInstruction) {
      recipeWithoutInstruction = true;
      search_response = await axios.get(`${api_domain}/random`, {
        params: {
          number: numberToRetrieve,
          apiKey: process.env.spooncular_apiKey
        }
      });
      let recipe = search_response.data.recipes;
      for (i in recipe) {
        promises.push(generic.getRecipeInfo(recipe[i].id));
      }
      let result = await Promise.all(promises);
      for (id in result){
        if(result[id].data.analyzedInstructions.length === 0){
          recipeWithoutInstruction = false;
        }
      }
    }
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
