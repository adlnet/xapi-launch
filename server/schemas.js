var fs = require("fs");
try{
exports.createAccountRequest = JSON.parse(fs.readFileSync("./server/schema/createAccountRequest.json"));
exports.registerContentRequest = JSON.parse(fs.readFileSync("./server/schema/registerContentRequest.json"));
exports.content = JSON.parse(fs.readFileSync("./server/schema/content.json"));
exports.account = JSON.parse(fs.readFileSync("./server/schema/account.json"));
}catch(e)
{
	console.log(e);
}
