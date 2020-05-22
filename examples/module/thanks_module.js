var thanks = "Thank you, "; //private

//#region option 1
//public
function saythanks(name) {
  console.log(thanks + name);
}

module.exports.say_thanks = saythanks;
//#endregion

//#region option 2
// // public
// exports.saythanks = function (name) {
//   console.log(thanks + name);
// };
//#endregion
