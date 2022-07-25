const jwt = require('jsonwebtoken')
const authentication = async function (req, res, next) {
    try {

        let token = req.headers["x-api-key"]
        if (!token) token = req.headers["X-API-KEY"]
        if (!token) {
            return res.status(400).send({ status: false, msg: "token not found" })
        }
        let decodedtoken = jwt.verify(token, "MbFastChe-36")
        if (!decodedtoken) {
            return res.status(401).send({ status: false, msg: "invalid token" })
        }
        next()
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = {authentication}
