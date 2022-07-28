const productModel = require('../model/productModel');
const { isValidRequestBody, isValid, isValidObjectId, isValidPrice } = require('../validator/validation')
const { uploadFile } = require('../aws/aws')
const aws1 = require('../aws/aws')



const createProducts = async (req, res) => {
    try {
        let data = req.body
        let file = req.files
        let { title, description, price, currencyId, currencyFormat,availableSizes,installments } = data

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, msg: "Provide the data for creating product " })
        }

        if (!isValid(title)) {
            return res.status(400).send({ status: false, msg: "Provide the title Name " })
        }
        if (!(/^[a-zA-Z ]{2,30}$/.test(title))) {
            return res.status(400).send({ status: false, msg: "Enter valid  title" })
        }
        let checkTitle = await productModel.findOne({ title: title })
        if (checkTitle) { return res.status(400).send({ status: false, msg: "Product with this title is already present" }) }


        if (!isValid(description)) {
            return res.status(400).send({ status: false, msg: "please write description about product " })
        }

        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "price is required" });
        }
        if(price<=0){
            return res.status(400).send({ status: false, msg: "Price can't be zero or less than zero " })
        }
        if (!/^[0-9]*$/.test(price)) {
            return res.status(400).send({ status: false, message: "price in Number" });
        }


        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, msg: "Provide the currencyId " })
        }
        if (currencyId != "INR") {
            return res.status(400).send({ status: false, msg: "CurrencyId should be in INR" })
        }
        if (!currencyFormat) {
            return res.status(400).send({ status: false, msg: "please enter currency symbol" })
        }
        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, msg: "currencySymbol should be in ₹" })
        }

        // availableSizes = availableSizes.toUpperCase().split(",");

        if (file && file.length > 0) {
            let url = await aws1.uploadFile(file[0])
            data['productImage'] = url
        }
        else {
            return res.status(400).send({ status: false, msg: "Please Provide ProductImage" })
        }

        if (availableSizes.length<1) {
            return res.status(400).send({ status: false, msg: "please enter size of product" })
        }


        sizeArr=availableSizes.replace(/\s+/g, "").split(",").map(String)
        let arr = ["S", "XS","M","X", "L","XXL", "XL"]
        let flag
        for(let i=0; i<sizeArr.length; i++){
               flag=  arr.includes(sizeArr[i])
        }
        if (!flag){
            return res.status(400).send({status: false, data: "Enter a valid size S or XS or M or X or L or XXL or XL ",});
           }
        data['availableSizes'] = sizeArr

        if(installments){
            if(!/^[0-9]*$/.test(installments)){
                return res.status(400).send({status:false,msg:"Installments value Should be only number"})
            }
            if (installments < 0) {
                return res.status(400).send({ status: false, msg: "installments Shoud be In Valid  Number only" })
            }
        }
        

        const createdProduct = await productModel.create(data)
        return res.status(201).send({ status: true, msg: "Product is Created Successfully", data: createdProduct })

    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}




//================================================getProductByFilter=============================================================
const getProductByFilter = async function (req, res) {

    try {
        let filter = req.body
        let{size,name,priceGreaterThan,priceLessThan} = filter
        let data = {isDeleted:false}
        
        if(filter.size!=null){
            size = size.replace(/\s+/g, "").toUpperCase().split(",").map(String)
            if(isValid(name)){return res.status(400).send({status:false, msg:"Please Enter Size Value "})}
            data['availableSizes'] ={$in:size}
        }
        if(name!=null){
            data['title'] = name
        }
        
        if(priceGreaterThan!=null){
            data['price']= {$gte:priceGreaterThan}
        }

        if(priceLessThan!=null){
            data['price'] = {$lte:priceLessThan}
        }

        if(priceGreaterThan && priceLessThan){
            data['price'] = {$gte:priceGreaterThan,$lte:priceLessThan}
        }

        const getData = await productModel.find(data).sort({price:1} )
        if(getData.length==0){
            return res.status(404).send({status:false,msg:"No Data Found With These Filters"})
            }
        return res.status(200).send({status:true,data:getData})
   
    }catch (err) {
        res.status(500).send({ status: false, msg: err.message })   
    }
}

//======================================================getProductById==================================================================================
const getProductById = async function (req, res) {
    // try {
        const productId = req.params.productId;

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid productId" })
        }
        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) {
            return res.status(404).send({ status: false, message: "No such product exists" })
        }
        res.status(200).send({ status: true, message: 'Success', data: productDetails })
    // }catch (err) {
    //     res.status(500).send({ status: false, msg: err.message })   
    // }
}

