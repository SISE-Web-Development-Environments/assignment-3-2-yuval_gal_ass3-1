var express = require("express");
var router = express.Router();
const DButils = require("../../modules/DButils");
const generic = require("./genericFunctions");

router.use(function requireLogin(req, res, next) {
  if (!req.username) {
    next({ status: 403, message: "Unauthorized" });
  } else {
    next();
  }
});



router.get("/favorites_recipes", async function (req, res, next) {
  try {
    const favorite_table_name = "favoriteRecipes";
    const username = req.username;
    try{

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
    catch (err) {
      //TODO: remove this if not needed
      res.status(500).send({message: "API Key is no longer available"})
    }
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
    get_info_promises.push(generic.get_recipes_details_from_db_by_IDs(recipe_id_in_our_db_array));
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
        let {id, title, image_url, prepTime, popularity, vegan, vegetarian, glutenFree, url} = recipe_from_promises;
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
    if (allFamilyRecipesIDs.length === 0)
    {
      throw {status: 410, message: "Didn't find any Family Recipes"};
    }

    let promises = [];
    promises.push(generic.get_recipes_details_from_db_by_IDs(allFamilyRecipesIDs));
    promises.push(DButils.execQuery(`SELECT * FROM ${family_table_name} where username = '${username}'`));

    let result_from_promises = await Promise.all(promises);

    for (let recipe of result_from_promises[0]) {
      // get the instructions and ingredients of the current recipe
      let {instructions, ingredients} = await generic.get_instructions_and_ingredients(recipe.id);
      recipe.instructions = instructions;
      recipe.ingredients = ingredients;
    }

    let index;
    for (index = 0; index < result_from_promises[1].length; index++) {
      let {recipeID, from_whom, special_time} = result_from_promises[1][index];
      for (let recipe of result_from_promises[0]) {
        if (recipe.id === parseInt(recipeID)) {

          recipe.from_whom = from_whom;
          recipe.special_time = special_time;
        }
      }
    }

    res.status(200).send(JSON.stringify(result_from_promises[0]));
  }
  catch (error) {
    next(error);
  }
});


// Get the last 3 watched recipes
router.get("/get_last_3_watched", async (req, res, next) => {
  try {
    const username = req.username;
    if(username)
    {
      let last_3 = await DButils.execQuery(
          `SELECT TOP 3 recipeId FROM dbo.watchedRecipes WHERE username = '${username}' ORDER BY last_watched DESC`
      );
      let result = [];
      last_3.forEach((recipe) => {
        result.push(recipe.recipeId);
      })
      res.status(200).send(result);
    }
    else
    {
      res.status(401);
    }
  }
  catch (error) {
    res.status(300);
  }
});


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



    res.status(201).send({ message: "Recipe added successfully" });
  }
  catch (error) {
    next(error);
  }
});
//#endregion
router.post("/add_to_favorite", async (req, res, next) => {
  try {
    const username = req.username;
    let {recipeId } = req.body;
    console.log(req.body)
    console.log(recipeId);
    if ( recipeId === undefined) {
      throw {status: 400, message: "Missing recipe id value"};
    }
    const table_name = "favoriteRecipes";
    try{
      let added_recipe = await DButils.execQuery(
          `INSERT INTO ${table_name}(username, recipeID) OUTPUT Inserted.recipeID VALUES ('${username}','${recipeId}')`
      );
      console.log(added_recipe);
      res.status(201).send({ message: "Recipe added successfully" });
    }
    catch (err) {
      res.status(200).send({message: "Recipe is already in your favorites"});
    }


  }
  catch (error) {
    next(error);
  }
});

router.get("/get_profile_pic", async function (req, res, next) {
  try{
    const username = req.username;
    let profPic = await DButils.execQuery(`SELECT profilePicUrl FROM users where username like '${username}'`)
    res.status(200).send({
      url: profPic[0].profilePicUrl
    })
  }
  catch(err)
  {
    throw {status: 401, message: "user must be logged in"}
  }
})

module.exports = router;
