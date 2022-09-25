const validator = require("email-validator");

module.exports = (email) => {
    return new Promise(async resolve => {
       if (validator.validate(email) == false) return resolve(true)
	   else return resolve(true)
    })
}