const express = require('express')
const router = express.Router();
const userController = require("../controller/userController")
const middleware = require("../middleware/middleware")

router.post("/register",userController.createUser)
router.post("/login",userController.loginUser)

router.get("/user/:userId/profile",middleware.authentication,userController.getUser)
router.put("/user/:userId/profile", middleware.authentication, userController.updateUserProfile);
router.all("/****",function(req,res){                                                   //Doubtfulllllllll
    return res.status(404).send({status:false,msg:"Check whether the Endpoint is Correct or Not"})
})
module.exports = router;