#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://immense-gorge-4383.herokuapp.com/";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertLinkExists = function(url) {
    var link = url.toString();
    var url = require('url');
    try {
       var queryData = url.parse(link).query;
       return queryData;
    } catch (e) {
       console.log(e);
    }
}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists))
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <link>', 'url link')
        .parse(process.argv);

    if (program.file) {
       var checkJson = checkHtmlFile(program.file, program.checks);
       var outJson = JSON.stringify(checkJson, null, 4);
       console.log(outJson);
    } else if (program.url) {
       var link = program.url.toString();
       var http = require ('http');
       var content = ""; var loaded = 0;
       http.get(link, function(res) {
        // console.log("Got response: " + res.statusCode);
        res.on('data', function (chunk) {
          if (loaded == 0) {
             // res.on enterd 2x!
             content = chunk; loaded = 1;
          }
          // console.log('BODY: ' + chunk);
       });
      }).on('error', function(e) {
       console.log("Got error: " + e.message);
      });

      var $ = cheerio.load(content);
      var checks = loadChecks(program.checks).sort();
      var out = {};
      for(var ii in checks) {
         var present = $(checks[ii]).length > 0;
         out[checks[ii]] = present;
      }
      var outJson = JSON.stringify(out, null, 4);
      console.log(outJson);
    } else {
       console.log("Error: must specify --url or --file");
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
