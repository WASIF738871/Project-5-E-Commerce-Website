const express = require('express')
const router = express.Router();
const userController = require("../controller/userController")
const productController = require("../controller/productController")
const middleware = require("../middleware/middleware")

router.post("/register",userController.createUser)
router.post("/login",userController.loginUser)
router.get("/user/:userId/profile",middleware.authentication,userController.getUser)
router.put("/user/:userId/profile", middleware.authentication, userController.updateUserProfile);


//Product Api's
router.post("/products",productController.createProducts)

router.get("/products",productController.getProductByFilter)
router.get("/products/:productId",productController.getProductById)

router.put("/products/:productId", productController.updateProduct)

router.delete("/products/:productId",productController.deleteProductById)

router.all("/****",function(req,res){                                                   
    return res.status(404).send({status:false,msg:"Check whether the Endpoint is Correct or Not"})
})


module.exports = router;