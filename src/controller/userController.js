const userModel= require("../model/userModel")
const aws1 = require("../aws/aws.js")
let{isValidRequestBody,isValid,isValidEmail,isvalidPincode} = require("../validator/validation")

//************************************************ Creating User  *****************************************************/

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



        if(!isValid(phone)){
            return res.status(400).send({status:false,msg:"Provide the Phone Number "})
        }
        if (!(/^[0-9]{10}$/.test(phone))) {
            return res.status(400).send({ status: false, msg: " phone number should have 10 digits only" });
        }
        let PhoneCheck = await userModel.findOne({ phone: phone.trim() })
        if (PhoneCheck) { return res.status(400).send({ status: false, msg: "this phone is already present" }) }


        if(!isValid(email)){
            return res.status(400).send({status:false,msg:"Provide the EmailId "})
        }
        if(!isValidEmail(email)){
            return res.status(400).send({status:false,msg:"Provide the Valid EmailId "})
        } let checkmail = await userModel.findOne({ email: email })
        if (checkmail) { return res.status(400).send({ status: false, msg: "this email is already present" }) }
        
        
        if(!isValid(password)){
            return res.status(400).send({status:false,msg:"Provide the Password "})
        }
        if (typeof password !== "string" || password.trim().length === 0) { return res.status(400).send({ status: false, msg: "enter valid password" }) };
        if (!(/^(?=.\d)(?=.[a-z])(?=.[!@#\$%\^&\\.])(?=.*[A-Z]).{8,15}$/.test(password))) { return res.status(400).send({ status: false, msg: "Password length should be 8-15" }) }

        if (address) {
           
            if (address.shipping) {
                
                if (!isValid(address.shipping.street)){
                  
                    return res.status(400).send({ status: false, Message: "Please provide street name in shipping address" })
                }
                if (!isValid(address.shipping.city))
                    return res.status(400).send({ status: false, Message: "Please provide city name in shipping address" })

                if (!isvalidPincode(address.shipping.pincode))
                    return res.status(400).send({ status: false, Message: "Please provide pincode in shipping address" })
            }
            else {
                res.status(400).send({ status: false, Message: "Please provide shipping address and it should be present in object with all mandatory fields" })
            }
            if (address.billing) {
                if (!isValid(address.billing.street))
                    return res.status(400).send({ status: false, Message: "Please provide street name in billing address" })

                if (!isValid(address.billing.city))
                    return res.status(400).send({ status: false, Message: "Please provide city name in billing address" })

                if (!isvalidPincode(address.billing.pincode))
                    return res.status(400).send({ status: false, Message: "Please provide pincode in billing address" })
            }
            else {
                return res.status(400).send({ status: false, Message: "Please provide billing address and it should be present in object with all mandatory fields" })
            }
        }
        data['address'] = JSON.parse(address)

        if(file && file.length>0){
            let  url = await aws1.uploadFile( file[0] )
            data['profileImage'] = url
        }
        
        
        const created = await userModel.create(data)
        return res.status(201).send({status:true,msg:"User Created Succefully",data:created})
        
    }
    catch(err){
        return res.status(500).send({status:false,msg:err.message})
    }



}

module.exports = {createUser}