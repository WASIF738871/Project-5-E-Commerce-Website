const orderModel = require("../model/orderModel");
const productModel = require("../model/productModel");
const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel");
const { isValidObjectId } = require("mongoose");

//********************************************Crate Order Api************************************************* */

const createOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { cartId } = data;

        //User Validation
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid UserId" });
        }
        if (userId != req.userId) {
            return res
                .status(403)
                .send({ status: false, message: "Unauthorized Access" });
        }
        const userExist = await userModel.findById(userId);
        if (!userExist) {
            return res.status(404).send({ status: false, msg: "No User Found" });
        }

        data["userId"] = userId;

        //data Checking

        //Cart Validation
        if (!data.cartId.trim()) {
            return res.status(400).send({ status: false, msg: "Provide The CartId" });
        }

        cartId = cartId.trim();
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "Invalid cartId" });
        }
        let cartExist = await cartModel.findById(cartId);
        if (cartExist.items.length == 0) {
            return res
                .status(404)
                .send({ status: false, msg: "There Is No Items for Order In Ur Cart" });
        }
        if (cartExist) {
            data["totalPrice"] = cartExist.totalPrice;
            data["totalItems"] = cartExist.totalItems;
            let totalQuantity = 0;
            for (let i = 0; i < cartExist.items.length; i++) {
              
                totalQuantity += cartExist.items[i].quantity;
            }
            
            data["items"] = cartExist.items
            data["totalQuantity"] = totalQuantity;

            let orderCreated = await orderModel.create(data);
            if (orderCreated) {
                cartExist.items.splice(0);
                cartExist.totalItems = 0;
                cartExist.totalPrice = 0;
                await cartModel.findOneAndUpdate({ _id: cartId }, { $set: cartExist });
            }
            return res
                .status(201)
                .send({
                    status: true,
                    msg: "Order Created SuccessFull",
                    Order: orderCreated,
                });
        } else {
            return res.status(404).send({ status: false, msg: "No Cart Found" });
        }
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

//********************************************Update Order Api************************************************* */

const updateOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { orderId,status } = data;

        //User Validation
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid UserId" });
        }
        if (userId != req.userId) {
            return res
                .status(403)
                .send({ status: false, message: "Unauthorized Access" });
        }
        const userExist = await userModel.findById(userId);
        if (!userExist) {
            return res.status(404).send({ status: false, msg: "No User Found" });
        }

        if (Object.keys(data).length == 0) {
            return res
                .status(400)
                .send({ status: false, message: "Provide The data " });
        }

        //order validation
        orderId = orderId.trim();
        if (!orderId) {
            return res
                .status(400)
                .send({ status: false, msg: "Provide The OrderId" });
        }
        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, msg: "Invalid OrderId" });
        }
        let orderExist = await orderModel.findOne({
            _id: orderId,
            isDeleted: false,
        });
        if (!orderExist) {
            return res
                .status(404)
                .send({ status: false, msg: "There Is no order Exist" });
        }
        if (orderExist.userId != userId) {
            return res
                .status(403)
                .send({
                    status: false,
                    msg: "Either this OrderId or userId is not Urs",
                });
        }
        if (orderExist.cancellable == "false") {
            return res
                .status(400)
                .send({ status: false, msg: "This Order Can't be cancelled" });
        } else {
            orderExist.status = status;
            // orderExist.isDeleted = true;
            // orderExist.deletedAt = Date.now();
            let updated = await orderModel.findOneAndUpdate(
                { _id: orderId },
                { $set: orderExist },
                { new: true }
            );
            return res
                .status(200)
                .send({ status:true, msg: "order Updated", Order: updated });
        }
    } catch (err) {
        return res.status(500).send({ status: flase, msg: err.message });
    }
};

module.exports = { createOrder, updateOrder };
