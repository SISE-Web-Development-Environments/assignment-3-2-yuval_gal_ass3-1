require("dotenv").config();
const DButils = require("../../modules/DButils");

const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";

async function getWatchAndFavorite(recId, username) {
    let watchedRecipe = false;
    let savedRecipe = false;
    const watchedRecipeTableName = "watchedRecipes";
    const savedRecipeTableName = "favoriteRecipes";
    let promises = [];
    promises.push(is_recipe_in_db_for_user(watchedRecipeTableName, recId, username));
    promises.push(is_recipe_in_db_for_user(savedRecipeTableName, recId, username));
    let result = await Promise.all(promises);
    watchedRecipe = result[0];
    savedRecipe = result[1];
    return {watchedRecipe, savedRecipe};
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

async function updateWatchedDate(username, recipe_id)
{
    let watchedRecipeTableName = 'watchedRecipes';
    await DButils.execQuery(`UPDATE ${watchedRecipeTableName} SET last_watched = GETDATE() WHERE username = '${username}' AND recipeID = '${recipe_id}'`);
}


async function getRecipeInfoOurVersion(recId) {
    const recipe = await getRecipeInfo(recId);
    let {id, title, vegetarian, vegan, glutenFree, preparationMinutes, sourceUrl, image, aggregateLikes, servings} = recipe.data;
    console.log(preparationMinutes);
    let popularity = aggregateLikes;
    let num_of_dishes = servings;
    if (!id) {
        id = recId;
    }
    if (!title) {
        title = "unknown";
    }
    if (vegetarian === undefined) {
        vegetarian = false;
    }
    if (vegan === undefined) {
        vegan = false;
    }
    if (glutenFree === undefined) {
        glutenFree = false;
    }
    if (!preparationMinutes) {
        preparationMinutes = "40";
    }
    if (!sourceUrl) {
        sourceUrl = "unknown";
    }
    if (!image) {
        image = "";
    }
    if (!popularity) {
        popularity = 0;
    }
    if (!num_of_dishes) {
        num_of_dishes = 0;
    }
    return {
        id,
        title,
        vegetarian,
        vegan,
        glutenFree,
        prepTime: preparationMinutes,
        url: sourceUrl,
        image_url: image,
        popularity,
        num_of_dishes};
}

async function getRecipeInfo(id) {
    return axios.get(`${api_domain}/${id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function updateValueForUserAndRecipe(db_table_name, recId, username) {
    if (username) {
        await DButils.execQuery(
            `INSERT INTO ${db_table_name} (username, recipeId) VALUES ('${username}', '${recId}')`
        );
    }
}


async function getRecipesIdFromDB(db_table_name, username) {
    return await DButils.execQuery(`SELECT recipeID FROM ${db_table_name} where username = '${username}'`);
}

async function is_recipe_in_db_for_user(db_table_name, recId, username) {
    let result = false;
    if (username) {
        // IF there is a cookie, then find out if the user already watched this recipe
        let watchedRecipes = await getRecipesIdFromDB(db_table_name, username);
        watchedRecipes.forEach((recipeIdDB, index, array) => {
            let recIdUrl = parseInt(recId);
            if (recIdUrl === recipeIdDB.recipeID) {
                result = true;
            }
        });
    }
    return result;
}

//
// /**
//  * Get recipe data from our db  by the recipe ID
//  * @param recipeID the ID of the recipe to get data about
//  * @param tables_to_join a comma separated value of the tables name to join
//  *          the data from
//  * @returns {Promise<void>}
//  */
// async function get_recipe_data_from_db_join_input(recipeID, tables_to_join)
// {
//     const join_array = tables_to_join.split(",");
// }

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




module.exports = {getWatchAndFavorite, get_instructions_and_ingredients, updateValueForUserAndRecipe, getRecipesIdFromDB, updateWatchedDate,getRecipeInfo, get_recipes_details_from_db_by_IDs, getRecipeInfoOurVersion}