const productModel = require("../model/productModel");
const {
    isValidRequestBody,
    isValid,
    isValidObjectId,
    isValidImg,
} = require("../validator/validation");
const { uploadFile } = require("../aws/aws");
const aws1 = require("../aws/aws");

//********************************************Crate Product Api************************************************* */

const createProducts = async (req, res) => {
    try {
        let data = req.body;

        let file = req.files;
        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            availableSizes,
            style,
            installments,
        } = data;

        if (!isValidRequestBody(data)) {
            return res.status(400).send({
                status: false,
                message: "Provide the data for creating product ",
            });
        }

        if (!isValid(title)) {
            return res
                .status(400)
                .send({ status: false, message: "Provide the title Name " });
        }

        let checkTitle = await productModel.findOne({ title: title });
        if (checkTitle) {
            return res.status(400).send({
                status: false,
                message: "Product with this title is already present",
            });
        }

        if (!isValid(description)) {
            return res.status(400).send({
                status: false,
                message: "please write description about product ",
            });
        }

        if (!isValid(price)) {
            return res
                .status(400)
                .send({ status: false, message: "price is required" });
        }
        if (price <= 0) {
            return res.status(400).send({
                status: false,
                message: "Price can't be zero or less than zero ",
            });
        }
        if (!/^[0-9]*$/.test(price)) {
            return res
                .status(400)
                .send({ status: false, message: "price in Number" });
        }

        if (!isValid(currencyId)) {
            return res
                .status(400)
                .send({ status: false, message: "Provide the currencyId " });
        }
        if (currencyId != "INR") {
            return res
                .status(400)
                .send({ status: false, message: "CurrencyId should be in INR" });
        }
        if (!currencyFormat) {
            return res
                .status(400)
                .send({ status: false, message: "please enter currency symbol" });
        }
        if (currencyFormat != "₹") {
            return res
                .status(400)
                .send({ status: false, message: "currencySymbol should be in ₹" });
        }

        if (isFreeShipping != null) {
            if (
                !(
                    isFreeShipping.toLowerCase() === "true" ||
                    isFreeShipping.toLowerCase() === "false"
                )
            ) {
                return res
                    .status(400)
                    .send({ status: false, message: "please provide boolean value" });
            }
            data["isFreeShipping"] = isFreeShipping.toLowerCase();
        }
        if (file && file.length > 0) {
            if (!isValidImg(file[0].mimetype)) {
                return res.status(400).send({
                    status: false,
                    message: "Image Should be of JPEG/ JPG/ PNG",
                });
            }
            let url = await aws1.uploadFile(file[0]);
            data["productImage"] = url;
        } else {
            return res
                .status(400)
                .send({ status: false, message: "Please Provide ProductImage" });
        }

        //TODO:doubt for small letter sizes adding like this[s,S]
        if (!availableSizes) {
            return res
                .status(400)
                .send({ status: false, message: "please enter size of product" });
        }

        sizeArr = availableSizes.replace(/\s+/g, "").split(",").map(String);
        // console.log(sizeArr)
        let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
        let flag;
        for (let i = 0; i < sizeArr.length; i++) {
            flag = arr.includes(sizeArr[i]);
        }
        if (!flag) {
            return res.status(400).send({
                status: false,
                data: "Enter a valid size S or XS or M or X or L or XXL or XL ",
            });
        }
        data["availableSizes"] = sizeArr;

        if (installments) {
            if (!/^[0-9]*$/.test(installments)) {
                return res.status(400).send({
                    status: false,
                    message: "Installments value Should be only number",
                });
            }
            if (installments < 0) {
                return res.status(400).send({
                    status: false,
                    message: "installments Shoud be In Valid  Number only",
                });
            }
        }
        //style
        if (style != null) {
            if (!isValid(style)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Provide the style " });
            }
        }

        const createdProduct = await productModel.create(data);
        return res.status(201).send({
            status: true,
            message: "Product is Created Successfully",
            data: createdProduct,
        });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

//================================================getProductByFilter=============================================================
const getProductByFilter = async function (req, res) {
    try {
        let filter = req.body;
        let { size, name, priceGreaterThan, priceLessThan } = filter;
        let data = { isDeleted: false };

        if (filter.size != null) {
            if (size.length > 0) {
                size = size.replace(/\s+/g, "").toUpperCase().split(",").map(String);
                if (isValid(size)) {
                    return res
                        .status(400)
                        .send({ status: false, message: "Please Enter Size Value " });
                }
                data["availableSizes"] = { $in: size };
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Provide The size as u have selected",
                });
            }
        }
        if (name != null) {
            if (name.trim().length > 0) {
                data["title"] = name;
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Provide The name as u have selected",
                });
            }
        }

        if (priceGreaterThan != null) {
            if (priceGreaterThan.length > 0) {
                if (!/^[0-9]*$/.test(priceGreaterThan)) {
                    return res.status(400).send({
                        status: false,
                        message: "priceGreaterThan should be in numbers",
                    });
                }
                data["price"] = { $gte: priceGreaterThan };
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Provide The priceGreaterThan as u have selected",
                });
            }
        }

        if (priceLessThan != null) {
            if (priceLessThan.length > 0) {
                if (!/^[0-9]*$/.test(priceLessThan)) {
                    return res.status(400).send({
                        status: false,
                        message: "priceLessThan should be in numbers",
                    });
                }
                if (priceLessThan <= 0) {
                    return res
                        .status(400)
                        .send({ status: false, message: "priceLessThan can't be zero" });
                }
                data["price"] = { $lte: priceLessThan };
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Provide The priceLessThan as u have selected",
                });
            }
        }

        if (priceGreaterThan && priceLessThan) {
            data["price"] = { $gte: priceGreaterThan, $lte: priceLessThan };
        }

        const getData = await productModel.find(data).sort({ price: 1 });
        if (getData.length == 0) {
            return res
                .status(404)
                .send({ status: false, message: "No Data Found With These Filters" });
        }
        return res.status(200).send({ status: true, data: getData });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};

