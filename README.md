#RANGE Version 1.2.5

A project of Caravan Studios, a division of TechSoup Global a 501(c)3 nonprofit

Range provides time and location-specific information about free basic human services - food and safe places - for youth in need.

Developed as an HTML5/Cordova hybid app and released on Windows, Android, and iOS

##Dependencies:
	###Client Libraries:
	* Cordova 5.0.0
	* jQuery JavaScript Library v1.9.1
	* jQuery UI - v1.10.4
	* jQuery Mobile 1.3.2
	* pako v0.2.0 (zlib port to javascript)
	* Overflow v0.7.0 (An overflow:auto polyfill for responsive design)
	* moment.js v2.7.0 (used to parse, validate, manipulate and display dates)
	* Bing Maps API (Microsoft)

	###Range Data:
		* All Range data is stored in Socrata	and accessed through the [Socrata APIs](www.socrata.com)

	###Range Server:
		* SMS and email messaging is handled through the [range-server service](https://github.com/CaravanStudios/range-server) 
	###Discovery Service (optional)
		* Configuration information can optionally be accessed via a Discovery Service (contact Caravan for more details)

### To set up:

Create a config.js file in the root directory, copy the contents of config.template.js and include your credentials and access tokens in config.js

You should set these configuration properties:
* GOOGLE_ANALYTICS_ID - your Analytics access token, like UA-xxxxxxxx-x
* BING_MAPKEY - your Bing Maps access token
* SERVER_URL - Range uses REST server to send emails and text messages
* XAP_TOKEN - your Socrata access token
* SOCRATA_URL - Socrata URL for Food
* LIBRARY_URL - Socrata URL for Safe Places

##To Configure environment for building:
	1. npm install -g cordova
	2. cordova platform add <platform name>
	(platform names: browser, android, ios, windows)
	
##To build:
	cordova build
	
##To run:
	cordova run
