const express = require("express");
const logger = require("morgan");
const app = express();
app.use(express.json()); // (?) parse application/json
app.use(logger("dev")); // (?) logger

app.use((req, res, next) => {
  req.message = "message";
  console.log("welcome to my server");
  next();
  // res.send("ok");
});

const server = app.listen(3000, () => {
  console.log("party started at port", 3000);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
});
