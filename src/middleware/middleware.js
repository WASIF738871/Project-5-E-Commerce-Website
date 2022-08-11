const jwt = require("jsonwebtoken");
const authentication = async function (req, res, next) {
    try {
        let tokenWithBearer = req.headers["authorization"];

        if (!tokenWithBearer) {
            return res.status(401).send({ status: false, msg: "token not found" });
        }
        let tokenArray = tokenWithBearer.split(" ");

        let token = tokenArray[1];

        let decodedtoken = jwt.verify(token, "MbFastChe-36", function (err, token) {
            if (err) return false;
            if (token) return true
        });
        if (!decodedtoken) {
            return res.status(401).send({ status: false, msg: "invalid token" });
        }

        req.userId = decodedtoken.userId;

        next();
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};


module.exports = { authentication };