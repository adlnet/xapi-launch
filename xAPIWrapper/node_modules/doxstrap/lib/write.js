var path = require('path'),
    cpr = require('cpr'),
    mkdirp = require('mkdirp'),
    fs = require('fs');

module.exports = function(dir, html) {

    var assetDir = path.resolve(__dirname, '..', 'static'),
        outputDir = path.resolve(dir);

    mkdirp(outputDir, function() {

        fs.writeFile(outputDir + '/index.html', html);

        cpr(assetDir, outputDir + '/static', {overwrite: true}, function(errors) {
            if(errors) {
                process.stderr.write(errors);
            }
        });
    });
};
