const jwt = require('jsonwebtoken')
const config = require('../config')

exports.generateToken = (payload, passwordReset = false) => {
    const expiresIn = passwordReset ? config.PASSWORD_RESET_TOKEN_EXPIRATION : config.LOGIN_TOKEN_EXPIRATION;
    return jwt.sign(payload, config.SECRET_KEY, { expiresIn })
}
