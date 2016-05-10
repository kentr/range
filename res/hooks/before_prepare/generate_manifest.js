#!/usr/bin/env node

var fs = require('fs');
var xml2js = require('xml2js').parseString;

xml2js(fs.readFileSync('config.xml'), function(err, xml){
    console.log('VERSION =>', xml.widget.$.version, xml.widget);
    fs.writeFileSync('www/manifest.js', '(function(){ navigator.manifest = { "id": "' + xml.widget.$.id + '", "name": "' + xml.widget.name + '", "version": "' + xml.widget.$.version + '", "buildDate": "' + new Date().toISOString() + '" }; })();');
});
