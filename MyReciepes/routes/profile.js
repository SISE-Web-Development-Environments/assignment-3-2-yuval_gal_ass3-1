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
  const our_db_table_name = "ourDbRecipes";
  const ingredients_table_name = "recipeIngredients";
  const instructions_table_name = "recipeInstructions";
  let allFamilyRecipesIDs = await generic.getRecipesIdFromDB(family_table_name, username);
  let family_recipe_data_array = [];
  let recipe_instructions_map = new Map();
  allFamilyRecipesIDs.forEach(async (recipeId, index, array) => {
      let recId = parseInt(recipeId.recipeID);
      let recData = await DButils.execQuery(`SELECT * FROM ${instructions_table_name} where recipeID = '${recId}'`);
      recipe_instructions_map.set(recipeId, recData);
  })


});

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
