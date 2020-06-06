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
    if (recipe_array.length === 0)
    {
      throw {status: 410, message: "Didn't find any Favorite Recipes"};
    }

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

    let get_info_promises = [];

    for (let recipe of allRecipeIDs)
    {
      if(recipe.recipeID >= 10000000)
      {
        recipe_id_in_our_db_array.push(recipe.recipeID);
      }
      else
      {
        get_info_promises.push(generic.getRecipeInfoOurVersion(recipe.recipeID));
        // let our_format_recipe = await generic.getRecipeInfoOurVersion(recipe.recipeID);
        // recipe_array.push(our_format_recipe);
      }
    }
    get_info_promises.push(get_recipes_details_from_db_by_IDs(recipe_id_in_our_db_array));
    let all_id_data = await Promise.all(get_info_promises);

    all_id_data.map((recipe_from_promises) => {
      if(recipe_from_promises instanceof Array)
      {
        // The result from the async functions can be an array
        recipe_from_promises.map((in_recipe) => {
          let {id, title, image_url, prepTime, popularity, vegan, vegetarian, glutenFree, url} = in_recipe;
          recipe_array.push({
            id,
            title,
            image_url,
            prepTime,
            popularity,
            vegan,
            vegetarian,
            glutenFree,
            url
          });
        })
      }
      else
      {
        recipe_array.push(recipe_from_promises);
      }
    })

    return recipe_array;
  }
  catch (error) {
    throw error;
  }
}

router.get("/personal_recipes", async function (req, res, next) {

  try {
    const personal_table_name = "personalRecipes";

    let recipe_array = await get_all_relevant_recipes(req.username, personal_table_name);
    if (recipe_array.length === 0)
    {
      throw {status: 410, message: "Didn't find any owned Recipes"};
    }

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


router.get("/family_recipes", async function (req, res, next) {
  try {
    const username = req.username;
    const family_table_name = "familyRecipes";

    let allFamilyRecipesIDs = await generic.getRecipesIdFromDB(family_table_name, username);

    let promises = [];
    promises.push(get_recipes_details_from_db_by_IDs(allFamilyRecipesIDs));
    promises.push(DButils.execQuery(`SELECT * FROM ${family_table_name} where username = '${username}'`));

    let result_from_promises = await Promise.all(promises);

    for (let recipe of result_from_promises[0]) {
      // get the instructions and ingredients of the current recipe
      let {instructions, ingredients} = await get_instructions_and_ingredients(recipe.id);
      recipe.instructions = instructions;
      recipe.ingredients = ingredients;
    }

    let index;
    for (index = 0; index < result_from_promises[1].length; index++) {
      let {recipeID, from_whom, special_time, family_image} = result_from_promises[1][index];
      for (let recipe of result_from_promises[0]) {
        if (recipe.id === parseInt(recipeID)) {

          recipe.from_whom = from_whom;
          recipe.special_time = special_time;
          recipe.family_image = family_image;
        }
      }
    }

    res.status(200).send(JSON.stringify(result_from_promises[0]));
  }
  catch (error) {
    next(error);
  }
});


async function get_instructions_and_ingredients(recipe_id)
{
  const ingredients_table_name = "recipeIngredients";
  const instructions_table_name = "recipeInstructions";

  let promises_from_db = [];
  promises_from_db.push(DButils.execQuery(`SELECT * FROM ${instructions_table_name} where recipeID = '${recipe_id}'`));
  promises_from_db.push(DButils.execQuery(`SELECT * FROM ${ingredients_table_name} where recipeID = '${recipe_id}'`));
  let relevant_data = await Promise.all(promises_from_db);

  let instructions = getInstructionArrayFromData(relevant_data[0]);
  let ingredients = getIngredientArrayFromData(relevant_data[1]);

  return {
    instructions: instructions,
    ingredients: ingredients
  }
}
function getInstructionArrayFromData(recData) {
  let instruction_array = [];
  var index;
  for (index = 0; index < recData.length; index++)
  {
    instruction_array.push("Step" + recData[index].step + ": " + recData[index].step_instruction );
  }

  return instruction_array;
}

function getIngredientArrayFromData(recData) {
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
      "vegetarian": vegetarian,
      "glutenFree": glutenFree,
      "url": url,
      "num_of_dishes": num_of_dishes
    })

  }
  return recipe_array;
}


router.post("/add_recipe", async (req, res, next) => {
  try {
    const username = req.username;
    let {image_url, title, prepTime, vegan, vegeterian, glutenFree, url, instructions, ingredients, num_of_dishes, from_whom, special_time} = req.body;
    let popularity = 0;
    if (image_url === undefined || title === undefined || prepTime === undefined || url === undefined || instructions === undefined || ingredients === undefined || num_of_dishes === undefined) {
      throw {status: 400, message: "Failed to create Recipe"};
    }

    if (vegan === undefined) {
      vegan = false;
    }
    if(vegeterian === undefined)
    {
      vegeterian = false;
    }
    if(glutenFree === undefined)
    {
      glutenFree = false;
    }

    if (vegan)
    {
      vegan = 1;
    }
    else{
      vegan = 0;
    }

    if (vegeterian)
    {
      vegeterian = 1;
    }
    else{
      vegeterian = 0;
    }

    if (glutenFree)
    {
      glutenFree = 1;
    }
    else{
      glutenFree = 0;
    }

    const our_db_table_name = "ourDbRecipes";
    const instruction_table_name = "recipeInstructions";
    const ingredient_table_name = "recipeIngredients";
    let added_recipe = await DButils.execQuery(
      `INSERT INTO ${our_db_table_name}(image_url, title, prepTime, popularity,vegan ,vegetarian, glutenFree, url, num_of_dishes) OUTPUT Inserted.recipeID VALUES ('${image_url}','${title}','${prepTime}', '${popularity}','${vegan}','${vegeterian}','${glutenFree}','${url}', '${num_of_dishes}')`
    );

    let id = added_recipe[0].recipeID;
    let add_instructions_promises = [];
    for(let index in instructions)
    {
      let step = instructions[index].split(":")[0];
      let index_of_p = step.indexOf("p");
      let step_number = step.substring(index_of_p+1);
      let instruction = instructions[index].split(":")[1];
      add_instructions_promises.push(DButils.execQuery(
          `INSERT INTO ${instruction_table_name}(step, step_instruction, recipeID) VALUES (${step_number}, '${instruction}', ${id})`
      ));
    }
    await Promise.all(add_instructions_promises);

    let add_ingredient_promises = [];
    for(let ingredient_index in ingredients)
    {
      let name = ingredients[ingredient_index].name;
      let count = ingredients[ingredient_index].count;
      add_ingredient_promises.push(DButils.execQuery(
        `INSERT INTO ${ingredient_table_name}(name, count, recipeID) VALUES ('${name}', '${count}', ${id})`
      ));
    }
    await Promise.all(add_ingredient_promises);

    const personal_recipe_table_name = "personalRecipes";
    const family_table_name = "familyRecipes";
    if(from_whom !== undefined && special_time !== undefined)
    {
      // This is a family recipe
      await  DButils.execQuery(
          `INSERT INTO ${family_table_name} VALUES ('${username}', ${id}, '${from_whom}', '${special_time}', '')`
      );
    }
    else
    {
      //This is a personal Recipe
      await  DButils.execQuery(
          `INSERT INTO ${personal_recipe_table_name} VALUES ('${username}', ${id})`
      );
    }



    res.send({ message: "Recipe added successfully", status: 201 });
  }
  catch (error) {
    next(error);
  }
});
//#endregion

module.exports = router;
