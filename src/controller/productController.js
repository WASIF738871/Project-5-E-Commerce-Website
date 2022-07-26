const productModel = require('../model/productModel')
const aws1 = require('../aws/aws')

let{isValidRequestBody,isValid} = require("../validator/validation")


const createProducts = async (req, res) => {
    try {
        let data = req.body
        let file = req.files
        let { title, description, price, currencyId, currencyFormat,availableSizes } = data

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
        if (!/^[0-9]*$/.test(price)) {
            return res.status(400).send({ status: false, message: "price is required" });
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
        console.log(availableSizes)


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
        if (["S", "XS","M","X", "L","XXL", "XL"].indexOf(availableSizes) == -1){
            return res.status(400).send({status: false, data: "Enter a valid size S or XS or M or X or L or XXL or XL ",});
           }

        const createdProduct = await productModel.create(data)
        return res.status(201).send({ status: true, msg: "Product is Created Successfully", data: createdProduct })

    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports = {
    createProducts
}

