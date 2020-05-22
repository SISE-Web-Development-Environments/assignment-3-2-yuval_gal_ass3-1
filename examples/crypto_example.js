const CryptoJS = require("crypto-js");

var hash = CryptoJS.SHA256("aaa");

console.log(hash.toString(CryptoJS.enc.Base64));
