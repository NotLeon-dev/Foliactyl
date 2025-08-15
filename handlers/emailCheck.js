import validator from 'email-validator';

export default function emailCheck(email) {
    return new Promise(async resolve => {
        if (!validator.validate(email)) return resolve(true);
        else return resolve(true);
    });
}