//======================================================getProductById==================================================================================
const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId;

        if (!isValidObjectId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "Please provide valid productId" });
        }
        const productDetails = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!productDetails) {
            return res
                .status(404)
                .send({ status: false, message: "No such product exists" });
        }
        res
            .status(200)
            .send({ status: true, message: "Success", data: productDetails });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};

//***********************************************Update Product Detatils*********************************************** */

const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId;
        let data = req.body;
        let files = req.files;
        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
        } = data; // destructuring req.body

        //body empty
        if (!data || (Object.keys(data).length == 0 && !files))
            return res
                .status(400)
                .send({ status: false, message: "Provide Data in Body" });

        //productId validation
        if (!isValidObjectId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "Please provide valid productId" });
        }

        // product is present or not
        let productData = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!productData)
            return res.status(404).send({ message: "Product is not present" });

        //title unique and other validation

        let newObj = {};

        if (title != null) {
            if (!isValid(title)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Provide the title details" });
            }
            if (!/^[a-zA-Z ]{2,30}$/.test(title)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Enter a valid title" });
            }
            let titleData = await productModel.findOne({ title: title });
            if (titleData)
                return res.status(404).send({ message: `${title} is already present` });
            newObj["title"] = title;
        }
        //description
        if (description != null) {
            if (!isValid(description)) {
                return res.status(400).send({
                    status: false,
                    message: "Please write description about product ",
                });
            }
            newObj["description"] = description;
        }

        //price
        if (price != null) {
            if (price.length > 0) {
                if (!/^[0-9]*$/.test(price)) {
                    return res
                        .status(400)
                        .send({ status: false, message: "price should be in numbers" });
                }
                if (price <= 0) {
                    return res
                        .status(400)
                        .send({ status: false, message: "Price can't be zero" });
                }
                newObj["price"] = price;
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Please Fill The Price as U have selected",
                });
            }
        }
        //currencyId
        if (currencyId != null) {
            if (!isValid(currencyId)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Provide the currencyId " });
            }
            if (currencyId != "INR") {
                return res.status(400).send({
                    status: false,
                    message: "Invalid! CurrencyId should be in INR",
                });
            } ////not updating
            newObj["currencyId"] = currencyId;
        }

        //currencyFORMAT
        if (currencyFormat != null) {
            if (currencyFormat.length > 0) {
                if (currencyFormat != "₹") {
                    return res.status(400).send({
                        status: false,
                        message: "Invalid currencyFormat,Only ₹ accepted",
                    });
                } ///can't update
                newObj["currencyFormat"] = currencyFormat;
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Provide The Currecny Format as u have Selected ",
                });
            }
        }

        if (isFreeShipping != null) {
            if (
                !(
                    isFreeShipping.toLowerCase() === "true" ||
                    isFreeShipping.toLowerCase() === "false"
                )
            ) {
                return res
                    .status(400)
                    .send({ status: false, message: "please provide boolean value" });
            }
            newObj["isFreeShipping"] = isFreeShipping.toLowerCase();
        }

        //style
        if (style != null) {
            if (!isValid(style)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Provide the style " });
            }
            newObj["style"] = style;
        }

        if (installments != null) {
            if (installments.length > 0) {
                if (!!isNaN(Number(installments)))
                    return res.status(400).send({
                        status: false,
                        message: "please enter valid installments and Should be in Number",
                    });

                if (installments < 0) {
                    return res.status(400).send({
                        status: false,
                        message: "installments Shoud be In Valid  Number only",
                    });
                }
                newObj["installments"] = installments;
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Installments can't be null as u have selected",
                });
            }
        }

        if (availableSizes != null) {
            let size = availableSizes.split(",");
            let Size = ["S", "XS", "M", "X", "L", "XXL", "XL"];
            const subtrim = size.map((element) => {
                return element.trim();
            });
            for (const element of subtrim) {
                if (Size.includes(element) === false)
                    return res.status(400).send({
                        status: false,
                        message:
                            'Provide the Sizes from this list ["S", "XS", "M", "X", "L", "XXL", "XL"]',
                    });
            }
            let arr = productData.availableSizes;
            for (let i = 0; i < arr.length; i++) {
                if (arr.includes(size)) {
                    return res.status(404).send({
                        status: false,
                        message: `this ${size} size is already present `,
                    });
                }
            }
        }
        
        let uploadedFileURL;
        if (files) {
            console.log(files)
            if (files == null) {
                return res.status(400).send({
                    status: false,
                    message: "Provide the Product Image as u have selected",
                });
            }

            if (files && files.length > 0) {
                if (!isValidImg(files[0].mimetype)) {
                    return res.status(400).send({
                        status: false,
                        message: "Image Should be of JPEG/ JPG/ PNG",
                    });
                }
                uploadedFileURL = await uploadFile(files[0]);
                newObj["productImage"] = uploadedFileURL;
             } 
        }

        //updation part
        const updateProduct = await productModel.findByIdAndUpdate(
            { _id: productId },
            { $set: newObj, $push: { availableSizes: availableSizes } },
            { new: true }
        );
        return res
            .status(200)
            .send({ status: true, message: "Product updated", data: updateProduct });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};
//=============================== Delete Product Api ===================================================================
const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId;
        if (!isValidObjectId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "Inavlid productId." });
        }
        const findProduct = await productModel.findById(productId);
        if (!findProduct) {
            return res
                .status(404)
                .send({ status: false, message: `No product found by ${productId}` }); ///product
        }
        if (findProduct.isDeleted == true) {
            return res
                .status(400)
                .send({ status: false, message: `Product has been already deleted.` });
        }
        const deletedProduct = await productModel
            .findOneAndUpdate(
                { _id: productId },
                { $set: { isDeleted: true, deletedAt: new Date() } },
                { new: true }
            )
            .select({ _id: 1, title: 1, isDeleted: 1, deletedAt: 1 });
        res.status(200).send({
            status: true,
            message: "Product deleted successfully.",
            data: deletedProduct,
        });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};
module.exports = {
    createProducts,
    getProductByFilter,
    getProductById,
    updateProduct,
    deleteProductById,
};
