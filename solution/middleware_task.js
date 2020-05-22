const express = require("express");
const logger = require("morgan");
const app = express();
app.use(express.json()); // (?) parse application/json
app.use(logger("dev")); // (?) logger

//#region run app.use with a middleware that always execute - console.log("welcome to my server")
app.use((req, res, next) => {
  console.log("welcome to my server"); // (1) Execute any code.
  next(); // (4) Call the next middleware function in the stack.
});
//#endregion

//#region run app.use under the path "/numbers" with 2 middlewares that the first exexute - console.log(1), and the second - console.log(2)
app.use(
  "/numbers",
  (req, res, next) => {
    console.log("1"); // (1) Execute any code.
    next(); // (4) Call the next middleware function in the stack.
  },
  (req, res, next) => {
    console.log("2"); // (1) Execute any code.
    next(); // (4) Call the next middleware function in the stack.
  }
);
//#endregion

//#region run app.use with a middleware that always add message parameter equal to "message" to the request body
app.use((req, res, next) => {
  req.body.message = "message"; // (2) Make changes to the request and the response objects.
  next(); // (4) Call the next middleware function in the stack.
});
//#endregion

//#region run app.use with a middleware that respond to the client with "last resort"
// app.use((req, res, next) => {
//   res.send("last resort"); // (3) End the request-response cycle
// });
//#endregion

app.get("/", (req, res, next) => {
  throw new Error("err message");
  // next();
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
