const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const server = require("http").Server(app);

app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.engine("html", require("ejs").renderFile);

app.use(require("morgan")("combined"));
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(require("body-parser").json());
app.use(
  require("express-session")({
    secret: "motherbox",
    resave: false,
    saveUninitialized: false
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(function() {
    app.use("/", require("./routes/index.js"));
    server.listen(process.env.PORT || 3000, function() {
      console.log("server up and running...");
    });
  })
  .catch(function(err) {
    console.error(err);
  });
