const bcrypt = require("bcrypt");
const saltRounds = 10;
const myPlaintextPassword = "stam";

const salt = bcrypt.genSaltSync(saltRounds);
console.log(salt);

let hash = bcrypt.hashSync(myPlaintextPassword, saltRounds);
console.log(hash);
console.log(bcrypt.compareSync(myPlaintextPassword, hash));

hash = bcrypt.hashSync(myPlaintextPassword, saltRounds);
console.log(hash);
console.log(bcrypt.compareSync(myPlaintextPassword, hash));
