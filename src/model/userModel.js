const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        require: true,
        type: String,
        unique: true
    },
    password: {
        require: true,
        type: String,
        minlength: 8,


    },
    profileImage: {
        type: String,
        required: true
    },
    address: {
        shipping: {
            street: { type: String },
            city: { type: String },
            pincode: { type: String }
        }
        ,
        billing: {
            street: { type: String },
            city: { type: String },
            pincode: { type: String }
        }
    }

}, { timestamps: true });


module.exports = mongoose.model('users', userSchema)