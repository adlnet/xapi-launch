var fs = require("fs");
try{
exports.createAccountRequest = JSON.parse(fs.readFileSync("./server/schema/createAccountRequest.json"));
}catch(e)
{
	console.log(e);
}
