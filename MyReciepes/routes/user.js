var express = require("express");
var router = express.Router();
const DButils = require("../../modules/DButils");
const bcrypt = require("bcrypt");
const generic = require("./genericFunctions");


router.post("/Register", async (req, res, next) => {
  try {
    // Valid parameters
    validParameters(req);
    // username exists
    const users = await DButils.execQuery("SELECT username FROM users");

    if (users.find((x) => x.username === req.body.username))
      throw { status: 409, message: "Username is taken" };

    // add the new username
    let hash_password = bcrypt.hashSync(
        req.body.password,
        parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
        `INSERT INTO users VALUES ('${req.body.username}', '${hash_password}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.email}', '${req.body.profilePic}', '${req.body.country}')`
    );
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === req.body.username))
      throw { status: 401, message: "Username or Password is incorrect" };

    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = '${req.body.username}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password is incorrect" };
    }

    // Set cookie
    req.ass_session.username = user.username;
    // req.session.save();
    // res.cookie(session_options.cookieName, user.user_id, cookies_options);

    // return cookie
    res.status(200).send({ username: req.body.username});
  } catch (error) {
    next(error);
  }
});

router.post("/Logout", function (req, res) {
  try {
    if(req.ass_session.username) {
      res.clearCookie("ass_session");// reset the session info --> send cookie when  req.session == undefined!!
      res.status(200).send({message: "Logout Successfully"});
    }
    else
    {
      throw { status: 401, message: "Logout Failed" }
    }
  }
  catch (error) {
    throw { status: 401, message: "Logout Failed" }
  }

});


function validParameters(req){
  if(!req.body.username || !req.body.password || !req.body.firstName ||
      !req.body.lastName || !req.body.email || !req.body.profilePic ||
      !req.body.country){
    throw { status: 400, message: "Missing parameters" };
  }
  // Valid parameters
  //Validate Username - need to be between 3 and 8 chars
  if(req.body.username.length < 3 || req.body.username.length >8){
    throw { status: 400, message: "The username should be between 3 and 8 characters" };
  }
  //Validate password - need to be between 5 and 10 chars
  if(req.body.password.length < 5 || req.body.password.length >10){
    throw { status: 400, message: "The password should be between 5 and 10 characters" };
  }
  //Validate password - should include at least one number
  if(req.body.password.search(/\d/) === -1) {
    throw {status: 400, message: "The password should include at least one number"};
  }
  //Validate password - should include at least one special char
  if(req.body.password.match(/^[A-Z,a-z,0-9]*$/)){
    throw { status: 400, message: "The password should include at least one special char" };
  }
  let countries = ["Afghanistan", "Åland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
    "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia (Plurinational State of)",
    "Bonaire", "Sint Eustatius and Saba", "Bosnia and Herzegovina", "Botswana", "Bouvet Island",
    "Brazil", "British Indian Ocean Territory", "United States Minor Outlying Islands",
    "Virgin Islands (British)", "Virgin Islands (U.S.)", "Brunei Darussalam","Bulgaria","Burkina Faso",
    "Burundi","Cambodia","Cameroon","Canada","Cabo Verde","Cayman Islands","Central African Republic",
    "Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia",
    "Comoros","Congo","Congo (Democratic Republic of the)","Cook Islands","Costa Rica",
    "Croatia","Cuba","Curaçao","Cyprus","Czech Republic","Denmark","Djibouti",
    "Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
    "Eritrea","Estonia","Ethiopia","Falkland Islands (Malvinas)","Faroe Islands","Fiji",
    "Finland","France","French Guiana","French Polynesia","French Southern Territories",
    "Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada",
    "Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti",
    "Heard Island and McDonald Islands","Holy See","Honduras","Hong Kong","Hungary",
    "Iceland","India","Indonesia","Côte d'Ivoire","Iran (Islamic Republic of)","Iraq",
    "Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan",
    "Kenya","Kiribati","Kuwait","Kyrgyzstan","Lao People's Democratic Republic","Latvia",
    "Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao",
    "Macedonia (the former Yugoslav Republic of)","Madagascar","Malawi","Malaysia",
    "Maldives","Mali","Malta","Marshall Islands","Martinique","Mauritania","Mauritius",
    "Mayotte","Mexico","Micronesia (Federated States of)","Moldova (Republic of)","Monaco",
    "Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauru",
    "Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue",
    "Norfolk Island","Korea (Democratic People's Republic of)","Northern Mariana Islands",
    "Norway","Oman","Pakistan","Palau","Palestine", "State of","Panama","Papua New Guinea",
    "Paraguay","Peru","Philippines","Pitcairn","Poland","Portugal","Puerto Rico","Qatar",
    "Republic of Kosovo","Réunion","Romania","Russian Federation","Rwanda","Saint Barthélemy",
    "Saint Helena", "Ascension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia",
    "Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines",
    "Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles",
    "Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia",
    "Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands",
    "Korea (Republic of)","South Sudan","Spain","Sri Lanka","Sudan","Suriname",
    "Svalbard and Jan Mayen","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Taiwan",
    "Tajikistan","Tanzania", "United Republic of","Thailand","Timor-Leste","Togo","Tokelau",
    "Tonga","Trinidad and Tobago","Tunisia,Turkey","Turkmenistan","Turks and Caicos Islands",
    "Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom of Great Britain and Northern Ireland",
    "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela (Bolivarian Republic of)", "Viet Nam",
    "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"];
  if(!countries.includes(req.body.country)){
    throw { status: 400, message: "Please enter a valid country name" };
  }
}

module.exports = router;
