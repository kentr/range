var DiscoVer = function () {
    this.warning = function (title, message, buttons, callback) {
        if (navigator.notification && typeof navigator.notification.confirm == 'function') {
            navigator.notification.confirm(message, callback, title, buttons.map(function (it) { return it.Title; }));
        } else {
            alert(message);
            if (typeof callback == 'function') callback();
        }
    };
    this.information = function (title, message, buttons, callback) {
        if (navigator.notification && typeof navigator.notification.confirm == 'function') {
            navigator.notification.confirm(message, callback, title, buttons.map(function (it) { return it.Title; }));
        } else {
            alert(message);
            if (typeof callback == 'function') callback();
        }
    };
    this.blocked = function (title, message, buttons, callback) {
        if (navigator.notification && typeof navigator.notification.confirm == 'function') {
            navigator.notification.confirm(message, callback, title, buttons.map(function (it) { return it.Title; }));
        } else {
            alert(message);
            if (typeof callback == 'function') callback();
        }
    };
    this.url = 'https://discoversion.azurewebsites.net/api/GetSettings';
    this.fingerprint = '26 A6 12 35 4B 46 76 4F 22 64 DD 17 DB CF 51 58 A0 23 FA A4';
};

DiscoVer.prototype = {
    MessageType: {
        0: 'warning',
        1: 'information',
        2: 'blocked'
    },
    get: function (name, version, platform, callback) {
        var disableBackBtn = function(e){
            e.preventDefault();
        };
        document.addEventListener('backbutton', disableBackBtn);

        var self = this;
        var fn = function () {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', self.url + '?t=' + new Date().getTime(), true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState == (xhr.DONE || 4)) {
                    self.settings = {};
                    var data;
                    try{
                        data = JSON.parse(xhr.responseText);
                    }catch(err){
                        return callback();
                    }
                    if (data.Settings) {
                        for (var i = 0; i < data.Settings.length; i++) {
                            var entry = data.Settings[i];
                            self.settings[entry.EndpointName || entry.Name] = entry.EndpointValue || entry.Value;
                        }
                    }
                    var chain = [];
                    var next = function () {
                        if (chain.length) return chain.shift();
                        else {
                            document.removeEventListener('backbutton', disableBackBtn);
                            return callback;
                        }
                    };
                    var add = function (type, message) {
                        var n = next();
                        chain.push(function () {
                            var buttons = message.MessageButtons && message.MessageButtons.length ? message.MessageButtons : [{ Title: 'OK' }];
                            self[type](message.Title || data.Name || navigator.manifest.name || (type.toUpperCase().slice(0, 1) + type.slice(1)), message.Message, buttons, function (buttonIndex) {
                                buttonIndex--;
                                if (buttons[buttonIndex] && buttons[buttonIndex].Url) {
                                    var target = buttons[buttonIndex].Url;
                                    setTimeout(function () {
                                        if (typeof device != 'undefined' && device.platform == 'Win32NT') {
                                            cordova.exec(function () { }, function () { }, 'OpenWeb', 'open', target);
                                        } else {
                                            window.open(target, '_system', 'location=yes');
                                        }
                                        if (type == 'blocked' && device.platform == 'Win32NT') {
                                            setTimeout(function () {
                                                self.isBlocked = true;
                                                cordova.exec(function () { }, function () { }, 'Terminate', 'terminate', []);
                                            }, 200);
                                        }

                                        if (typeof n == 'function'){
                                            var resumeFn = function(){
                                                n();
                                                document.removeEventListener(resumeFn);
                                            }
                                            document.addEventListener('resume', resumeFn);
                                        }
                                    }, 200);
                                } else {
                                    if (type == 'blocked' && device.platform == 'Win32NT') {
                                        cordova.exec(function () { }, function () { }, 'Terminate', 'terminate', []);
                                    }
                                    if (type == 'blocked') {
                                        self.isBlocked = true;
                                        if (device.platform != 'Win32NT' && navigator.app && navigator.app.exitApp) navigator.app.exitApp();
                                    } else if (typeof n == 'function') n();
                                }
                            });
                        });
                    };
                    if (data.Messages && data.Messages.length > 0) {
                        for (var i = 0; i < data.Messages.length; i++) {
                            var message = data.Messages[i];
                            var type = typeof message.Type == 'number' ? self.MessageType[message.Type] : message.Type.toLowerCase();

                            if (type != 'blocked' && message.Repeat) {
                                var key = 'messageoftheday_' + data.Name + '_' + message.Id + '_' + type;
                                var local = +(window.localStorage[key] || message.Repeat);
                                if (local > 0) {
                                    add(type, message);
                                    local--;
                                }
                                window.localStorage[key] = local;
                            } else add(type, message);
                        }
                    }
                    next()();
                }
            };
            xhr.send(JSON.stringify({
                namespace: name,
                version: version,
                platform: platform
            }));
        };

        /*if (window.plugins && window.plugins.sslCertificateChecker) {
            window.plugins.sslCertificateChecker.check(
                function (msg) {
                    console.log('SSL check:');
                    console.log(msg);
                    if (msg == 'CONNECTION_SECURE') {
                        fn();
                    } else {
                        navigator.notification.alert('SSL certificate error. Exiting app.', function () {
                            if (device.platform == 'Win32NT') {
                                cordova.exec(function () { }, function () { }, 'Terminate', 'terminate', []);
                            } else if (navigator.app && navigator.app.exitApp) navigator.app.exitApp();
                        }, navigator.manifest.name);
                    }
                },
                function (msg) {
                    console.log('SSL check error:');
                    console.log(msg);
                    navigator.notification.alert('SSL certificate error. Exiting app.', function () {
                        if (device.platform == 'Win32NT') {
                            cordova.exec(function () { }, function () { }, 'Terminate', 'terminate', []);
                        } else if (navigator.app && navigator.app.exitApp) navigator.app.exitApp();
                    }, navigator.manifest.name);
                },
                self.url,
                self.fingerprint);
            return;
        } else*/ fn();
    },
    setAction: function (id, type, fn) {
        if (arguments.length == 2 && typeof arguments[0] == 'string' && typeof arguments[1] == 'function') {
            fn = type;
            type = id;
            id = undefined;
        }

        if (id) {
            this.MessageType[id] = type.toLowerCase();
        }

        this[type.toLowerCase()] = fn;
    }
};

if (!window.plugins) {
    window.plugins = {};
}
if (!window.plugins.discover) {
    window.plugins.discover = new DiscoVer();
}

if (typeof module != 'undefined' && module.exports) {
    module.exports = DiscoVer;
}