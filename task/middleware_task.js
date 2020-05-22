const express = require("express");
const logger = require("morgan");
const app = express();
app.use(express.json()); // (?) parse application/json
app.use(logger("dev")); // (?) logger

//#region run app.use with a middleware that always execute - console.log("welcome to my server")
app.use((req, res, next) => {
  console.log("welcome to my server", req.body);
  next();
});
//#endregion

//#region run app.use with a middleware that always add the request body message parameter equal to "message"
app.use((req, res, next) => {
  req.body.message = "message";
  req.body.eran = "message";
  next();
});
//#endregion

//#region run app.use with a middleware that respond to the client with message "last resort" and req.body
//#endregion

app.get("/", (req, res, next) => {
  res.send(req.body);
});

// error middleware
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send({ message: err.message, success: false });
});

const server = app.listen(3001, () => {
  console.log("party started at port", 3001);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
});