//***********************************************Update Product Detatils*********************************************** */
const updateProduct= async function(req,res){
    try {
        let productId=req.params.productId
        let data = req.body
        let files = req.files
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data // destructuring req.body

        //body empty
        if (!data || Object.keys(data).length === 0) return res.status(400).send({ status: false, msg: "Provide Data in Body" })

        //productId validation
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid productId" })
        }

        // product is present or not
        let productData = await productModel.findOne({ _id: productId,isDeleted:false },)
        if (!productData) return res.status(404).send({ msg: "Product is not present" })

        //title unique and other validation
        let titleData = await productModel.findOne({ title: title },)
        if (titleData) return res.status(404).send({ msg: `${title} is already present` })
        let newObj = {}

        if(title!=null){
        if (!isValid(title)) {
            return res.status(400).send({ status: false, msg: "Provide the title details" })
        }
        if (!(/^[a-zA-Z ]{2,30}$/.test(title))) {
            return res.status(400).send({ status: false, msg: "Enter a valid title" })
        }
        newObj['title'] = title
        }   
        //description
       if(description){ 
        if (!isValid(description)) {
            return res.status(400).send({ status: false, msg: "Please write description about product " })
        }
        newObj['description'] = description
        }

        //price
        if(price){
            if (!/^[0-9]*$/.test(price)) {
            return res.status(400).send({ status: false, message: "price should be in numbers" });
            }
            if(price<=0){
                return res.status(400).send({ status: false, msg: "Price can't be zero" })
            }
            newObj['price'] = price
        
        }
        //currencyId
       if(currencyId){
         if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, msg: "Provide the currencyId " })
        }
        if (currencyId != "INR") {
            return res.status(400).send({ status: false, msg: "Invalid! CurrencyId should be in INR" })
        }
        newObj['currencyId'] = currencyId
        }

        //currencyFORMAT
        if(currencyFormat){if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, msg: "Invalid currencyFormat,Only ₹ accepted" })
        }
            newObj['currencyFormat'] = currencyFormat
        }

        //isFreeShopping
        if (isFreeShipping) {

            let Shipping = JSON.parse(isFreeShipping)

            if (typeof Shipping !== 'boolean') {
                return res.status(400).send({ status: false, msg: "isFreeShipping should be in Boolen valus" })
            }
            newObj['isFreeShipping'] =isFreeShipping
        }

        //style
        if (style) {

            if (!isValid(style)) {
                return res.status(400).send({ status: false, msg: "Provide the style " })
            }
            newObj['style'] = style
        }

        if (installments) {
            if (!(!isNaN(Number(installments)))) return res.status(400).send({ status: false, msg: "please enter valid installments and Should be in Number" });

            if (installments < 0) {
                return res.status(400).send({ status: false, msg: "installments Shoud be In Valid  Number only" })
            }
            newObj['installments'] = installments
        }

        if (availableSizes) {

            let size = availableSizes.split(",")

            if (!Array.isArray(size)) return res.status(400).send({ status: false, msg: "availableSizes should be array of strings" })

            let Size = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
            const subtrim = size.map(element => {
                return element.trim()

            })
            for (const element of subtrim) {

                console.log(availableSizes)
                if (Size.includes(element) === false) return res.status(400).send({ status: false, msg: 'Sizes should be in ["S", "XS", "M", "X", "L", "XXL", "XL"]' })

            }
            // newObj['availableSizes'] = {availableSizes}
        }
        let uploadedFileURL
        if (files) {
            if (files && files.length > 0) {
                 uploadedFileURL = await uploadFile(files[0])
            }
            newObj['productImage'] = uploadedFileURL
        }
        //updation part
        const updateProduct = await productModel.findByIdAndUpdate({ _id: productId }, { $set:newObj,$push:{availableSizes:availableSizes} }, { new: true })
        return res.status(200).send({ status: true, "message": "Product updated", data: updateProduct })
        
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
//==========================================================================================
const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId;
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Inavlid productId." })
        }
        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
            return res.status(404).send({ status: false, message: `No book found by ${productId}` })
        }
        if (findProduct.isDeleted == true) {
            return res.status(400).send({ status: false, message: `Product has been already deleted.` })
        }
        const deletedProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true }).select({ _id: 1, title: 1, isDeleted: 1, deletedAt: 1 })
        res.status(200).send({ status: true, message: "Product deleted successfullly.", data: deletedProduct })
    }catch (err) {
        res.status(500).send({ status: false, msg: err.message })   
    }
}
module.exports = { createProducts, getProductByFilter , getProductById,updateProduct, deleteProductById}