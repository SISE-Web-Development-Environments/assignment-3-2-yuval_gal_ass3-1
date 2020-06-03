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



router.get("/favorites", function (req, res) {
  res.send(req.originalUrl);
});

router.get("/personalRecipes", function (req, res) {
  res.send(req.originalUrl);
});

router.get("/FamilyRecipes", async function (req, res) {
  const username = req.username;
  const family_table_name = "familyRecipes";

  let allFamilyRecipesIDs = await generic.getRecipesIdFromDB(family_table_name, username);



  let recipe_array = await get_recipes_details_from_db_by_IDs(allFamilyRecipesIDs);
  let allUserFamilyRecipes = await DButils.execQuery(`SELECT * FROM ${family_table_name} where username = '${username}'`);

  let index;
  for (index = 0; index < allUserFamilyRecipes.length; index++)
  {
    let {recipeID, from_whom, special_time, family_image} = allUserFamilyRecipes[index];
    for (let recipe of recipe_array)
    {
        if(recipe.id === parseInt(recipeID))
        {
          recipe.from_whom = from_whom;
          recipe.special_time = special_time;
          recipe.family_image = family_image;
        }
    }
  }

  res.status(200).send(JSON.stringify(recipe_array));
});

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
  const ingredients_table_name = "recipeIngredients";
  const instructions_table_name = "recipeInstructions";
  const our_db_table_name = "ourDbRecipes";

  let recipe_array = [];
  for (index = 0; index < arrayOfIds.length; index++) {
    let recipeId = arrayOfIds[index];
    let recId = parseInt(recipeId.recipeID);
    let recData = await DButils.execQuery(`SELECT * FROM ${instructions_table_name} where recipeID = '${recId}'`);

    let instruction_array = await getInstructionArrayFromData(recData);


    recData = await DButils.execQuery(`SELECT * FROM ${ingredients_table_name} where recipeID = '${recId}'`);
    let ingredient_array = await getIngredientArrayFromData(recData);

    recData = await DButils.execQuery(`SELECT * FROM ${our_db_table_name} where recipeID = '${recId}'`);
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
      "num_of_dished": num_of_dishes,
      "instructions": instruction_array,
      "ingredients": ingredient_array
    })

  }
  return recipe_array;
}


router.post("/addPersonalRecipe", async (req, res, next) => {
  try {
    await DButils.execQuery(
      `INSERT INTO recipes VALUES (default, '${req.username}', '${req.body.recipe_name}')`
    );
    res.send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
//#endregion

module.exports = router;
