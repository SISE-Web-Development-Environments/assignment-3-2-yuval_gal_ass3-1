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

module.exports = {getWatchAndFavorite, updateValueForUserAndRecipe, getRecipesIdFromDB}