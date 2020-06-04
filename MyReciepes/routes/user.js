var express = require("express");
var router = express.Router();
const DButils = require("../../modules/DButils");
const bcrypt = require("bcrypt");
const generic = require("./genericFunctions");


router.post("/Register", async (req, res, next) => {
  try {
    // Checks id all the parameters sent
    if(!req.body.username || !req.body.password || !req.body.firstName ||
        !req.body.lastName || !req.body.email || !req.body.profilePic ||
        !req.body.country){
      throw { status: 400, message: "Not all registration parameters have been sent" };
    }
    // Valid parameters
    //Validate Username - need to be between 3 and 8 chars
    if(req.body.username.length < 3 || req.body.username.length >8){
      throw { status: 400, message: "The username should be between 3 and 8 characters" };
    }
    //Validate password - need to be between 5 and 10 chars
    if(req.body.password.length < 5 || req.body.password.length >10){
      throw { status: 400, message: "The password should be between 5 and 10 characters" };
    }
    //Validate password - should include at least one number
    if(req.body.password.search(/\d/) === -1) {
      throw {status: 400, message: "The password should include at least one number"};
    }
    //Validate password - should include at least one special char
     if(req.body.password.match(/^[A-Z,a-z,0-9]*$/)){
         throw { status: 400, message: "The password should include at least one special char" };
     }
    // username exists
    const users = await DButils.execQuery("SELECT username FROM users");

    if (users.find((x) => x.username === req.body.username))
      throw { status: 409, message: "Username taken" };

    // add the new username
    let hash_password = bcrypt.hashSync(
        req.body.password,
        parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
        `INSERT INTO users VALUES ('${req.body.username}', '${hash_password}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.email}', '${req.body.profilePic}', '${req.body.country}')`
    );
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === req.body.username))
      throw { status: 401, message: "Username or Password incorrect" };

    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = '${req.body.username}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    // Set cookie
    req.ass_session.username = user.username;
    // req.session.save();
    // res.cookie(session_options.cookieName, user.user_id, cookies_options);

    // return cookie
    res.status(200).send({ username: req.body.username});
  } catch (error) {
    next(error);
  }
});

router.post("/Logout", function (req, res) {
  try {
    req.ass_session.destroy(); // reset the session info --> send cookie when  req.session == undefined!!
    res.status(200).send();
  }
  catch (error) {
    throw { status: 401 }
  }

});


router.post("/addRecipeToFavorites", async function (req,res,next){
  try{
    const recipe_id_url = req.body.recID;

    if(req.username)
    {
      if(recipe_id_url) {
        let recipe_id = parseInt(recipe_id_url);
        let {watchedRecipe, savedRecipe} = await generic.getWatchAndFavorite(recipe_id, req.username);
        if (!savedRecipe) {
          let favoriteTableName = "favoriteRecipes";
          await generic.updateValueForUserAndRecipe(favoriteTableName, recipe_id, req.username);
          res.status(201).send({message: "added successfully"});
        } else {
          res.status(200).send({message: "Recipe is already in your favorite"});
        }
      }
      else
      {
        throw {status: 400, message: "Missing Recipe ID in the body"}
      }
    }
    else
    {
      throw {status: 403, message: "User is not logged in"}
    }

  }catch (error) {
    next(error);
  }
});

module.exports = router;
