var express = require("express");
var router = express.Router();
const DButils = require("../../modules/DButils");
const generic = require("./genericFunctions");

router.use(function requireLogin(req, res, next) {
  if (!req.username) {
    next({ status: 401, message: "unauthorized" });
  } else {
    next();
  }
});



router.get("/favorites", async function (req, res, next) {
  try {
    const favorite_table_name = "favoriteRecipes";
    const username = req.username;

    let recipe_array = await get_all_relevant_recipes(username, favorite_table_name);

    for (let recipe of recipe_array) {
      // get the instructions and ingredients of the current recipe
      let {watchedRecipe, savedRecipe} = await generic.getWatchAndFavorite(recipe.id, username);
      recipe.watched = watchedRecipe;
      recipe.saved = savedRecipe;
    }

    res.status(200).send(JSON.stringify(recipe_array));
  }
  catch (error) {
    next(error);
  }
});

async function get_all_relevant_recipes(username, table_name)
{
  try {
    let allRecipeIDs = await generic.getRecipesIdFromDB(table_name, username);
    let recipe_array = [];
    let recipe_id_in_our_db_array = [];

    //TODO: go to DB only for IDs that are greater than 10million
    for (let recipe of allRecipeIDs)
    {
      if(recipe.recipeID >= 10000000)
      {
        recipe_id_in_our_db_array.push(recipe.recipeID);
      }
      else
      {
        let our_format_recipe = await generic.getRecipeInfoOurVersion(recipe.recipeID);
        recipe_array.push(our_format_recipe)
      }
    }
    let recieved_array = await get_recipes_details_from_db_by_IDs(recipe_id_in_our_db_array);
    for (let index in recieved_array)
    {
      recipe_array.push(recieved_array[index]);
    }
    return recipe_array;
  }
  catch (error) {
    throw error;
  }
}
router.get("/personalRecipes", async function (req, res, next) {

  try {
    const personal_table_name = "personalRecipes";

    let recipe_array = await get_all_relevant_recipes(req.username, personal_table_name);

    for (let recipe of recipe_array) {
      // get the instructions and ingredients of the current recipe
      let {watchedRecipe, savedRecipe} = await generic.getWatchAndFavorite(recipe.id,req.username);
      recipe.watched = watchedRecipe;
      recipe.saved = savedRecipe;
    }

    res.status(200).send(JSON.stringify(recipe_array));
  }
  catch (error) {
    next(error);
  }
});

router.get("/FamilyRecipes", async function (req, res, next) {
  try {
    const username = req.username;
    const family_table_name = "familyRecipes";

    let allFamilyRecipesIDs = await generic.getRecipesIdFromDB(family_table_name, username);


    let recipe_array = await get_recipes_details_from_db_by_IDs(allFamilyRecipesIDs);
    let allUserFamilyRecipes = await DButils.execQuery(`SELECT * FROM ${family_table_name} where username = '${username}'`);

    for (let recipe of recipe_array) {
      // get the instructions and ingredients of the current recipe
      let {instructions, ingredients} = await get_instructions_and_ingredients(recipe.id);
      recipe.instructions = instructions;
      recipe.ingredients = ingredients;
    }

    let index;
    for (index = 0; index < allUserFamilyRecipes.length; index++) {
      let {recipeID, from_whom, special_time, family_image} = allUserFamilyRecipes[index];
      for (let recipe of recipe_array) {
        if (recipe.id === parseInt(recipeID)) {

          recipe.from_whom = from_whom;
          recipe.special_time = special_time;
          recipe.family_image = family_image;
        }
      }
    }

    res.status(200).send(JSON.stringify(recipe_array));
  }
  catch (error) {
    next(error);
  }
});


async function get_instructions_and_ingredients(recipe_id)
{
  const ingredients_table_name = "recipeIngredients";
  const instructions_table_name = "recipeInstructions";
  let recData = await DButils.execQuery(`SELECT * FROM ${instructions_table_name} where recipeID = '${recipe_id}'`);

  let instruction_array = await getInstructionArrayFromData(recData);


  recData = await DButils.execQuery(`SELECT * FROM ${ingredients_table_name} where recipeID = '${recipe_id}'`);
  let ingredient_array = await getIngredientArrayFromData(recData);

  return {
    instructions: instruction_array,
    ingredients: ingredient_array
  }
}
async function getInstructionArrayFromData(recData) {
  let instruction_array = [];
  var index;
  for (index = 0; index < recData.length; index++)
  {
    instruction_array.push("Step " + recData[index].step + ": " + recData[index].step_instruction );
  }

  return instruction_array;
}

async function getIngredientArrayFromData(recData) {
  let ingredient_array = [];
  var index;
  for (index = 0; index < recData.length; index++)
  {
    ingredient_array.push({
      "name": recData[index].name,
      "count": recData[index].count
    });
  }

  return ingredient_array;
}

async function get_recipes_details_from_db_by_IDs(arrayOfIds)  {
  var index;

  const our_db_table_name = "ourDbRecipes";

  let recipe_array = [];
  for (index = 0; index < arrayOfIds.length; index++) {
    let recipeId = arrayOfIds[index];
    let recId = parseInt(recipeId.recipeID);
    if(isNaN(recId))
    {
      recId = recipeId;
    }

    let recData = await DButils.execQuery(`SELECT * FROM ${our_db_table_name} where recipeID = '${recId}'`);
    let {recipeID, title, image_url, prepTime, popularity, vegan, vegetarian, glutenFree, url, num_of_dishes} = recData[0];

    recipe_array.push({
      "id": recipeID,
      "title": title,
      "image_url": image_url,
      "prepTime": prepTime,
      "popularity": popularity,
      "vegan": vegan,
      "vegeterian": vegetarian,
      "glutenFree": glutenFree,
      "url": url,
      "num_of_dished": num_of_dishes
    })

  }
  return recipe_array;
}


router.post("/addRecipe", async (req, res, next) => {
  try {
    const username = req.username;
    let {image_url, title, prepTime, vegan, vegeterian, glutenFree, url, instructions, ingredients, num_of_dishes } = req.body;
    let popularity = 0;
    if(image_url === null || title === null || prepTime === null || url === null || instructions === null || ingredients === null || num_of_dishes === null)
    {
      throw {status: 401, message: "missing params"};
    }

    if(vegan === null)
    {
      vegan = false;
    }
    if(vegeterian === null)
    {
      vegeterian = false;
    }
    if(glutenFree === null)
    {
      glutenFree = false;
    }

    const personal_recipe_table_name = "personalRecipe";
    const our_db_table_name = "ourDbRecipes";
    const instruction_table_name = "recipeInstructions";
    const ingredient_table_name = "recipeIngredients";
    let id = await DButils.execQuery(
      `INSERT INTO '${our_db_table_name}' VALUES (1, '${image_url}','${title}','${prepTime}','${popularity}','${vegan}','${vegeterian}','${glutenFree}','${url}')`
    );


    res.send({ sucess: true, cookie_valid: req.username && 1 });
  }
  catch (error) {
    next(error);
  }
});
//#endregion

module.exports = router;
