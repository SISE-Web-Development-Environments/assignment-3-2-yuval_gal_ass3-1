require("dotenv").config();
//#region express configures
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("../modules/DButils");

var main = express();
main.use(logger("dev")); //logger
main.use(express.json()); // parse application/json
main.use(
    session({
        cookieName: "session", // the cookie key name
        secret: process.env.COOKIE_SECRET, // the encryption key
        duration: 20 * 60 * 1000, // expired after 20 sec
        activeDuration: 0 // if expiresIn < activeDuration,
        //the session will be extended by activeDuration milliseconds
    })
);
main.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
main.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files

var port = process.env.PORT || "3000";
//#endregion
const user = require("./routes/user");
const profile = require("./routes/profile");
const recipes = require("./routes/recipes");

//#region cookie middleware
main.use(function (req, res, next) {
    if (req.session && req.session.user_id) {
        // or findOne Stored Procedure
        DButils.execQuery("SELECT user_id FROM users")
            .then((users) => {
                if (users.find((x) => x.user_id === req.session.user_id)) {
                    req.user_id = req.session.user_id;
                    // req.session.user_id = user_id; //refresh the session value
                    // res.locals.user_id = user_id;
                    next();
                }
                next();
            })
            .catch((err) => next(err));
    } else {
        next();
    }
});
//#endregion

main.get("/", (req, res) => res.send("welcome"));

main.use("/user", user);
main.use("/profile", profile);
main.use("/recipes", recipes);

main.use(function (err, req, res, next) {
    console.error(err);
    res.status(err.status || 500).send({ message: err.message, success: false });
});

const server = main.listen(port, () => {
    console.log(`Server listen on port ${port}`);
});

process.on("SIGINT", function () {
    if (server) {
        server.close(() => console.log("server closed"));
    }
    process.exit();
});