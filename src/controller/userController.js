const userModel = require("../model/userModel");
const { isValidObjectId } = require("mongoose");
const aws1 = require("../aws/aws.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let { isValidRequestBody, isValid, isValidEmail, isvalidPincode, isValidPassword, isValidPhone, isValidImg } = require("../validator/validation");

//************************************************ Creating User  ********************************************/

const createUser = async (req, res) => {
  try {
    let data = req.body;
    let file = req.files;
    let { fname, lname, phone, email, password, address } = data;

    if (!isValidRequestBody(data)) {
      return res.status(400).send({ status: false, message: "Provide the data of User " });
    }

    if (!isValid(fname)) {
      return res.status(400).send({ status: false, message: "Provide the First Name " });
    }
    if (!/^[a-zA-Z ]{2,30}$/.test(fname)) {
      return res.status(400).send({ status: false, message: "Enter valid  fname" });
    }

    if (!isValid(lname)) {
      return res.status(400).send({ status: false, message: "Provide the last Name " });
    }
    if (!/^[a-zA-Z ]{2,30}$/.test(lname)) {
      return res.status(400).send({ status: false, message: "Enter valid  lname" });
    }

    if (!isValid(phone) || !isValidPhone(phone)) {
      return res.status(400).send({ status: false, message: "phone is required and it should be a valid indian phone number" });
    }
    let PhoneCheck = await userModel.findOne({ phone: phone.trim() });
    if (PhoneCheck) {
      return res.status(400).send({ status: false, message: `This no ${phone} is already present` });
    }

    if (!isValid(email)) {
      return res.status(400).send({ status: false, message: "Provide the EmailId " });
    }
    if (!isValidEmail(email)) {
      return res.status(400).send({ status: false, message: "Provide the Valid EmailId " });
    }
    let checkmail = await userModel.findOne({ email: email });
    if (checkmail) {
      return res.status(400).send({ status: false, message: `${email} already exists` });
    }

    if (!isValid(password)) {
      return res.status(400).send({ status: false, message: "Provide the Password " });
    }
    if (!isValidPassword(password)) {
      return res.status(400).send({ status: false, message: "Password Length must be btwn 8-15 chars only" });
    }

    const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(password, saltRounds);
    data["password"] = encryptedPassword;

    if (address) {
      let objAddress = JSON.parse(address);

      if (objAddress.shipping) {
        if (!isValid(objAddress.shipping.street)) {
          return res.status(400).send({ status: false, message: "Please provide street name in shipping address" });
        }
        if (!isValid(objAddress.shipping.city))
          return res.status(400).send({ status: false, message: "Please provide city name in shipping address", });

        if (!isvalidPincode(objAddress.shipping.pincode))
          return res.status(400).send({ status: false, message: "Please provide pincode in shipping address" });
      } else {
        res.status(400).send({ status: false, message: "Please provide shipping address and it should be present in object with all mandatory fields" });
      }

      if (objAddress.billing) {
        if (!isValid(objAddress.billing.street))
          return res.status(400).send({ status: false, message: "Please provide street name in billing address" });

        if (!isValid(objAddress.billing.city))
          return res.status(400).send({ status: false, message: "Please provide city name in billing address" });

        if (!isvalidPincode(objAddress.billing.pincode))
          return res.status(400).send({ status: false, message: "Please provide pincode in billing address" });
      } else {
        return res.status(400).send({ status: false, message: "Please provide billing address and it should be present in object with all mandatory fields" });
      }

      data["address"] = objAddress;

    } else {
      return res.status(400).send({ status: true, message: "Please Provide The Address" });
    }

    if (file.length == 0) {
      return res.status(400).send({ status: false, message: "Please Provide The Profile Image" })
    }
    if (file && file.length > 0) {
      if (!isValidImg(file[0].mimetype)) {
        return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG" });
      }

      let newurl = await aws1.uploadFile(file[0]);
      data["profileImage"] = newurl;
    }


    let createdUser = await userModel.create(data);
    return res.status(201).send({ status: true, message: "User Created Succefully", data: createdUser });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//************************************************ Login User  ********************************************/

const loginUser = async function (req, res) {
  try {
    const data = req.body;
    const { email, password } = data;
    if (!isValidRequestBody(data)) {
      return res.status(400).send({ status: false, message: "Please enter login credentials" });
    }

    if (!isValid(email) || !isValidEmail(email)) {
      return res.status(400).send({ status: false, message: "Email is requird and it should be a valid email address" });
    }
    const emailCheck = await userModel.findOne({ email: email });
    if (!emailCheck) {
      return res.status(404).send({ status: false, message: "Invalid User" });
    }

    if (!isValid(password) || !isValidPassword(password)) {
      return res.status(400).send({ status: false, message: "Password  should be Valid min 8 and max 15 length" });
    }
    const decrypPassword = emailCheck.password;
    const passCheck = await bcrypt.compare(password, decrypPassword);
    if (!passCheck) {
      return res.status(400).send({ status: false, message: "Password Incorrect" });
    }

    // Creating Token Here
    const token = jwt.sign(
      { userId: emailCheck._id },
      "MbFastChe-36",
      { expiresIn: "72hr" }
    );

    let obj = {
      userId: emailCheck._id,
      token: token,
    };
    res.setHeader("Authorization", "Bearer " + token);

    return res.status(201).send({ status: true, message: "User LoggedIn Succesfully", data: obj });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//************************************************ Get User  ********************************************/

const getUserProfile = async (req, res) => {
  try {

    let userId = req.params.userId;
    if (!userId) {
      return res.status(400).send({ status: false, message: "Provide UserID" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ stauts: false, message: "Invalid User Id" });
    }

    //authorization
    if (userId != req.userId) {
      return res.status(403).send({ status: false, message: "unauthorized access!" });
    }

    const userProfile = await userModel.findById({ _id: userId });
    if (userProfile) {
      return res.status(200).send({ status: true, message: 'Success', data: userProfile });
    } else {
      return res.status(404).send({ status: false, message: "No data Found" });
    }

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//************************************************ update User Profile  ********************************************/

const updateUserProfile = async function (req, res) {
  try {

    const userId = req.params.userId;
    const data = req.body;
    const file = req.files;
    let { fname, lname, phone, email, password, address } = data;

    //body is empty
    if (!isValidRequestBody(data)) {
      return res.status(400).send({ status: false, message: "Please provide data for update" });
    }

    //check userId via mongoose
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ stauts: false, message: "Invalid User Id" });
    }

    //userId present or not
    const isUserPresent = await userModel.findById(userId);
    if (!isUserPresent) {
      return res.status(404).send({ status: false, message: "No User Found" });
    }

    //authorization
    if (userId != req.userId) {
      return res.status(403).send({ status: false, message: "unauthorized access!" });
    }

    const bodyFromReq = JSON.parse(JSON.stringify(req.body));

    //validation part
    let newObj = {};
    if (bodyFromReq.hasOwnProperty("fname")) {
      if (!isValid(fname)) {
        return res.status(400).send({ status: false, message: "Provide the First Name " });
      }
      if (!/^[a-zA-Z ]{2,30}$/.test(fname)) {
        return res.status(400).send({ status: false, message: "Enter valid  fname" });
      }

      newObj["fname"] = fname;
    }
    if (bodyFromReq.hasOwnProperty("lname")) {
      if (req.body.lname.trim().length == 0) {
        return res.status(400).send({ status: false, message: "Provide the last Name " });
      }
      if (!/^[a-zA-Z ]{2,30}$/.test(lname)) {
        return res.status(400).send({ status: false, message: "Enter valid  lname" });
      }

      newObj["lname"] = lname;
    }
    if (bodyFromReq.hasOwnProperty("phone")) {
      if (!isValid(phone) || !isValidPhone(phone)) {
        return res.status(400).send({ status: false, message: "phone is required and it should be a valid indian phone number", });
      }

      let PhoneCheck = await userModel.findOne({ phone: phone.trim() });
      if (PhoneCheck) {
        return res.status(400).send({ status: false, message: `This no ${phone} is already present` });
      }

      newObj["phone"] = phone;
    }

    if (bodyFromReq.hasOwnProperty("email")) {
      if (!isValid(email)) {
        return res.status(400).send({ status: false, message: "Provide the EmailId " });
      }
      if (!isValidEmail(email)) {
        return res.status(400).send({ status: false, message: "Provide the Valid EmailId " });
      }

      let checkmail = await userModel.findOne({ email: email });
      if (checkmail) {
        return res.status(400).send({ status: false, message: `${email} already exists` });
      }

      newObj["email"] = email;
    }
    if (bodyFromReq.hasOwnProperty("password")) {
      if (!isValid(password)) {
        return res.status(400).send({ status: false, message: "Provide the Password " });
      }
      if (!isValidPassword(password)) {
        return res.status(400).send({ status: false, message: "Password Length must be btwn 8-15 chars only" });
      }

      // if old password is same as new password
      const isSamePassword = bcrypt.compare(password, isUserPresent.password);
      if (isSamePassword) {
        return res.status(400).send({ status: false, message: "Entered a new password, This is same as old password" });
      }

      const saltRounds = 10;
      const encryptedPassword = await bcrypt.hash(password, saltRounds);

      newObj["password"] = encryptedPassword;
    }

    if (bodyFromReq.hasOwnProperty("address")) {
      if (address) {
        let objAddress = JSON.parse(address);
        let add = isUserPresent.address;
        if (objAddress.shipping) {
          if (objAddress.shipping.street) {
            if (!isValid(objAddress.shipping.street)) {
              return res.status(400).send({ status: false, message: "Please provide street name in shipping address" });
            }

            add.shipping.street = objAddress.shipping.street;
          }

          if (objAddress.shipping.city) {
            if (!isValid(objAddress.shipping.city)) {
              return res.status(400).send({ status: false, message: "Please provide city name in shipping address" });
            }
            if (!/^[a-zA-Z ]{2,30}$/.test(objAddress.shipping.city)) {
              return res.status(400).send({ status: false, message: "Enter valid  city name not a number" });
            }

            add.shipping.city = objAddress.shipping.city;
          }

          if (objAddress.shipping.pincode) {
            if (!isvalidPincode(objAddress.shipping.pincode)) {
              return res.status(400).send({ status: false, message: "Please provide pincode in shipping address" });
            }

            add.shipping.pincode = objAddress.shipping.pincode;
          }
        }

        if (objAddress.billing) {
          if (objAddress.billing.street) {
            if (!isValid(objAddress.billing.street)) {
              return res.status(400).send({ status: false, message: "Please provide street name in billing address" });
            }

            add.billing.street = objAddress.billing.street;
          }

          if (objAddress.billing.city) {
            if (!isValid(objAddress.billing.city)) {
              return res.status(400).send({ status: false, message: "Please provide city name in billing address" });
            }
            if (!/^[a-zA-Z ]{2,30}$/.test(objAddress.billing.city)) {
              return res.status(400).send({ status: false, message: "Enter valid  city name not a number" });
            }

            add.billing.city = objAddress.billing.city;
          }

          if (objAddress.billing.pincode) {
            if (!isvalidPincode(objAddress.billing.pincode)) {
              return res.status(400).send({ status: false, message: "Please provide pincode in billing address" });
            }

            add.billing.pincode = objAddress.billing.pincode;
          }
        }

        newObj["address"] = add;
      } else {
        return res.status(400).send({ status: true, message: "Please Provide The Address" });
      }
    }

    //upload file
    if (file) {
      if (file && file.length > 0) {
        if (!isValidImg(file[0].mimetype)) {
          return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG" });
        }

        let newurl = await aws1.uploadFile(file[0]);
        data["profileImage"] = newurl;
      }
    } else {
      return res.status(400).send({ status: false, message: "Provide The Profile Image as u Have selected" });
    }

    //updation part
    const updateUser = await userModel.findByIdAndUpdate({ _id: userId }, { $set: newObj }, { new: true }
    );

    return res.status(200).send({ status: true, message: "User profile updated", data: updateUser });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};


module.exports = { createUser, loginUser, getUserProfile, updateUserProfile };