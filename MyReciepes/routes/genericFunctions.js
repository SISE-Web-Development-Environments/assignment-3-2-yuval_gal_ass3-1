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

async function getRecipeInfoOurVersion(recId) {
    const recipe = await getRecipeInfo(recId);
    let {id, title, vegetarian, vegan, glutenFree, preparationMinutes, sourceUrl, image, aggregateLikes} = recipe.data;
    let popularity = aggregateLikes;
    if (!id) {
        id = recId;
    }
    if (!title) {
        title = "Unkown";
    }
    if (vegetarian === undefined) {
        vegetarian = "Unkown";
    }
    if (vegan === undefined) {
        vegan = "Unkown";
    }
    if (glutenFree === undefined) {
        glutenFree = "Unkown";
    }
    if (!preparationMinutes) {
        preparationMinutes = "Unkown";
    } else {
        preparationMinutes = preparationMinutes + " min";
    }
    if (!sourceUrl) {
        sourceUrl = "Unkown";
    }
    if (!image) {
        image = "";
    }
    if (!popularity) {
        popularity = 0;
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
        popularity
    };
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
            `INSERT INTO ${db_table_name} VALUES ('${username}', '${recId}')`
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

module.exports = {getWatchAndFavorite, updateValueForUserAndRecipe, getRecipesIdFromDB, getRecipeInfo, getRecipeInfoOurVersion}