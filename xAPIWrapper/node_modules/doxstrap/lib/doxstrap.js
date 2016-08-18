var cliOptions = require('./options'),
    renderDocs = require('./render'),
    writeDocs = require('./write');

function cli(options) {
    var opts = cliOptions.parse(options);
    return execute(opts);
}

function execute(options) {

    if (options.version) {

        cliOptions.version();

    } else if (options.help) {

        cliOptions.help();

    } else {

        renderDocs(options).then(function(html) {

            if(options.output) {

                writeDocs(options.output, html);

            } else {

                process.stdout.write(html);

            }

        });

    }
}

module.exports = {
    cli: cli,
    execute: execute
};
