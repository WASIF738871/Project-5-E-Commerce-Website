const productModel = require('../model/productModel');
const { isValidRequestBody, isValid, isValidObjectId, isValidPrice } = require('../validator/validation')
const { uploadFile } = require('../aws/aws')









//================================================getProductByFilter=============================================================
const getProductByFilter = async function (req, res) {

    try {
        const query = req.query;
        let filters = { isDeleted: false }

        let { size, name, priceGreaterThan, priceLessThan, priceSort } = query;
        if (query.hasOwnProperty('size')) {

            if (!isValid(size)) {
                return res.status(400).send({ status: false, message: `enter at least one size from:  S, XS, M, X, L, XXL, XL` })
            }
    }
    }catch (err) {
        res.status(500).send({ status: false, msg: err.message })   
    }
}