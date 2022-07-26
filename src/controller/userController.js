const userModel= require("../model/userModel")
const {isValidObjectId} = require('mongoose')
const aws1 = require("../aws/aws.js")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
let{isValidRequestBody,isValid,isValidEmail,isvalidPincode,isValidPassword,isValidPhone} = require("../validator/validation")

//************************************************ Creating User  ********************************************/

const createUser = async (req,res) =>{
    try{
        let data = req.body
        let file = req.files
        let{fname,lname,phone,email,password,address} = data

        if(!isValidRequestBody(data)){
            return res.status(400).send({status:false,msg:"Provide the data of User "})
        }  
               //Validating Names
        if(!isValid(fname)){
            return res.status(400).send({status:false,msg:"Provide the First Name "})
        }
        if (!(/^[a-zA-Z ]{2,30}$/.test(fname))) {
             return res.status(400).send({ status: false, msg: "Enter valid  fname" }) }


        if(!isValid(lname)){
            return res.status(400).send({status:false,msg:"Provide the last Name "})
        }
        if (!(/^[a-zA-Z ]{2,30}$/.test(lname))) {
          return res.status(400).send({ status: false, msg: "Enter valid  lname" }) }

          if (!isValid(phone) || !isValidPhone(phone)) {
            return res.status(400).send({ status: false, message: "phone is required and it should be a valid indian phone number" });
        }
        let PhoneCheck = await userModel.findOne({ phone: phone.trim() })
        if (PhoneCheck) { return res.status(400).send({ status: false, msg: "this phone is already present" }) }


        if(!isValid(email)){
            return res.status(400).send({status:false,msg:"Provide the EmailId "})
        }
        if(!isValidEmail(email)){
            return res.status(400).send({status:false,msg:"Provide the Valid EmailId "})
        } 
        let checkmail = await userModel.findOne({ email: email })
        if (checkmail) { return res.status(400).send({ status: false, msg: "this email is already present" }) }
        
        
        if(!isValid(password)){
            return res.status(400).send({status:false,msg:"Provide the Password "})
        }
        if (!isValidPassword(password)){
            return res.status(400).send({status:false,msg:"Password Length must be btwn 8-15 chars only"})
        }
        
        const  saltRounds = 10;
        const encryptedPassword = await bcrypt.hash(password, saltRounds)
        data['password'] = encryptedPassword

        
        if (address) {
                  let  objAddress = JSON.parse(address)
            if (objAddress.shipping) {
                
                if (!isValid(objAddress.shipping.street)){
                  
                    return res.status(400).send({ status: false, Message: "Please provide street name in shipping address" })
                }
                if (!isValid(objAddress.shipping.city))
                    return res.status(400).send({ status: false, Message: "Please provide city name in shipping address" })

                if (!isvalidPincode(objAddress.shipping.pincode))
                    return res.status(400).send({ status: false, Message: "Please provide pincode in shipping address" })
            }
            else {
                res.status(400).send({ status: false, Message: "Please provide shipping address and it should be present in object with all mandatory fields" })
            }
            if (objAddress.billing) {
                if (!isValid(objAddress.billing.street))
                    return res.status(400).send({ status: false, Message: "Please provide street name in billing address" })

                if (!isValid(objAddress.billing.city))
                    return res.status(400).send({ status: false, Message: "Please provide city name in billing address" })

                if (!isvalidPincode(objAddress.billing.pincode))
                    return res.status(400).send({ status: false, Message: "Please provide pincode in billing address" })
            }
            else {
                return res.status(400).send({ status: false, Message: "Please provide billing address and it should be present in object with all mandatory fields" })
            }
            data['address'] = objAddress
        }else{
            return res.status(400).send({status:true,msg:"Please Provide The Address"})
        }
        
        if(file && file.length>0){
            let  url = await aws1.uploadFile( file[0] )
            data['profileImage'] = url
        }
        else{
            return res.status(400).send({status:false,msg:"Please Provide ProfileImage"})
        }
        
        const created = await userModel.create(data)
        return res.status(201).send({status:true,msg:"User Created Successfully",data:created})
        
    }
    catch(err){
        return res.status(500).send({status:false,msg:err.message})
    }
}

const loginUser = async function(req,res){
    try{

        const data = req.body
        const {email,password} = data
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter login credentials" });
        }

        if (!isValid(email) || !isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is requird and it should be a valid email address" });
        }
        if (!isValid(password) || !isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Password  should be Valid min 8 and max 15 length" });
        }
        const user = await userModel.findOne({ email: email });
        if (!user) {
            return res.status(404).send({status:false,msg:"Invalid User"})

        }
        const decrypPassword = user.password
        const pass = await bcrypt.compare(password, decrypPassword)
        if (!pass) {
            return res.status(400).send({ status: false, message: "Password Incorrect" })
        }
       
       

// Creating Token Here

        const token =  jwt.sign({ userId:user._id }, 'MbFastChe-36', { expiresIn: "24h" })

        let obj = {
            userId:user._id,
            token:token
        }
        res.setHeader('Authorization', 'Bearer ' + token);

        return res.status(201).send({status:true,msg:"User LoggedIn Succesfully",data:obj})

    }
    catch(err){
        return res.status(500).send({status:false,msg:err.message})
    }
}


const getUser = async(req,res)=>{
    try{

        let userId = req.params.userId
        if(!userId){
            return res.status(400).send({status:false,msg:"Provide UserID"})
        }

        if(!isValidObjectId(userId)){
            return res.status(400).send({stauts:false,msg:"Invalid User Id"})
        }
        const data = await userModel.find({_id:userId})
        if(data){
        return res.status(200).send({statu:true,data:data})
        }
        else{
            return res.status(404).send({status:false,msg:"No data Found"})
        }
    }catch(err){
        return res.status(500).send({status:false,msg:err.message})
    }

}

//----------------------------------------updateUser----------------------------------------
const updateUserProfile = async function (req,res) {
    try{
        const userId= req.params.userId;
        const data= req.body
        const file = req.files
        if(!isValidObjectId(userId)){
            return res.status(400).send({stauts:false,msg:"Invalid User Id"})
        }
        const isUserPresent =await userModel.findById(userId)
        if(!isUserPresent){
            return res.status(404).send({status:false,msg:"No User Found"})
        }
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "unauthorized access!" });
        }
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide data for update" });
        }
        let{fname,lname,phone,email,password,address,profileImage} = data

        if(file && file.length>0){
            let  url = await aws1.uploadFile( file[0] )
            data['profileImage'] = url
        }




    }catch(err){
        return res.status(500).send({status:false,msg:err.message})

    }
}


module.exports = {createUser,loginUser,getUser}