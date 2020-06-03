const DButils = require("../../modules/DButils");

async function getWatchAndFavorite(recId, req) {
    let watchedRecipe = false;
    let savedRecipe = false;
    const watchedRecipeTableName = "watchedRecipes";
    const savedRecipeTableName = "favoriteRecipes";
    watchedRecipe = await is_recipe_in_db_for_user(watchedRecipeTableName, recId, req.username);
    savedRecipe = await is_recipe_in_db_for_user(savedRecipeTableName, recId, req.username);
    return {watchedRecipe, savedRecipe};
}

async function updateValueForUserAndRecipe(db_table_name, recId, username) {
    if (username) {
        await DButils.execQuery(
            `INSERT INTO ${db_table_name} VALUES ('${username}', '${recId}')`
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

module.exports = {getWatchAndFavorite, updateValueForUserAndRecipe}