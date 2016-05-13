(function () {
    window.conf = function () {
        return {
            allowDiscover: false,
            allowAnalytics: false,
            analyticsUrl: 'http://www.google-analytics.com/collect',
            analyticsId: 'GOOGLE_ANALYTICS_ID',
            mapkey: "BING_MAPKEY",
            serverUrl: 'SERVER_URL',
            xAppToken: 'XAP_TOKEN',
            socrataUrl: 'SOCRATA_URL',
            libraryUrl: 'LIBRARY_URL',
            bingScriptSrc: 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0',
            mapUrl: 'http://dev.virtualearth.net/REST/v1/Locations/'
        };
    };
})();