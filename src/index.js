const express = require("express");
const bodyParser = require("body-parser");
const route = require("../src/route/route");
const mongoose = require("mongoose");
const multer = require("multer")
const app = express();

app.use(bodyParser.json());
app.use(multer().any())
app.use("/", route);



mongoose.connect("mongodb+srv://WASIF321:Ansari738871@wasifdatabase.wdcjr.mongodb.net/group36Database",
    { useNewUrlParser: true }).then(() => console.log("MongoDb is connected")).catch((err) => console.log(err));


app.listen(process.env.PORT || 3000, function () {
    console.log("Express app is running on " + " " + (process.env.PORT || 3000));
});