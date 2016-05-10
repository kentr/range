if (!navigator.app) navigator.app = {};
navigator.app.exitApp = function () {
    cordova.exec(function () { }, function () { }, 'Terminate', 'terminate', []);
};