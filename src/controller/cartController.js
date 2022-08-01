const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const userModel = require("../model/userModel")
const{isValidObjectId} = require('mongoose')

const addCart = async function(req,res){

        let userId = req.params.userId
        let data = req.body
            let {items} = data
            let productId = items[0].productId

//-----------------------------Checking User
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


//---------------------------Product Id Validation            
            if(!isValidObjectId(productId)){
                return res.status(400).send({status:false,msg:"Invalid Product Id"})
            }
                let prodExist = await productModel.findById({_id:productId,isDeleted:false})
                console.log(prodExist)
                    if(!prodExist){
                        return res.status(404).send({status:false,msg:"Either Product is Deleted or Doesn't Exist"})
                    }
                    let totalPrice = prodExist.price
                    let totalItems = 1

             
        
        let isCart = await cartModel.findOne({userId:userId})
        if(!isCart){
            data['totalPrice'] = totalPrice
            data['totalItems'] = totalItems
            let createCart = await cartModel.create(data)
            return res.status(201).send({status:true,msg:"Cart Created Succesfullt",data:createCart})
        }
        else{
            let x=0
            let newObj = {}
            // console.log(isCart)
            for(let i=0; i<isCart.items.length; i++){
            if(isCart.items[i].productId==productId){
                 isCart.items[i].quantity += parseInt(items[0].quantity)
                x=1
                break;
                    
            }
            }
            if(x==0){
                let obj = {
                    productId:items[0].productId,
                    quantity:items[0].quantity
                }
                console.log(obj)
                isCart.items.push(obj)
                console.log("Hlw1")
                console.log(isCart)
            }
        

             isCart.totalPrice += totalPrice
            // newObj['totalPrice'] = totalPrice
            isCart.totalItems = isCart.items.length
            // newObj['totalItems'] = totalItems
            // console.log(isCart)
            let addtoCart = await cartModel.findOneAndUpdate({userId:userId},{$set:isCart},{new:true})
            return res.status(200).send({status:true,data:addtoCart})
        }
}

module.exports={addCart}