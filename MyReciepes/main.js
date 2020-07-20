require("dotenv").config();
//#region express configures
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("../modules/DButils");
const cors = require("cors");

var app = express();

const corsConfig = {
    origin: true,
    credentials: true
};
app.use(cors(corsConfig));
app.options("*",cors(corsConfig));

app.use(logger("dev")); //logger
app.use(express.json()); // parse application/json
app.use(
  session({
    cookieName: process.env.COOKIE_NAME, // the cookie key name
    secret: process.env.COOKIE_SECRET, // the encryption key
    duration: 20 * 60 * 1000, // expired after 20 min
    activeDuration: 0, // if expiresIn < activeDuration,
    //the session will be extended by activeDuration milliseconds
    cookie: {
        httpOnly: false
    }
  })
);
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files

var port = process.env.PORT || "3000";
//#endregion
const user = require("./routes/user");
const profile = require("./routes/profile");
const recipes = require("./routes/recipes");

//#region cookie middleware
app.use(function (req, res, next) {
  if (req.ass_session && req.ass_session.username) {
    DButils.execQuery("SELECT username FROM users")
      .then((users) => {
        if (users.find((x) => x.username === req.ass_session.username)) {
            console.log("Setting user to request")
            req.username = req.ass_session.username;
        }
        next();
      })
      .catch((error) => next(error));
  } else {
    next();
  }
});
//#endregion

app.get("/", (req, res) => res.send("welcome"));

app.use("/user", user);
app.use("/profile", profile);
app.use("/recipes", recipes);

app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message });
});

const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
  process.exit();
});
