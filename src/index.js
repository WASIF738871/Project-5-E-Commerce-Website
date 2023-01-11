const express = require("express");
const bodyParser = require("body-parser");
const route = require("../src/route/route");
const mongoose = require("mongoose");
const multer = require("multer");

// instance of app object
const app = express();

// using bodyParser is a third party middleware now we have built in middleware to parse the request body
app.use(bodyParser.json());

// using multer to parse multipart form data. like file (image/pdf etc) can not be handled by body parser
app.use(multer().any())

// application level middleware
app.use("/", route);


// Conneciton to DATABASE providing by moongoose library to put CRUD operations on Model
mongoose.connect("mongodb+srv://WASIF321:Ansari738871@wasifdatabase.wdcjr.mongodb.net/productManagement-DB",
    { useNewUrlParser: true }).then(() => console.log("MongoDb is connected")).catch((err) => console.log(err));

//to  run our application on perticular port
app.listen(process.env.PORT || 3000, function () {
    console.log(`Example app listening on http://localhost:${process.env.PORT || 3000}`);
});