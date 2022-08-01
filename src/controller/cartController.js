const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const userModel = require("../model/userModel")
const{isValidObjectId} = require('mongoose')

const addCart = async function(req,res){

        let userId = req.params.userId
        let data = req.body
        
        let{productId,quantity} = data
            if(!isValidObjectId(userId)){
                return res.status(400).send({status:false,msg:"Invalid UserId"})
            }
            let userExist = await userModel.findById(userId)
                if(!userExist){
                    return res.status(404).send({status:false,msg:"No User Found With this Id"})
                }
                    // if(userId!=req.userId){
                    //     return res.status(403).send({status:false,msg:"Unauthorizes Acces"})
                    // }
            data['userId'] = userId
            if(!isValidObjectId(productId)){
                return res.status(400).send({status:false,msg:"Invalid Product Id"})
            }
                let prodExist = await productModel.findById({_id:productId,isDeleted:false})
                    if(!prodExist){
                        return res.status(404).send({status:false,msg:"Either Product is Deleted or Doesn't Exist"})
                    }
                
                let totalPrice = prodExist.price
                data['totalPrice'] = totalPrice
                let totalItems = 1
                data['totalItems'] = totalItems
        
        let isCart = await cartModel.findOne({useId:userId})
        totalPrice = isCart.totalPrice+totalPrice
        totalItems = isCart.totalItems+totalItems

        if(!isCart){
            let createCart = await cartModel.create(data)
            return res.status(201).send({status:true,msg:"Cart Created Succesfullt",data:createCart})
        }
        else{
            let prod= {}
            let newObj = {}
            newObj['totalPrice'] = totalPrice
            newObj['totalItems'] = totalItems
            console.log(isCart.items[0].productId)
            for(let i=0; i<isCart.items.lenght; i++){
            if(isCart.items.productId!=productId){
                prod['productId']= productId
            }
            quantity = isCart.items.quantity+quantity
            }
            prod['quantity'] = quantity
            let addtoCart = await cartModel.findOneAndUpdate({userId:userId},{$set:newObj,$push:{items:prod}},{new:true})
            return res.status(200).send({status:true,data:addtoCart})
        }
}

module.exports={addCart}