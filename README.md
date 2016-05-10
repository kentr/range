# Range

This repository holds the code for the Range mobile app developed in HTML5 and released on Windows, Android and iOS.

## Dependencies

* Visual Studio Tools for Apache Cordova (VS2013)
* REST server to send emails and text messages

## How to setup

Edit config.js file and include your credentials and access tokens

```javascript
{
	allowDiscover: false,
	allowAnalytics: true,
	analyticsUrl: 'http://www.google-analytics.com/collect',
	analyticsId: 'GOOGLE_ANALYTICS_ID',
	mapkey: "BING_MAPKEY",
	serverUrl: 'SERVER_URL',
	xAppToken: 'XAP_TOKEN',
	socrataUrl: 'SOCRATA_URL',
	libraryUrl: 'LIBRARY_URL',
	bingScriptSrc: 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0',
	mapUrl: 'http://dev.virtualearth.net/REST/v1/Locations/'
}
```

You should set these configuration properties:
* GOOGLE_ANALYTICS_ID - your Analytics access token, like UA-xxxxxxxx-x
* BING_MAPKEY - your Bing Maps access token
* SERVER_URL - Range uses REST server to send emails and text messages
* XAP_TOKEN - your Socrata access token
* SOCRATA_URL - Socrata URL for Food
* LIBRARY_URL - Socrata URL for Safe Places
