var express = require("express");
var router = express.Router();
const DButils = require("../../modules/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    // parameters exists
    // valid parameters
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
        `INSERT INTO users VALUES (default, '${req.body.username}', '${hash_password}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.email}', '${req.body.profilePic}')`
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


router.post("/addRecipeToFavorites", function (req,res){
  try{
    const recipe_id_url = req.params;

    if(req.username && recipe_id_url)
    {
      let recipe_id = parseInt(recipe_id_url);

    }

  }catch (error) {
    throw {status: 401}
  }
});

module.exports = router;
