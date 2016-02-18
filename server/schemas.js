var fs = require("fs");
try{
exports.createAccountRequest = JSON.parse(fs.readFileSync("./server/schema/createAccountRequest.json"));
exports.registerContentRequest = JSON.parse(fs.readFileSync("./server/schema/registerContentRequest.json"));
exports.content = JSON.parse(fs.readFileSync("./server/schema/content.json"));
exports.account = JSON.parse(fs.readFileSync("./server/schema/account.json"));
exports.launch = JSON.parse(fs.readFileSync("./server/schema/launch.json"));
exports.termination = JSON.parse(fs.readFileSync("./server/schema/termination.json"));
exports.mediaType = JSON.parse(fs.readFileSync("./server/schema/mediaType.json"));
exports.media = JSON.parse(fs.readFileSync("./server/schema/media.json"));
exports.registerMediaRequest = JSON.parse(fs.readFileSync("./server/schema/registerMediaRequest.json"));

}catch(e)
{
	console.log(e);
}
