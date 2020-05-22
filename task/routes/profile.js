var express = require("express");
var router = express.Router();
const DButils = require("../../modules/DButils");

router.use((req, res, next) => {
  if (req.user_id) next();
  else throw { status: 401, message: "unauthorized" };
});

//#region global simple
// router.use((req, res, next) => {
//   const { cookie } = req.body;

//   if (cookie && cookie.valid) {
//     DButils.execQuery("SELECT username FROM users")
//       .then((users) => {
//         if (users.find((e) => e.username === cookie.username))
//           req.username = cookie.username;
//         next();
//       })
//       .catch((err) => next(err));
//   } else {
//     next();
//   }
// });
//#endregion

router.get("/favorites", function (req, res) {
  res.send(req.originalUrl);
});

router.get("/personalRecipes", function (req, res) {
  res.send(req.originalUrl);
});

//#region example2 - make add Recipe endpoint

//#region complex

//#endregion

//#region simple
// function valid_cookie(cookie) {
//   return true;
// }

// router.use("/addPersonalRecipe", (req, res, next) => {
//   const { cookie } = req.body;
//   if (cookie && valid_cookie(cookie)) {
//     req.username = cookie.username;
//     next();
//   } else throw { status: 401, message: "unauthorized" };
// });
//#endregion

router.post("/addPersonalRecipe", async (req, res, next) => {
  try {
    await DButils.execQuery(
      `INSERT INTO recipes VALUES (default, '${req.user_id}', '${req.body.recipe_name}')`
    );
    res.send({ sucess: true });
  } catch (error) {
    next(error);
  }
});
//#endregion

module.exports = router;
