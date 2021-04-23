const bcrypt = require('bcrypt');
const saltRounds = 10;

export const hashPassword2 = async (password:string):Promise<string> => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (!err) resolve(hash)
            else reject(err)
        });
    })
}
export const isPasswordThatHash2 = async (password:string, hash:string):Promise<boolean> => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, function(err, res:boolean) {
            if (!err) resolve(res)
            else reject(err)
        });
    })
}