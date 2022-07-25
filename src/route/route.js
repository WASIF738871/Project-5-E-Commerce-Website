const express = require('express')
const router = express.Router();
const userController = require("../controller/userController")

router.post("/register",userController.createUser)



router.all("/****",function(req,res){                                                   //Doubtfulllllllll
    return res.status(404).send({status:false,msg:"Check whether the Endpoint is Correct or Not"})
})
module.exports = router;