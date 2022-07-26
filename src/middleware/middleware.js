const jwt = require('jsonwebtoken')
const authentication = async function (req, res, next) {
    try {

        let tokenWithBearer = req.headers["authorization"];
        console.log(tokenWithBearer);
        if (!tokenWithBearer) {
            return res.status(400).send({ status: false, msg: "token not found" })
        }
        let tokenArray = tokenWithBearer.split(" ");
        console.log(tokenArray);

        let token = tokenArray[1];
        console.log(token);


        let decodedtoken = jwt.verify(token, "MbFastChe-36")
        if (!decodedtoken) {
            return res.status(401).send({ status: false, msg: "invalid token" })
        }
        req.userId=decodedtoken.userId
        next()
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = {authentication}
