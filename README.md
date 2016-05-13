# Range

This repository holds the code for the Range mobile app developed in HTML5 and released on Windows, Android and iOS.

## Dependencies

* Visual Studio Tools for Apache Cordova (VS2013)
* REST server to send emails and text messages

## How to setup

Create a config.js file in the root directory, copy the contents of config.template.js and include your credentials and access tokens


You should set these configuration properties:
* GOOGLE_ANALYTICS_ID - your Analytics access token, like UA-xxxxxxxx-x
* BING_MAPKEY - your Bing Maps access token
* SERVER_URL - Range uses REST server to send emails and text messages
* XAP_TOKEN - your Socrata access token
* SOCRATA_URL - Socrata URL for Food
* LIBRARY_URL - Socrata URL for Safe Places
