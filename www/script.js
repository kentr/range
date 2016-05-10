var config = conf();

var current_latitude = 37.752570658922195;
var current_longitude = -122.48919010162354;
var orig_current_latitude = 37.752570658922195;
var orig_current_longitude = -122.48919010162354;
var current_address = "";
var orig_current_address = "";
var map = null;
var mapkey = config.mapkey;
var serverUrl = config.serverUrl;
var pinLayer = typeof Microsoft != 'undefined' ? new Microsoft.Maps.EntityCollection() : null;
var defaultInfobox = null;
var pushpinFrameHTML = '{content}';
var infoboxOptions = typeof Microsoft != 'undefined' ? { width: 10, height: 10, showCloseButton: true, zIndex: 0, offset: new Microsoft.Maps.Point(10, 0), showPointer: true } : null;
var places = new Array();
var selectedToShare = new Array();
window.localStorage.removeItem('places');
var xAppToken = config.xAppToken;
var socrataUrl = config.socrataUrl;
var libraryUrl = config.libraryUrl;
var socrataFields = [
    ":id",
    ":created_at",
    ":updated_at",
    "site_zip",
    "site_description",
    "site_website",
    "site_contact_lastname",
    "site_program",
    "meal_types",
    "start_date",
    "end_date",
    "breakfast_start_time",
    "breakfast_end_time",
    "lunch_start_time",
    "lunch_end_time",
    "snack_start_time",
    "snack_end_time",
    "dinner_start_time",
    "dinner_end_time",
    "sponsor_name",
    "coordinates",
    "serialno",
    "site_city",
    "site_state",
    "days_of_operation",
    "site_contact",
    "site_phone",
    "site_name",
    "site_address_extension",
    "site_contact_firstname",
    "site_street_address",
    "county_name"];
var libraryFields = [
    ":id",
    ":created_at",
    ":updated_at",
    "serialno",
    "library_name",
    "site_name",
    "site_state",
    "site_city",
    "site_zip",
    "site_street_address",
    "site_phone",
    "coordinates",
    "date_changed",
    "start_date",
    "end_date",
    "monday_open",
    "monday_close",
    "tuesday_open",
    "tuesday_close",
    "wednesday_open",
    "wednesday_close",
    "thursday_open",
    "thursday_close",
    "friday_open",
    "friday_close",
    "saturday_open",
    "saturday_close",
    "sunday_open",
    "sunday_close"
];
var current_place = null;
var share_count = 0;
var distance = 10;
var open_status = "all";
var bookmark = new Array();
var window_height = null;
var window_width = null;
var menu_height = null
var map1 = null;
var map2 = null;
var directionsManager = null;
var page = "food";
var dw1 = 0;
var dw2 = 0;
var dw3 = 0;
var dw4 = 0;

if (!navigator.notification) {
    navigator.notification = {
        alert: function (msg) {
            window.alert(msg);
        }
    };
}

function comingSoon() {
    navigator.notification.alert("Call 2-1-1 for services in your area", function () { }, 'Feature in development!');
}

function cancelEvent(e) {
    if (!e) e = window.event;
    if (typeof e.preventDefault == 'function') e.preventDefault();
    if (typeof e.stopPropagation == 'function') e.stopPropagation();
    e.returnValue = false;
}

function openWeb(e) {
    if (!e) e = window.event;
    cancelEvent(e);
    if (typeof device != 'undefined' && device.platform == 'Win32NT') {
        var url = '';
        if ($(e.srcElement).is('A'))
            url = $(e.srcElement).attr('href');
        else
            url = $(e.srcElement).parents('A').attr('href');

        cordova.exec(function () { }, function () { }, 'OpenWeb', 'open', [url]);
    } else {
        window.open(e.currentTarget.getAttribute('href'), '_system', 'location=yes');
    }
    return false;
}

$.mobile.showPageLoadingMsg = function () {
    $('.ui-icon-loading').show();
};

$.mobile.hidePageLoadingMsg = function () {
    $('.ui-icon-loading').hide();
};

$(function () {
    $(document).on('MSPointerDown touchstart click', '.menu-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('.menu').addClass('active');

        return false;
    });

    $(document).on('click', '.menu a[data-href]', function (e) {
        e.preventDefault();
        e.stopPropagation();

        $('.menu').toggleClass('active');
        $.mobile.changePage($(e.target).attr('data-href'), { transition: 'slide', reverse: false, changeHash: false });

        return false;
    });

    $(document).on('click', "#home-page .first", function (event) {
        event.stopPropagation();

        $(this).height(window_height);

        places.length = 0;
        if (map && map.entities) {
            map.entities.clear();
            pinLayer = new Microsoft.Maps.EntityCollection();
        }

        if (page != 'food' && returnTo != 'food') {
            share_count = 0;
            selectedToShare.length = 0;
            update_share();
        }

        page = "food";

        $('body').addClass("food-page");

        $(this).one('webkitTransitionEnd transitionend', function () {
            $.mobile.changePage('map-page.html', { transition: "slide", reverse: false, changeHash: false });
        });

        $('.menu').removeClass('active');
    });

    $(document).on('click', "#home-page .second", function (event) {

        event.stopPropagation();

        $(this).height(window_height);
        $('#home-page .first').hide();
        $('#home-page .third').hide();

        places.length = 0;
        if (map && map.entities) {
            map.entities.clear();
            pinLayer = new Microsoft.Maps.EntityCollection();
        }

        if (page != 'library' && returnTo != 'library') {
            share_count = 0;
            selectedToShare.length = 0;
            update_share();
        }

        page = "library";

        $('body').addClass("library-page");

        $(this).one('webkitTransitionEnd transitionend', function () {
            $.mobile.changePage('map-page.html', { transition: "slide", reverse: false, changeHash: false });
        });

        $('.menu').removeClass('active');
    });

    $(document).on('click', "#home-page .third", function (event) {
        $('.menu').removeClass('active');
        event.stopPropagation();
        comingSoon();
    });

    $(document).on('MSPointerMove MSPointerUp touchmove touchend', "#home-page .main", function (event) {
        $('.menu').removeClass('active');
        event.stopPropagation();
    });
});

function splashHide() {
    if (navigator.splashscreen) navigator.splashscreen.hide();
}

var geoinit = false;
var geowait = true;
function currentGeo() {
    if (geoinit || geowait) return;
    var locationServices = window.localStorage.locationServices;
    if (locationServices !== 'false') {
        var confs = { enableHighAccuracy: true, timeout: 30000, maximumAge: 3000 };
        $.mobile.showPageLoadingMsg();
        navigator.geolocation.getCurrentPosition(onSuccess, onError, confs);
    } else onError();
    geoinit = true;
}


function isConnected() {
    if ((navigator.connection && navigator.connection.type) || ('onLine' in navigator)) {
        var connectionOk = false;
        if ((navigator.connection && navigator.connection.type != Connection.NONE && navigator.connection.type != Connection.UNKNOWN) || navigator.onLine === true) {
            connectionOk = true;
        }
    }
    return connectionOk;
}

function bootstrap2() {
    $.mobile.changePage($('#home-page'), { transition: "slide", reverse: false, changeHash: false });
    splashHide();

    if (typeof device != 'undefined' && typeof device.platform == 'string') {
        $(document.body).addClass('on-' + device.platform.toLowerCase());
    }
    geowait = false;
    currentGeo();
}

var online = false;
var discoverinit = false;
function bootstrap() {

    if (!online) {
        online = true;
        if (!discoverinit) {
            initDiscover(function () {
                discoverinit = true;
                $(document).bind('backbutton', onPressBack);
                $.mobile.pushStateEnabled = false;


                if (typeof Microsoft == 'undefined') {
                    var bingScript = document.createElement('SCRIPT');
                    bingScript.src = config.bingScriptSrc;
                    var timer = setInterval(function () {
                        if (typeof Microsoft != 'undefined' && Microsoft.Maps && typeof Microsoft.Maps.EntityCollection == 'function') {
                            pinLayer = typeof Microsoft != 'undefined' ? new Microsoft.Maps.EntityCollection() : null;
                            infoboxOptions = typeof Microsoft != 'undefined' ? { width: 10, height: 10, showCloseButton: true, zIndex: 0, offset: new Microsoft.Maps.Point(10, 0), showPointer: true } : null;
                            bootstrap2();
                            clearInterval(timer);
                            clearTimeout(timeout);
                        }
                    }, 1000);
                    var timeout = setTimeout(function () {
                        clearInterval(timer);

                        navigator.notification.alert("Unable to load Bing Maps API. Please restart the application", function () {
                            if (typeof device != 'undefined' && device.platform == 'Win32NT') {
                                cordova.exec(function () { }, function () { }, 'Terminate', 'terminate', []);
                            } else if (navigator.app && typeof navigator.app.exitApp == 'function') {
                                navigator.app.exitApp();
                            }
                        }, 'Unable to connect!');

                    }, 30000);
                    document.body.appendChild(bingScript);
                } else bootstrap2();
            });
        } else $.mobile.changePage($('#home-page'), { transition: "slide", reverse: false, changeHash: false });
    }
}

$(document).on('pageshow', '#no-network-page', function () { });

function onDeviceReady() {
    document.addEventListener("offline", function () {
        if (!isConnected()) {
            $.mobile.changePage("no-network.html", { transition: "slide", reverse: false, changeHash: false });
            online = false;
        }
        splashHide();
    }, false);

    document.addEventListener("online", bootstrap, false);

    window.addEventListener("resize", function () {
        window_height = $(window).height();
        menu_height = window_height / 3 + 1;
        $(".row").height(menu_height);
        $('#myMap').height(window_height - 121);
        $('#share-page .share-content').height(window_height - 111);
        $('#item-list').height(window_height - 130);
        $('#detail-page .ui-content').height(window_height - 60);
        $('#directions-page .ui-content').height(window_height - 60);
        $('#aboutus-page .ui-content').height(window_height - 111);
        $('#contact-page .contact-content').height(window_height - 111);
        $('#terms-page .ui-content').height(window_height - 111);
        $('#privacy-page .ui-content').height(window_height - 111);
    });

    if (isConnected()) bootstrap();
}


function initDiscover(callback) {
    if (config.allowDiscover && window.plugins && window.plugins.discover) {
        if (typeof navigator.manifest == 'undefined') {
            navigator.manifest = {
                id: 'com.caravan.range',
                version: '1.2.4'
            };
        }
        window.plugins.discover.get(navigator.manifest.id, navigator.manifest.version, typeof device != 'undefined' ? device.platform : 'browser', function () {
            if (window.plugins && window.plugins.discover && window.plugins.discover.settings) {
                socrataUrl = window.plugins.discover.settings.foodUrl || socrataUrl;
                libraryUrl = window.plugins.discover.settings.libUrl || libraryUrl;
            }
            if (!window.plugins.discover.isBlocked) callback();
        });
    } else callback();
}

if (typeof cordova == 'undefined') {
    geowait = false;
    $(function () {
        initDiscover(function () { });
    });
}
else document.addEventListener("deviceready", onDeviceReady, false);

function postAnalytics(pagename) {
    if (config.allowAnalytics) {
        $.post(config.analyticsUrl, {
            v: 1,
            tid: config.analyticsId,
            cid: 'RangeApp',
            sr: window.screen.width + 'x' + window.screen.height,
            vp: $(window).width() + 'x' + $(window).height(),
            ul: 'en-US',
            av: '1.0',
            t: 'appview',
            an: 'Range',
            cd: pagename
        });
    }
}

var usingBackButton = false;
var hist = [];
$(document).on("pageshow", function (event, ui) {
    if (usingBackButton) {
        usingBackButton = false;
    } else {
        hist.push(ui.prevPage.attr('id'));
        $.mobile.activePage.data('ui.prevPage', ui.prevPage.attr('id'));
    }

    var pagename = $.mobile.activePage.attr('data-analytics-pagename');
    if (pagename) postAnalytics(pagename);
});
function getTransition() {
    if (device.platform.toLowerCase() == "ios" && device.version[0] == "9") return undefined;
    else return 'slide';
};
function onPressBack(e) {
    var previousPage = hist && hist.length > 0 && hist[hist.length - 1];
    if (previousPage) {
        if (typeof e != 'undefined') e.preventDefault();
        usingBackButton = true;
        if (previousPage == 'home-page') $.mobile.changePage($('#home-page'), { transition: getTransition(), reverse: true, changeHash: false });
        else $.mobile.changePage(previousPage + '.html', { transition: getTransition(), reverse: true, changeHash: false });
        hist.pop();
        return false;
    } else {
        if (typeof device != 'undefined' && device.platform == 'Win32NT') {
            setTimeout(function () {
                cordova.exec(function () { }, function () { }, 'Terminate', 'terminate', []);
            }, 10);
        } else if (navigator.app && typeof navigator.app.exitApp == 'function') {
            navigator.app.exitApp();
        }
    }
}
function onSuccess(position) {

    $.mobile.hidePageLoadingMsg();

    orig_current_latitude = current_latitude = position.coords.latitude;
    orig_current_longitude = current_longitude = position.coords.longitude;

    $.mobile.hidePageLoadingMsg();
    current_address_call();
}
function onError(error) {
    console.log(error);

    $.mobile.hidePageLoadingMsg();

    var locationServices = window.localStorage.locationServices;
    if (locationServices !== 'false') {
        var message = "";
        switch (error.code) {
            case 1:
                message = "User denied Geolocation";
                break;
            case 2:
                message = "GPS position unavailable";
                break;
            case 3:
                message = "GPS timeout";
                break;
            default:
                message = "Something went wrong";
        }
        navigator.notification.alert(message, function () { }, "No GPS signal!");
    }
    else {
        navigator.notification.alert("Please turn on the GPS in your app!", function () { }, "No GPS signal!");
    }
    $.mobile.hidePageLoadingMsg();
    current_address_call();
}
function current_address_call(callback) {

    $.mobile.showPageLoadingMsg();
    $.ajax({
        url: config.mapUrl + current_latitude + "," + current_longitude + '?&output=json&jsonp=GeocodeCallback&key=' + mapkey,
        crossDomain: true,
        jsonpCallback: 'GeocodeCallback',
        dataType: "jsonp",
        success: function (data) {
            $.mobile.hidePageLoadingMsg();
            if (data.resourceSets &&
			    data.resourceSets.length > 0 &&
			    data.resourceSets[0].resources &&
			    data.resourceSets[0].resources.length > 0 &&
			    data.resourceSets[0].resources[0].address) {
                var addr = data.resourceSets[0].resources[0].address;
                orig_current_address = current_address = addr.formattedAddress;
            }
        },
        error: function () {
            navigator.notification.alert("Cannot resolve address", function () { }, "NoAddress");
            $.mobile.hidePageLoadingMsg();
        }
    }).fail(function (err) {
        navigator.notification.alert("Failed to send ajax", function () { }, "NoAddress");
        $.mobile.hidePageLoadingMsg();
    });
}

var milesToMeters = 1609.34;
var milesToKms = milesToMeters / 1000;
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function bookmark_add(status, id) {

    if (status) {
        bookmark.push(id);
        window.localStorage.setItem("bookmark", JSON.stringify(bookmark));
    }
    else {
        bookmark.splice(bookmark.indexOf(id), 1);
        window.localStorage.setItem("bookmark", JSON.stringify(bookmark));
    }

}
function getbookmark() {
    var tmpbmk = localStorage.getItem("bookmark");
    if (tmpbmk != null)
        bookmark = JSON.parse(tmpbmk);
    else
        bookmark = new Array();
}
function get_hrs(place) {
    if (typeof place == 'number') place = places[place];

    var hrs = "";
    var meal_type = place.meal_types;
    if (!meal_type) return '';
    var meal_type = meal_type.split(', ');

    if (meal_type[0] == "B") {
        hrs = "8am - ";
    }
    else if (meal_type[0] == "L") {
        hrs = "11am - ";
    }
    else if (meal_type[0] == "D") {
        hrs = "3am - ";
    }
    else if (meal_type[0] == "PM") {
        hrs = "3am - ";
    }
    else if (meal_type[0] == "S") {
        hrs = "8am - ";
    }


    if (meal_type[meal_type.length - 1] == "B") {
        hrs += "11am";
    }
    else if (meal_type[meal_type.length - 1] == "L") {
        hrs += "2pm";
    }
    else if (meal_type[meal_type.length - 1] == "D") {
        hrs += "7pm";
    }
    else if (meal_type[meal_type.length - 1] == "PM") {
        hrs += "7pm";
    }
    else if (meal_type[meal_type.length - 1] == "S") {
        hrs += "11am";
    }

    return hrs;
}

var daysOfWeek = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];
function get_place_status(place) {
    var now = new Date();

    if (place.start_date) {
        var start = new Date(place.start_date);
        var coming = new Date(place.start_date);
        coming.setMonth(coming.getMonth() - 1);

        if (now > coming && now < start) {
            return 'comingsoon';
        } else {
            if (place.days_of_operation) {
                var day = daysOfWeek[now.getDay()];
                var doo = place.days_of_operation.toLowerCase();
                if (doo.indexOf(day) < 0) return 'closed';
            }

            if ((place.breakfast_start_time && place.breakfast_end_time) ||
                (place.lunch_start_time && place.lunch_end_time) ||
                (place.snack_start_time && place.snack_end_time) ||
                (place.dinner_start_time && place.dinner_end_time)) {
                var time = now.toTimeString().split(' ', 1)[0].split(':').slice(0, 2).join(':');

                if (place.breakfast_start_time && place.breakfast_end_time && time >= convertTo24Hour(place.breakfast_start_time) && time <= convertTo24Hour(place.breakfast_end_time)) return 'open';
                if (place.lunch_start_time && place.lunch_end_time && time >= convertTo24Hour(place.lunch_start_time) && time <= convertTo24Hour(place.lunch_end_time)) return 'open';
                if (place.snack_start_time && place.snack_end_time && time >= convertTo24Hour(place.snack_start_time) && time <= convertTo24Hour(place.snack_end_time)) return 'open';
                if (place.dinner_start_time && place.dinner_end_time && time >= convertTo24Hour(place.dinner_start_time) && time <= convertTo24Hour(place.dinner_end_time)) return 'open';

                return 'closed';
            }

            if ((place.monday_open && place.monday_close) ||
                (place.tuesday_open && place.tuesday_close) ||
                (place.wednesday_open && place.wednesday_close) ||
                (place.thursday_open && place.thursday_close) ||
                (place.friday_open && place.friday_close) ||
                (place.saturday_open && place.saturday_close) ||
                (place.sunday_open && place.sunday_close)) {

                var time = now.toTimeString().split(' ', 1)[0].split(':').slice(0, 2).join(':');
                var day = daysOfWeek[now.getDay()];

                if (day == 'm' && place.monday_open && place.monday_close && time >= convertTo24Hour(place.monday_open) && time <= convertTo24Hour(place.monday_close)) return 'open';
                if (day == 'tu' && place.tuesday_open && place.tuesday_close && time >= convertTo24Hour(place.tuesday_open) && time <= convertTo24Hour(place.tuesday_close)) return 'open';
                if (day == 'w' && place.wednesday_open && place.wednesday_close && time >= convertTo24Hour(place.wednesday_open) && time <= convertTo24Hour(place.wednesday_close)) return 'open';
                if (day == 'th' && place.thursday_open && place.thursday_close && time >= convertTo24Hour(place.thursday_open) && time <= convertTo24Hour(place.thursday_close)) return 'open';
                if (day == 'f' && place.friday_open && place.friday_close && time >= convertTo24Hour(place.friday_open) && time <= convertTo24Hour(place.friday_close)) return 'open';
                if (day == 'sa' && place.saturday_open && place.saturday_close && time >= convertTo24Hour(place.saturday_open) && time <= convertTo24Hour(place.saturday_close)) return 'open';
                if (day == 'su' && place.sunday_open && place.sunday_close && time >= convertTo24Hour(place.sunday_open) && time <= convertTo24Hour(place.sunday_close)) return 'open';

                return 'closed';
            }

            if (place.meal_types) {
                var d = new Date();
                var n = d.getDay();

                var hrs = get_hrs(place);
                n = d.getHours();
                var tmp = hrs.split(' - ');
                tmp[0] = convertTo24Hour(tmp[0]);
                tmp[1] = convertTo24Hour(tmp[1]);
                if (tmp[0] <= n && tmp[1] >= n)
                    return 'open';
                else
                    return 'closed';
            }

            return 'unknown';
        }
    } else return 'unknown';
}

function get_open_close(key) {
    var status = get_place_status(places[key]);
    switch (status) {
        case 'open': return 'OPEN';
        case 'comingsoon': return '<span style="color:#e46c0a;">COMING SOON</span>';
        case 'unknown': return '<span style="color:#8a8a8a; font-size: 0.9em;">CALL SITE</span>';
        case 'closed': return '<span style="color:#e3322e"></span>';
    }

    return '<span style="color:#8a8a8a; font-size: 0.9em;">CALL SITE</span>';
}

function get_pin_icon(place) {
    return 'images/pin-closed.png';

    var status = get_place_status(place);
    switch (status) {
        case 'open': return 'images/pin-open.png';
        case 'comingsoon': return 'images/pin-comingsoon.png';
        case 'unknown': return 'images/pin-unknown.png';
        case 'closed': return 'images/pin-closed.png';
    }

    return 'images/pin-unknown.png';
}

function convertTo24Hour(time) {
    if (typeof time == 'undefined') return '-';
    var splitted = time.split(':');
    if (splitted.length != 2) return '-';
    var h = parseInt(splitted[0], 10), m = parseInt(splitted[1], 10);
    if (typeof h != 'number' || typeof m != 'number') return '-';
    if (splitted[1].trim().toLowerCase().indexOf('pm') > -1 && h != 12) h += 12;
    return ((h < 10) ? ("0" + h) : h) + ':' + ((m < 10) ? ("0" + m) : m);
}

var messageType;
var messageBody;
function email_message() {
    var body_html = "Hi,<br><br>I am sharing with you basic needs services in your area via RANGE.<br><br>";
    $.each(places, function (key, val) {
        if (places[key].select == 1) {
            body_html += (places[key].site_name || '') + "<br>" + (places[key].site_street_address ? places[key].site_street_address + ',<br>' : '') + (places[key].site_city ? (places[key].site_city + ', ') : '') + (places[key].site_state || '') + ' ' + (places[key].site_zip || '') + (places[key].site_phone ? "<br>Phone: " + places[key].site_phone : '') + (places[key].site_description ? '<br>' + places[key].site_description : '') + "<br><br>";
            places[key].select = 0;
        }
    });

    var now = new Date();
    var d = moment(now).format('MM/DD/YYYY');
    body_html += "Lunch sites change regularly. Please check Range to find the latest information. This list was made on " + d + ".";

    share_count = 0;
    selectedToShare.length = 0;
    $(".sharepanel").height(0);
    update_share();

    messageBody = body_html;
    messageType = 'email-text';

    $.mobile.changePage("share-page.html", { transition: "slide", reverse: false, changeHash: false });
}
function sms_message() {
    var body_html = "Hi,<br /><br />I am sharing with you basic needs services in your area via RANGE.<br /><br />";
    var counter = 1;
    $.each(places, function (key, val) {
        if (places[key].select == 1) {
            body_html += counter + ". " + (places[key].site_name || '') + "\n" + (places[key].site_street_address ? places[key].site_street_address + ',\n' : '') + (places[key].site_city ? (places[key].site_city + ', ') : '') + (places[key].site_state || '') + ' ' + (places[key].site_zip || '') + (places[key].site_phone ? "\nPhone: " + places[key].site_phone : '') + "\n\n";
            counter++;
            places[key].select = 0;
        }
    });
    body_html += 'Hunger Hotline: 1-866-348-6479';

    share_count = 0;
    selectedToShare.length = 0;
    $(".sharepanel").height(0);
    update_share();

    messageBody = body_html;
    messageType = 'sms-text';

    $.mobile.changePage("share-page.html", { transition: "slide", reverse: false, changeHash: false });
}

$(document).on('pageshow', '#share-page', function (e, data) {
    $('#share-page .sms-text, #share-page .email-text').hide();
    $('#share-page .' + (messageType || 'unknown')).show();

    $("#share-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack(event);
        return false;
    });

    $('#share-page .share-content').height(window_height - 111);

    $('#share-body').html(messageBody || '');
    $('#share-body').niceScroll();

    var send = function (e) {
        e.preventDefault();

        $.mobile.showPageLoadingMsg();
        if (messageType == 'sms-text') {

            var regex = /<br\s*[\/]?>/gi;
            messageBody = (messageBody.replace(regex, "\n"));

            if ($('#share-page #phone:invalid').length > 0) {
                $.mobile.hidePageLoadingMsg();
                navigator.notification.alert('Invalid phone number', function () { }, 'Range');
                return false;
            }
            if (!$('#share-page #phone').val()) {
                $.mobile.hidePageLoadingMsg();
                navigator.notification.alert('Phone number is required', function () { }, 'Range');
                return false;

            }
            $.ajax({
                url: serverUrl + '/share/sms',
                type: 'POST',
                data: {
                    To: $('#share-page #phone').val(),
                    Body: messageBody
                },
                success: function (data) {
                    postAnalytics('Twilio share');
                    $.mobile.hidePageLoadingMsg();
                    navigator.notification.alert('Message sent successfully', function () {
                        onPressBack();
                    }, 'Range');
                }
            }).fail(function (err) {
                $.mobile.hidePageLoadingMsg();
                navigator.notification.alert('Could not send message', function () { }, 'Range');
                console.log(arguments);
                console.log(JSON.stringify(err));
            });
        } else if (messageType == 'email-text') {
            if ($('#share-page #email:invalid').length > 0) {
                $.mobile.hidePageLoadingMsg();
                navigator.notification.alert('Invalid email address', function () { }, 'Range');
                return false;
            }
            $.ajax({
                url: serverUrl + '/share/mail',
                type: 'POST',
                data: {
                    to: $('#share-page #email').val(),
                    html: messageBody
                },
                dataType: 'json',
                success: function (data) {
                    postAnalytics('SendGrid share');
                    $.mobile.hidePageLoadingMsg();
                    navigator.notification.alert('Message sent successfully', function () {
                        onPressBack();
                    }, 'Range');
                }
            }).fail(function (err) {
                $.mobile.hidePageLoadingMsg();
                navigator.notification.alert('Could not send message', function () { }, 'Range');
                console.log(arguments);
                console.log(JSON.stringify(err));
            });
        } else {
            navigator.notification.alert('Unknown share type', function () { }, 'Range');
        }

        return false;
    };

    $('#share-page .sbtn').click(send);
    $('#share-page #phone-form, #share-page #email-form').on('submit', send);
});

$(document).ready(function () {

    window_height = $(window).height();
    window_width = $(window).width();
    menu_height = window_height / 3 + 1;
    $(".row").height(menu_height);
    $(".row").css("margin-top", "0px");

});

$(document).on('pagebeforeshow', '#home-page', function (e, data) {
    $(".row").height(menu_height);
    $(".row").css("margin-top", "0px");

    $('#home-page .first').show();
    $('#home-page .second').show();
    $('#home-page .third').show();

    $(".row.first").one('webkitTransitionEnd transitionend', currentGeo);
    $(".row.second").one('webkitTransitionEnd transitionend', currentGeo);
    $(".row.third").one('webkitTransitionEnd transitionend', currentGeo);

    $('.home-menu').addClass('init');

    if (bookmark.length == 0) {
        getbookmark();
    }
});

var showPopup = true;
var returnTo;
$(document).on('pageshow', '#map-page', function (e, data) {
    $('#myMap').html('');

    $("#map-page .sharepanel").height(0);
    update_share();

    if (page == "bookmark") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-color.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else if (page == "library") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-color.png');
    }
    else if (page == "food") {
        $('.header-food-icon').attr('src', 'images/food-color.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }

    var mapOptions = {
        credentials: mapkey,
        center: new Microsoft.Maps.Location(current_latitude, current_longitude),
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        zoom: 15,
        enableClickableLogo: false,
        enableSearchLogo: false,
        showScalebar: false,
        showDashboard: false,
        showMapTypeSelector: false
    };

    $('#myMap').height(window_height - 121);
    map = new Microsoft.Maps.Map(document.getElementById('myMap'), mapOptions);
    setTimeout(function () {
        map = new Microsoft.Maps.Map(document.getElementById('myMap'), mapOptions);

        defaultInfobox = new Microsoft.Maps.Infobox(map.getCenter(), infoboxOptions);
        defaultInfobox.setOptions({ visible: false });

        map_pin();
    }, 100);

    $("#map-page .filterbtn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("filter-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#map-page .listbtn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("list-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#map-page .sharebtn").click(function (event) {
        event.stopPropagation();
        if ($("#map-page .sharepanel").height() > 0) {
            $("#map-page .sharepanel").stop().animate({
                height: 0,
            }, 1000, null);
        }
        else {
            $("#map-page .sharepanel").stop().animate({
                height: 55,
            }, 1000, function () {
                if (device && device.platform == "Android") {
                    var map = $("#myMap, #item-list");
                    map.css("z-index", "-99999");
                    setTimeout(function () {
                        map.css("z-index", "auto");
                    }, 10);
                }
            });
        }

    });
    $("#map-page .app-icon").click(function (event) {
        event.stopPropagation();

        $('#home-page .first').show();
        $('#home-page .second').show();
        $('#home-page .third').show();

        $.mobile.changePage($('#home-page'), { transition: getTransition(), reverse: true, changeHash: false });

        return false;
    });

    $("#map-page .header-bookmark-icon").click(function (event) {

        event.stopPropagation();

        if (page == "bookmark") {
            page = returnTo;
            $('body').removeClass("bookmark-page");
        }
        else {
            returnTo = page;
            page = "bookmark";
            $('body').addClass("bookmark-page");
        }
        map.entities.clear();
        map_pin();
        return false;
    });
    $("#map-page .header-food-icon").click(function (event) {
        if (page != "food") {
            event.stopPropagation();

            if (returnTo != 'food') {
                share_count = 0;
                selectedToShare.length = 0;
                update_share();
            }
            page = "food";

            $('body').addClass("food-page");
            $('body').removeClass("library-page");
            $('body').removeClass("bookmark-page");

            places.length = 0;
            map.entities.clear();
            pinLayer = new Microsoft.Maps.EntityCollection();
            map_pin();
        }
        return false;
    });
    $("#map-page .header-shelter-icon").click(function (event) {
        if (page != "library") {
            event.stopPropagation();

            if (returnTo != 'library') {
                share_count = 0;
                selectedToShare.length = 0;
                update_share();
            }
            page = "library";

            $('body').addClass("library-page");
            $('body').removeClass("food-page");
            $('body').removeClass("bookmark-page");

            places.length = 0;
            map.entities.clear();
            pinLayer = new Microsoft.Maps.EntityCollection();
            map_pin();
        }
        return false;
    });
    $("#map-page .header-medical-icon").click(function (event) {
        event.stopPropagation();
        comingSoon();
        return false;
    });

    $("#map-page .email .ui-btn").click(function (event) {
        event.stopPropagation();
        email_message();
        defaultInfobox.setOptions({ visible: false });
        return false;
    });

    $("#map-page .sms .ui-btn").click(function (event) {
        event.stopPropagation();
        sms_message();
        defaultInfobox.setOptions({ visible: false });
        return false;
    });

    $('#locate-me')[window.locationServices == 'false' ? 'hide' : 'show']();
    $('#locate-me').click(function () {

        current_latitude = orig_current_latitude;
        current_longitude = orig_current_longitude;
        current_address = orig_current_address;

        listCache = '';
        map_pin();
    });

});

function map_pin() {
    if (page == "bookmark") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-color.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else if (page == "library") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-color.png');
    }
    else if (page == "food") {
        $('.header-food-icon').attr('src', 'images/food-color.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }

    var now = new Date();
    var startDate = new Date(now);
    var endDate = new Date(now);
    startDate.setMonth(startDate.getMonth() + 2);
    endDate.setMonth(endDate.getMonth() + 1);

    var start = moment(startDate).format('YYYY-MM-DD');
    var end = moment(endDate).format('YYYY-MM-DD');
    var searchRadius = 40 * milesToMeters;

    var storageKey = page + '_places_v3';

    var urlToUse;
    if (page == "food") { urlToUse = socrataUrl; }
    else if (page == "library") { urlToUse = libraryUrl; }

    var select;
    if (page == "food") { select = socrataFields.toString(); }
    else if (page == "library") { select = libraryFields.toString(); }

    var where = '((start_date <= \'' + start + '\' AND end_date >= \'' + end + '\') OR start_date IS NULL OR end_date IS NULL) AND within_circle(coordinates, ' + current_latitude + ', ' + current_longitude + ', ' + searchRadius + ')';

    var fn = function () {
        if (places.length == 0) {
            $.mobile.showPageLoadingMsg();

            var ts = -1;
            var loadFn = function () {
                $.ajax({
                    url: urlToUse,
                    dataType: "json",
                    headers: typeof device == 'undefined' ? {
                    } : {
                        'X-App-Token': xAppToken,
                    },

                    data: {
                        $offset: places.length,
                        $$app_token: typeof device == 'undefined' ? xAppToken : undefined,
                        $select: select,
                        $where: where
                    },
                    success: function (data) {
                        share_count = 0;
                        $.each(data, function (key, val) {
                            if (ts < val[':updated_at']) ts = val[':updated_at'];

                            if (jQuery.inArray(val.serialno, bookmark) == -1) { val.bookmark = 0; }
                            else { val.bookmark = 1; }

                            if (jQuery.inArray(val.serialno, selectedToShare) == -1) { val.select = 0; }
                            else { val.select = 1; share_count++; }

                            places.push(val);
                            if ((distance * milesToKms) >= getDistanceFromLatLonInKm(current_latitude, current_longitude, val.coordinates.latitude, val.coordinates.longitude)) {
                                var pin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(val.coordinates.latitude, val.coordinates.longitude), { draggable: false, icon: get_pin_icon(val), width: 31, height: 50 });
                                pin.data = places.length - 1;
                                Microsoft.Maps.Events.addHandler(pin, 'click', displayInfobox);
                                pinLayer.push(pin);
                            }
                        });

                        if (data.length == 1000) loadFn();
                        else {
                            if (places.length > 0) {
                                window.localStorage[storageKey] = JSON.stringify(places);
                                window.localStorage[storageKey + '_timestamp'] = ts;
                                window.localStorage[storageKey + '_start_date'] = start;
                                window.localStorage[storageKey + '_end_date'] = end;
                                window.localStorage[storageKey + '_latitude'] = current_latitude;
                                window.localStorage[storageKey + '_longitude'] = current_longitude;
                            }

                            $.mobile.hidePageLoadingMsg();
                            map.entities.push(pinLayer);
                            var entityCollectionInfoBox = new Microsoft.Maps.EntityCollection({ zIndex: 2000 });
                            entityCollectionInfoBox.push(defaultInfobox);
                            Microsoft.Maps.Events.addHandler(map, 'click', displayInfobox);
                            map.entities.push(entityCollectionInfoBox);

                            if ($.mobile.activePage.attr('id') == 'list-page') {
                                listCache = '';
                                list_page();
                            }

                            map.setView({ center: new Microsoft.Maps.Location(current_latitude, current_longitude) });

                        }
                    }
                }).fail(function () {
                    $.mobile.hidePageLoadingMsg();
                    map.entities.push(pinLayer);
                    var entityCollectionInfoBox = new Microsoft.Maps.EntityCollection({ zIndex: 2000 });
                    entityCollectionInfoBox.push(defaultInfobox)
                    map.entities.push(entityCollectionInfoBox);
                    share_count = 0;
                    selectedToShare.length = 0;
                    update_share();

                    navigator.notification.alert('Server not available, please try again later.', function () { }, 'Range');

                });
            };

            loadFn();
        }
        else {
            pinLayer = new Microsoft.Maps.EntityCollection();
            $.each(places, function (key, val) {

                if (page == "bookmark") {
                    if (jQuery.inArray(val.serialno, bookmark) != -1) {
                        var pin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(val.coordinates.latitude, val.coordinates.longitude), { draggable: false, icon: get_pin_icon(val), width: 31, height: 50 });
                        pin.data = key;
                        Microsoft.Maps.Events.addHandler(pin, 'click', displayInfobox);
                        pinLayer.push(pin);
                    }
                }
                else {
                    if ((distance * milesToKms) >= getDistanceFromLatLonInKm(current_latitude, current_longitude, val.coordinates.latitude, val.coordinates.longitude)) {
                        if (open_status == "open") {
                            if (get_open_close(key) == "OPEN") {
                                var pin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(val.coordinates.latitude, val.coordinates.longitude), { draggable: false, icon: get_pin_icon(val), width: 31, height: 50 });
                                pin.data = key;
                                Microsoft.Maps.Events.addHandler(pin, 'click', displayInfobox);
                                pinLayer.push(pin);
                            }
                        }
                        else {
                            var pin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(val.coordinates.latitude, val.coordinates.longitude), { draggable: false, icon: get_pin_icon(val), width: 31, height: 50 });
                            pin.data = key;
                            Microsoft.Maps.Events.addHandler(pin, 'click', displayInfobox);
                            pinLayer.push(pin);
                        }
                    }
                }

            });
            Microsoft.Maps.Events.addHandler(map, 'click', displayInfobox);
            map.entities.clear();
            map.entities.push(pinLayer);
            var entityCollectionInfoBox = new Microsoft.Maps.EntityCollection({ zIndex: 2000 });
            entityCollectionInfoBox.push(defaultInfobox)
            map.entities.push(entityCollectionInfoBox);
            map.setView({ center: new Microsoft.Maps.Location(current_latitude, current_longitude) });

            share_count = 0;
            $.each(places, function (key, val) {
                if (jQuery.inArray(val.serialno, bookmark) == -1) { val.bookmark = 0; }
                else { val.bookmark = 1; }

                if (jQuery.inArray(val.serialno, selectedToShare) == -1) { val.select = 0; }
                else { val.select = 1; share_count++; }
            });

            update_share();

            if ($.mobile.activePage.attr('id') == 'list-page') {
                listCache = '';
                list_page();
            }
        }
    };

    if (!places) places = new Array();

    if (places.length > 0 && window.localStorage[storageKey + '_latitude'] && window.localStorage[storageKey + '_longitude']) {
        var dist = getDistanceFromLatLonInKm(current_latitude, current_longitude, window.localStorage[storageKey + '_latitude'], window.localStorage[storageKey + '_longitude']);
        if ((dist * 1000 > 40 * milesToMeters) && places.length) {
            listCache = '';
            places.length = 0;
            return fn();
        }
    }

    if (places.length == 0 && window.localStorage[storageKey] && window.localStorage[storageKey + '_timestamp']) {
        var failFn = function () {
            $.mobile.hidePageLoadingMsg();
            map.entities.push(pinLayer);
            var entityCollectionInfoBox = new Microsoft.Maps.EntityCollection({ zIndex: 2000 });
            entityCollectionInfoBox.push(defaultInfobox)
            map.entities.push(entityCollectionInfoBox);
            share_count = 0;
            update_share();

            navigator.notification.alert('Server not available, please try again later.', function () { }, 'Range');
        };

        var now = new Date();

        $.ajax({
            url: urlToUse,
            dataType: "json",
            headers: typeof device == 'undefined' ? {

            } : {
                'X-App-Token': xAppToken,
            },
            data: {
                $$app_token: typeof device == 'undefined' ? xAppToken : undefined,
                $select: ':updated_at',
                $order: ':updated_at DESC',
                $limit: 1
            },
            success: function (data) {
                if (data.length && +window.localStorage[storageKey + '_timestamp'] < data[0][':updated_at']) {
                    listCache = '';
                    if (places.length) places.length = 0;
                    return fn();
                }

                if (places.length == 0) {
                    try {
                        places = JSON.parse(window.localStorage[storageKey]);
                    } catch (err) {
                        window.localStorage.removeItem(storageKey);
                        window.localStorage.removeItem(storageKey + '_timestamp');
                        places = new Array();
                    }
                }

                var dist = getDistanceFromLatLonInKm(current_latitude, current_longitude, window.localStorage[storageKey + '_latitude'], window.localStorage[storageKey + '_longitude']);
                if (dist * 1000 <= 40 * milesToMeters) return fn();

                $.ajax({
                    url: urlToUse,
                    dataType: "json",
                    headers: typeof device == 'undefined' ? {

                    } : {
                        'X-App-Token': xAppToken,
                    },
                    data: {
                        $$app_token: typeof device == 'undefined' ? xAppToken : undefined,
                        $select: 'COUNT(site_name) as count',
                        $where: where
                    },
                    success: function (data) {
                        var count = data.length ? data[0].count : 0;
                        if (places.length != count) places.length = 0;
                        fn();
                    }
                }).fail(failFn);
            }
        }).fail(failFn);
    } else fn();

    var pin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(orig_current_latitude, orig_current_longitude), { draggable: false, icon: 'images/pos.png', width: 32, height: 32 });
    pinLayer.push(pin);
    defaultInfobox.setOptions({ visible: false });
}

function hour24to12(time) {
    if (!(/^([0-9]{2}):([0-9]{2})$/.test(time))) return time;
    var t = time.split(':', 2);
    var hours = t[0];
    var minutes = t[1];
    var postfix = 'AM';

    if (hours >= 12) {
        hours = ('00' + (hours - 11)).slice(-2);
        postfix = 'PM';
    } else if (hours == 0 && minutes == 0) {
        hours = '12';
        postfix = 'MN';
    } else if (hours == 0) {
        hours = '12';
    }

    return hours.replace(new RegExp('^0*'), '') + ':' + minutes + ' ' + postfix;
}

function get_timeformat_from_string(timestring) {
    var time = '';
    var postfix = 'am';
    timestring = timestring || '';
    timestring = timestring.split(':');
    if (timestring.length >= 2) {
        if (parseInt(timestring[0]) > 12) {
            postfix = 'pm';
            time += parseInt(timestring[0]) - 12;
        }
        else {
            time += timestring[0];
        }

        if (timestring[1].split(' ').length >= 2) {
            time += timestring[1].split(' ')[0] == '00' ? '' : (':' + timestring[1].split(' ')[0]);
            postfix = timestring[1].split(' ')[1];
        }
        time += postfix;
    }

    return time;
}

function get_place_description(place) {
    var html = '';

    if (place.days_of_operation) {
        html += 'Open: ' + place.days_of_operation;
    }

    if (place.breakfast_start_time && place.breakfast_end_time) {
        html += (html ? '<br>' : '') + 'Breakfast from ' + hour24to12(place.breakfast_start_time) + ' to ' + hour24to12(place.breakfast_end_time);
    }

    if (place.lunch_start_time && place.lunch_end_time) {
        html += (html ? '<br>' : '') + 'Lunch from ' + hour24to12(place.lunch_start_time) + ' to ' + hour24to12(place.lunch_end_time);
    }

    if (place.snack_start_time && place.snack_end_time) {
        html += (html ? '<br>' : '') + 'Snack from ' + hour24to12(place.snack_start_time) + ' to ' + hour24to12(place.snack_end_time);
    }

    if (place.dinner_start_time && place.dinner_end_time) {
        html += (html ? '<br>' : '') + 'Dinner from ' + hour24to12(place.dinner_start_time) + ' to ' + hour24to12(place.dinner_end_time);
    }

    if (get_timeformat_from_string(place.monday_open) && get_timeformat_from_string(place.monday_close)) {
        html += (html ? '<br>' : '') + 'Mon ' + get_timeformat_from_string(place.monday_open) + '-' + get_timeformat_from_string(place.monday_close);
    }
    else if (place.monday_open || place.monday_close) {
        html += (html ? '<br>' : '') + 'Mon ' + (place.monday_open || place.monday_close);
    }

    if (get_timeformat_from_string(place.tuesday_open) && get_timeformat_from_string(place.tuesday_close)) {
        html += (html ? '<br>' : '') + 'Tue ' + get_timeformat_from_string(place.tuesday_open) + '-' + get_timeformat_from_string(place.tuesday_close);
    }
    else if (place.tuesday_open || place.tuesday_close) {
        html += (html ? '<br>' : '') + 'Tue ' + (place.tuesday_open || place.tuesday_close);
    }

    if (get_timeformat_from_string(place.wednesday_open) && get_timeformat_from_string(place.wednesday_close)) {
        html += (html ? '<br>' : '') + 'Wed ' + get_timeformat_from_string(place.wednesday_open) + '-' + get_timeformat_from_string(place.wednesday_close);
    }
    else if (place.wednesday_open || place.wednesday_close) {
        html += (html ? '<br>' : '') + 'Wed ' + (place.wednesday_open || place.wednesday_close);
    }

    if (get_timeformat_from_string(place.thursday_open) && get_timeformat_from_string(place.thursday_close)) {
        html += (html ? '<br>' : '') + 'Thu ' + get_timeformat_from_string(place.thursday_open) + '-' + get_timeformat_from_string(place.thursday_close);
    }
    else if (place.thursday_open || place.thursday_close) {
        html += (html ? '<br>' : '') + 'Thu ' + (place.thursday_open || place.thursday_close);
    }

    if (get_timeformat_from_string(place.friday_open) && get_timeformat_from_string(place.friday_close)) {
        html += (html ? '<br>' : '') + 'Fri ' + get_timeformat_from_string(place.friday_open) + '-' + get_timeformat_from_string(place.friday_close);
    }
    else if (place.friday_open || place.friday_close) {
        html += (html ? '<br>' : '') + 'Fri ' + (place.friday_open || place.friday_close);
    }

    if (get_timeformat_from_string(place.saturday_open) && get_timeformat_from_string(place.saturday_close)) {
        html += (html ? '<br>' : '') + 'Sat ' + get_timeformat_from_string(place.saturday_open) + '-' + get_timeformat_from_string(place.saturday_close);
    }
    else if (place.saturday_open || place.saturday_close) {
        html += (html ? '<br>' : '') + 'Sat ' + (place.saturday_open || place.saturday_close);
    }

    if (get_timeformat_from_string(place.sunday_open) && get_timeformat_from_string(place.sunday_close)) {
        html += (html ? '<br>' : '') + 'Sun ' + get_timeformat_from_string(place.sunday_open) + '-' + get_timeformat_from_string(place.sunday_close);
    }
    else if (place.sunday_open || place.sunday_close) {
        html += (html ? '<br>' : '') + 'Sun ' + (place.sunday_open || place.sunday_close);
    }

    return html;
}

function get_place_description_short(place) {
    var html = '';

    if (place.days_of_operation) {
        html += 'Open: ' + place.days_of_operation;
    }

    var meals = '';
    if (place.breakfast_start_time && place.breakfast_end_time) {
        meals += (meals ? ', ' : '') + 'Breakfast';
    }

    if (place.lunch_start_time && place.lunch_end_time) {
        meals += (meals ? ', ' : '') + 'Lunch';
    }

    if (place.snack_start_time && place.snack_end_time) {
        meals += (meals ? ', ' : '') + 'Snack';
    }

    if (place.dinner_start_time && place.dinner_end_time) {
        meals += (meals ? ', ' : '') + 'Dinner';
    }

    if (meals) html += (html ? '<br>' : '') + meals;

    if (get_timeformat_from_string(place.monday_open) && get_timeformat_from_string(place.monday_close)) {
        html += (html ? '<br>' : '') + 'Mon ' + get_timeformat_from_string(place.monday_open) + '-' + get_timeformat_from_string(place.monday_close);
    }
    else if (place.monday_open || place.monday_close) {
        html += (html ? '<br>' : '') + 'Mon ' + (place.monday_open || place.monday_close);
    }

    if (get_timeformat_from_string(place.tuesday_open) && get_timeformat_from_string(place.tuesday_close)) {
        html += (html ? '<br>' : '') + 'Tue ' + get_timeformat_from_string(place.tuesday_open) + '-' + get_timeformat_from_string(place.tuesday_close);
    }
    else if (place.tuesday_open || place.tuesday_close) {
        html += (html ? '<br>' : '') + 'Tue ' + (place.tuesday_open || place.tuesday_close);
    }

    if (get_timeformat_from_string(place.wednesday_open) && get_timeformat_from_string(place.wednesday_close)) {
        html += (html ? '<br>' : '') + 'Wed ' + get_timeformat_from_string(place.wednesday_open) + '-' + get_timeformat_from_string(place.wednesday_close);
    }
    else if (place.wednesday_open || place.wednesday_close) {
        html += (html ? '<br>' : '') + 'Wed ' + (place.wednesday_open || place.wednesday_close);
    }

    if (get_timeformat_from_string(place.thursday_open) && get_timeformat_from_string(place.thursday_close)) {
        html += (html ? '<br>' : '') + 'The ' + get_timeformat_from_string(place.thursday_open) + '-' + get_timeformat_from_string(place.thursday_close);
    }
    else if (place.thursday_open || place.thursday_close) {
        html += (html ? '<br>' : '') + 'The ' + (place.thursday_open || place.thursday_close);
    }

    if (get_timeformat_from_string(place.friday_open) && get_timeformat_from_string(place.friday_close)) {
        html += (html ? '<br>' : '') + 'Fri ' + get_timeformat_from_string(place.friday_open) + '-' + get_timeformat_from_string(place.friday_close);
    }
    else if (place.friday_open || place.friday_close) {
        html += (html ? '<br>' : '') + 'Fri ' + (place.friday_open || place.friday_close);
    }

    if (get_timeformat_from_string(place.saturday_open) && get_timeformat_from_string(place.saturday_close)) {
        html += (html ? '<br>' : '') + 'Sat ' + get_timeformat_from_string(place.saturday_open) + '-' + get_timeformat_from_string(place.saturday_close);
    }
    else if (place.saturday_open || place.saturday_close) {
        html += (html ? '<br>' : '') + 'Sat ' + (place.saturday_open || place.saturday_close);
    }

    if (get_timeformat_from_string(place.sunday_open) && get_timeformat_from_string(place.sunday_close)) {
        html += (html ? '<br>' : '') + 'Sun ' + get_timeformat_from_string(place.sunday_open) + '-' + get_timeformat_from_string(place.sunday_close);
    }
    else if (place.sunday_open || place.sunday_close) {
        html += (html ? '<br>' : '') + 'Sun ' + (place.sunday_open || place.sunday_close);
    }

    return html;
}

var waitForView = false;
function displayInfobox(e) {
    if (e.targetType == "pushpin") {
        var pin = e.target;

        var key = pin.data;
        var bsrc = "";
        var ssrc = "";

        if (places[key] && places[key].bookmark)
            bsrc = "images/item_bookmark_color.png";
        else
            bsrc = "images/item_bookmark_gray.png";
        if (places[key] && places[key].select)
            ssrc = "images/item_select_color.png";
        else
            ssrc = "images/item_select_gray.png";

        if (places[key]) {
            var html = '<div class="infobox"><div class="infobox_title">' + (places[key].site_name || '') + '</div><div class="infobox-close">x</div>' +
                '<div class="infobox_content">' +
                    '<div class="infobox_address"><span>' + (places[key].site_street_address || '') + ',<br/>' + (places[key].site_city ? (places[key].site_city + ', ') : '') + (places[key].site_state || '') + ' ' + (places[key].site_zip || '') + '</span></div>' +
                    '<div class="infobox_status">' +
                        '<div class="infobox_open">' + get_open_close(key) + '</div>' +
                        '<div class="infobox_hr">' + (get_place_description_short(places[key]) || (places[key].meal_types ? 'Hrs: ' + get_hrs(places[key]) + '<br/>M-Fri' : '')) + '</div>' +
                    '</div>' +
                    '<div class="infobox_btn"><span class="infobox_btn_bookmark"><img src="' + bsrc + '"/></span><span class="infobox_btn_select"><img src="' + ssrc + '"/></span></div>' +
                '</div>' +
            '</div>';

            defaultInfobox.setHtmlContent(html);
            defaultInfobox.setLocation((pin.getLocation()));
            defaultInfobox.setOptions({ visible: true });
            map.setView({ center: pin.getLocation() });
            waitForView = true;
            setTimeout(function () { waitForView = false }, 500);
        }

        $(".infobox").click(function (event) {
            current_place = key;
            event.stopPropagation();
            $.mobile.changePage("detail-page.html", { transition: "slide", reverse: false, changeHash: false });
            return false;
        });

        $(".infobox-close").click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            defaultInfobox.setOptions({ visible: false });
            return false;
        });

        $(".infobox_btn_bookmark").click(function (event) {
            event.stopPropagation();
            if (places[key].bookmark) {
                $(".infobox_btn_bookmark img").attr('src', 'images/item_bookmark_gray.png');
                places[key].bookmark = 0;

            }
            else {
                $(".infobox_btn_bookmark img").attr('src', 'images/item_bookmark_color.png');
                places[key].bookmark = 1;

            }
            bookmark_add(places[key].bookmark, places[key].serialno);
        });

        $(".infobox_btn_select").click(function (event) {
            event.stopPropagation();
            if (places[key].select) {

                selectedToShare.splice(selectedToShare.indexOf(places[key].serialno), 1);

                $(".infobox_btn_select img").attr('src', 'images/item_select_gray.png');
                places[key].select = 0;
                share_count = selectedToShare.length;
                listCache = '';
            }
            else {

                selectedToShare.push(places[key].serialno);

                $(".infobox_btn_select img").attr('src', 'images/item_select_color.png');

                places[key].select = 1;
                share_count = selectedToShare.length;
                listCache = '';
            }
            update_share();
        });
    }
    else {
        if (!waitForView) defaultInfobox.setOptions({ visible: false });
    }
}
function update_share() {
    if (share_count) {
        $(".share_count").show();
        $(".share_count").html(share_count);
    }
    else {
        listCache = '';
        $(".share_count").hide();
    }
}

$(document).on('pageshow', '#list-page', function (e, data) {

    update_share();

    if (page == "bookmark") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-color.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else if (page == "library") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-color.png');
    }
    else if (page == "food") {
        $('.header-food-icon').attr('src', 'images/food-color.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }


    $("#list-page .sharepanel").height(0);

    $('#item-list').height(window_height - 130);

    $("#list-page .filterbtn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("filter-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#list-page .listbtn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("map-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#list-page .sharebtn").click(function (event) {
        event.stopPropagation();
        if ($("#list-page .sharepanel").height() > 0) {
            $("#list-page .sharepanel").stop().animate({
                height: 0,
            }, 1000, null);
        }
        else {
            $("#list-page .sharepanel").stop().animate({
                height: 55,
            }, 1000, null);
        }

    });


    $("#list-page .app-icon").click(function (event) {
        event.stopPropagation();

        $('#home-page .first').show();
        $('#home-page .second').show();
        $('#home-page .third').show();

        $.mobile.changePage($('#home-page'), { transition: getTransition(), reverse: true, changeHash: false });
        return false;
    });

    $("#list-page .header-bookmark-icon").click(function (event) {
        event.stopPropagation();

        if (page == "bookmark") {
            page = returnTo;
            $('body').removeClass("bookmark-page");
        }
        else {
            returnTo = page;
            $('body').addClass("bookmark-page");
            page = "bookmark";
        }
        list_page();
        return false;
    });

    $("#list-page .header-food-icon").click(function (event) {
        event.stopPropagation();
        if (returnTo != 'food') {
            share_count = 0;
            selectedToShare.length = 0;
            update_share();
        }
        page = "food";
        $('body').addClass("food-page");
        $('body').removeClass("library-page");
        $('body').removeClass("bookmark-page");
        places.length = 0;
        if (map && map.entities) {
            map.entities.clear();
        }
        map_pin();
        return false;
    });
    $("#list-page .header-shelter-icon").click(function (event) {
        event.stopPropagation();
        if (returnTo != 'library') {
            share_count = 0;
            selectedToShare.length = 0;
            update_share();
        }
        page = "library";
        $('body').addClass("library-page");
        $('body').removeClass("food-page");
        $('body').removeClass("bookmark-page");
        places.length = 0;
        if (map && map.entities) {
            map.entities.clear();
        }
        map_pin();
        return false;
    });
    $("#list-page .header-medical-icon").click(function (event) {
        event.stopPropagation();
        comingSoon();
        return false;
    });

    $("#list-page .email .ui-btn").click(function (event) {
        event.stopPropagation();
        email_message();
        return false;
    });
    $("#list-page .sms .ui-btn").click(function (event) {
        event.stopPropagation();
        sms_message();
        return false;
    });

    $.mobile.showPageLoadingMsg();
    setTimeout(function () {
        list_page();
        $.mobile.hidePageLoadingMsg();
    }, 100);
});
var prevListPage;
var listCache;
function list_page() {

    if (page == "bookmark") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-color.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else if (page == "library") {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-color.png');
    }
    else if (page == "food") {
        $('.header-food-icon').attr('src', 'images/food-color.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }
    else {
        $('.header-food-icon').attr('src', 'images/food-gray.png');
        $('.header-bookmark-icon').attr('src', 'images/bookmark-gray.png');
        $('.header-shelter-icon').attr('src', 'images/shelter-gray.png');
    }

    if (!(prevListPage && prevListPage == page && ['map-page', 'filter-page', 'home-page'].indexOf(hist[hist.length - 1]) > -1) || !listCache) {
        prevListPage = page;

        listCache = '';
        listPoints = [];
        $.each(places, function (key, val) {
            if (page == "bookmark") {
                if (jQuery.inArray(val.serialno, bookmark) != -1) {
                    var bsrc = "";
                    var ssrc = "";

                    if (val.bookmark)
                        bsrc = "images/item_bookmark_color.png";
                    else
                        bsrc = "images/item_bookmark_gray.png";
                    if (val.select)
                        ssrc = "images/item_select_color.png";
                    else
                        ssrc = "images/item_select_gray.png";

                    if ($('body').hasClass('food-page')) {
                        actualItemIcon = 'images/food-gray.png'
                    }


                    if ($('body').hasClass('library-page')) {
                        actualItemIcon = 'images/shelter-gray.png'
                    }

                    var ih = '<div class="itemtbl" id="' + key + '"><div class="item_info left"><div class="item_title">' + (val.site_name || '') + '</div><div class="item_address">' + (val.site_street_address || '') + '<br/>' + (val.site_city ? (val.site_city + ', ') : '') + (val.site_state || '') + ' ' + (val.site_zip || '') + '<br/>' + (val.site_phone || '') + '</div></div><div class="item_info right">' + '<div class="item_open"><div class="status">' + get_open_close(key) + '</div><div class="item_detail">' + (get_place_description_short(places[key]) || (places[key].meal_types ? 'Hrs: ' + get_hrs(places[key]) + '<br/>M-Fri' : '')) + '</div></div><div class="item_btns"><div class="bookmark_btn"><img src="' + bsrc + '"/></div><div class="select_btn"><img src="' + ssrc + '"/></div></div></div></div>';
                    listCache += ih;
                }
            }
            else {
                var distToPoint = getDistanceFromLatLonInKm(current_latitude, current_longitude, val.coordinates.latitude, val.coordinates.longitude);
                if ((distance * milesToKms) >= distToPoint) {
                    var bsrc = "";
                    var ssrc = "";

                    if (val.bookmark)
                        bsrc = "images/item_bookmark_color.png";
                    else
                        bsrc = "images/item_bookmark_gray.png";
                    if (val.select)
                        ssrc = "images/item_select_color.png";
                    else
                        ssrc = "images/item_select_gray.png";

                    if ($('body').hasClass('food-page')) {
                        actualItemIcon = 'images/food-gray.png'
                    }
                    if ($('body').hasClass('library-page')) {
                        actualItemIcon = 'images/shelter-gray.png'
                    }

                    var ih = '<div class="itemtbl" id="' + key + '"><div class="item_info left"><div class="item_title">' + (val.site_name || '') + '</div><div class="item_address">' + (val.site_street_address || '') + '<br/>' + (val.site_city ? (val.site_city + ', ') : '') + (val.site_state || '') + ' ' + (val.site_zip || '') + '<br/>' + (val.site_phone || '') + '</div></div><div class="item_info right">' + '<div class="item_open"><div class="status">' + get_open_close(key) + '</div><div class="item_detail">' + (get_place_description_short(places[key]) || (places[key].meal_types ? 'Hrs: ' + get_hrs(places[key]) + '<br/>M-Fri' : '')) + '</div></div><div class="item_btns"><div class="bookmark_btn"><img src="' + bsrc + '"/></div><div class="select_btn"><img src="' + ssrc + '"/></div></div></div></div>';

                    if (open_status == "open") {
                        if (get_open_close(key) == "OPEN") {
                            listPoints.push({
                                distance: distToPoint,
                                html: ih
                            });
                        }
                    } else {
                        listPoints.push({
                            distance: distToPoint,
                            html: ih
                        });
                    }
                }
            }
        });
        listPoints.sort(function (a, b) { return a.distance - b.distance; });
        listPoints.forEach(function (it) { listCache += it.html; });
    }

    $('#item-list').html(listCache);

    $(".itemtbl").click(function (event) {
        current_place = $(this).attr('id');
        event.stopPropagation();
        $.mobile.changePage("detail-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });

    $(".bookmark_btn").click(function (event) {
        event.stopPropagation();
        var key = $(this).parents('.itemtbl').attr('id');

        if (places[key].bookmark) {
            $(this).find('img').attr('src', 'images/item_bookmark_gray.png');
            places[key].bookmark = 0;
        }
        else {
            $(this).find('img').attr('src', 'images/item_bookmark_color.png');
            places[key].bookmark = 1;
        }

        listCache = $('#item-list').html();
        bookmark_add(places[key].bookmark, places[key].serialno);
    });

    $(".select_btn").click(function (event) {
        event.stopPropagation();
        var key = $(this).parents('.itemtbl').attr('id');

        if (places[key].select) {

            selectedToShare.splice(selectedToShare.indexOf(places[key].serialno), 1);

            $(this).find('img').attr('src', 'images/item_select_gray.png');
            places[key].select = 0;
            share_count = selectedToShare.length;
            listCache = '';
        }
        else {

            selectedToShare.push(places[key].serialno);

            $(this).find('img').attr('src', 'images/item_select_color.png');
            places[key].select = 1;
            share_count = selectedToShare.length;
            listCache = '';
        }

        listCache = $('#item-list').html();
        update_share();
    });
}

$(document).on('pageshow', '#filter-page', function (e, data) {

    $("#filter-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });

    $("#filter-page input:radio[value=" + distance + "]").attr("checked", true).checkboxradio("refresh");
    $("#filter-page input[type='radio']").bind("change", function (event, ui) {
        $('#location').blur();
        distance = $('input[name=radio-view]:checked').val();
    });
    $(".containing-element #flip-min").val(open_status).slider('refresh');
    $(".containing-element #flip-min").bind("change", function (event, ui) {
        $('#location').blur();
        open_status = $(this).val();
    });

    var cache = {};
    $('#location').autocomplete({
        source: function (request, response) {
            var term = request.term;
            if (term in cache) {
                response(cache[term]);
                return;
            }

            $.ajax({
                url: config.mapUrl + '?query=' + (encodeURIComponent(request.term) || '').trim() + '&output=json&jsonp=GeocodeCallback&key=' + mapkey,
                crossDomain: true,
                jsonpCallback: 'GeocodeCallback',
                dataType: "jsonp",
                success: function (data) {
                    if (data.resourceSets &&
                        data.resourceSets.length > 0 &&
                        data.resourceSets[0].resources &&
                        data.resourceSets[0].resources.length > 0) {
                        var res = cache[term] = data.resourceSets[0].resources.filter(function (it) {
                            return it.address && it.address.countryRegion && it.address.countryRegion != 'United States' ? false : true;
                        }).map(function (it) {
                            return {
                                label: it.address && it.address.formattedAddress ? it.address.formattedAddress : it.name,
                                value: it.address && it.address.formattedAddress ? it.address.formattedAddress : it.name
                            };
                        });
                        response(res);
                    }
                }
            });
        },
        minLength: 2,
        select: function (e, ui) {
            $('#location').val(ui.item.value);
        }
    });

    var searchStart = function (e) {
        e.preventDefault();

        listCache = '';
        selectedToShare.length = 0;
        share_count = 0;

        var loctxt = $('#location').val();

        current_address = loctxt.trim();
        if (loctxt != current_address) $('#location').val(current_address);
        if (loctxt.length > 0) {
            $.mobile.showPageLoadingMsg();
            $.ajax({
                url: config.mapUrl + '?query=' + encodeURIComponent(current_address) + '&output=json&jsonp=GeocodeCallback&key=' + mapkey,
                crossDomain: true,
                jsonpCallback: 'GeocodeCallback',
                dataType: "jsonp",
                success: function (data) {
                    $.mobile.hidePageLoadingMsg();

                    if (data.resourceSets &&
			            data.resourceSets.length > 0 &&
			            data.resourceSets[0].resources &&
			            data.resourceSets[0].resources.length > 0 &&
			            data.resourceSets[0].resources[0].point) {
                        var p = data.resourceSets[0].resources[0].point;
                        current_latitude = p.coordinates[0];
                        current_longitude = p.coordinates[1];
                        $.mobile.changePage("map-page.html", { transition: getTransition(), reverse: true, changeHash: false });
                        return false;
                    } else {
                        navigator.notification.alert("Map service may be unavailable. Please Try again later.", function () { }, "Range");
                    }
                },
                error: function () {
                    $.mobile.hidePageLoadingMsg();
                    navigator.notification.alert("Network probleam try again", function () { }, "Range");
                }

            });
        }
        else {
            navigator.notification.alert("Please enter a location", function () { }, "Range");
        }

        return false;
    };

    $('#current-loc.sbtn .ui-btn').click(function (e) {
        e.preventDefault();
        e.stopPropagation();

        $("#location").val(orig_current_address);
    });
    $("#search-btn.sbtn .ui-btn").click(searchStart);
    $('#filter-page form').on('submit', searchStart);

    $("#location").val(current_address);
    $('.search-del').click(function () {
        $("#location").val('');
        $("#location").focus();
    });

    $('a[data-href]').click(function (e) {
        e.preventDefault();
        e.stopPropagation();

        $.mobile.changePage($(e.target).attr('data-href'), { transition: "slide", reverse: false, changeHash: false });

        return false;
    });
});


$(document).on('pageshow', '#detail-page', function (e, data) {

    var key = current_place;

    $('#myMap1').html('');

    var mapOptions = {
        credentials: mapkey,
        center: new Microsoft.Maps.Location(places[key].coordinates.latitude, places[key].coordinates.longitude),
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        zoom: 15,
        enableClickableLogo: false,
        enableSearchLogo: false,
        showScalebar: false,
        showDashboard: false,
        showMapTypeSelector: false
    };
    map1 = new Microsoft.Maps.Map(document.getElementById('myMap1'), mapOptions);

    var pin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(places[key].coordinates.latitude, places[key].coordinates.longitude), { draggable: false, icon: get_pin_icon(places[key]), width: 31, height: 50 });

    map1.entities.push(pin);


    $("#detail-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });
    $("#detail-page .directions .ui-btn").click(function (event, ui) {
        event.stopPropagation();
        $.mobile.changePage("directions-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    var tel = places[key].site_phone;
    if (tel) {
        tel = tel.replace(/\s*#/g, ',');
    }
    $("#detail-page .call .ui-btn").attr('href', 'tel:' + tel);

    $(".detail-list").html("");
    var bsrc = "";
    var ssrc = "";

    if (places[key].bookmark)
        bsrc = "images/item_bookmark_color.png";
    else
        bsrc = "images/item_bookmark_gray.png";
    if (places[key].select)
        ssrc = "images/item_select_color.png";
    else
        ssrc = "images/item_select_gray.png";

    if ($('body').hasClass('food-page')) {
        actualItemIcon = 'images/food-gray.png'
    }
    if ($('body').hasClass('library-page')) {
        actualItemIcon = 'images/shelter-gray.png'
    }

    var ih = '<div class="itemtbl" id="' + key + '"><div class="item_info left"><div class="item_title">' + (places[key].site_name || '') + '</div><div class="item_address">' + (places[key].site_street_address || '') + '<br/>' + (places[key].site_city ? places[key].site_city + ', ' : '') + (places[key].site_state || '') + ' ' + (places[key].site_zip || '') + '<br/>' + (places[key].site_phone ? ('<a href="tel:' + places[key].site_phone + '">' + places[key].site_phone + '</a>') : '') + '</div></div><div class="item_info right">' + '<div class="item_open"><div class="status">' + get_open_close(key) + '</div><div class="item_detail">' + (get_place_description(places[key]) || (places[key].meal_types ? 'Hrs: ' + get_hrs(places[key]) + '<br/>M-Fri' : '')) + '</div></div><div class="item_btns"><div class="bookmark_btn"><img src="' + bsrc + '"/></div><div class="select_btn"><img src="' + ssrc + '"/></div></div></div></div>';
    $(".detail-list").html(ih);
    var html = (places[key].site_contact || '') + (places[key].site_website ? (places[key].site_contact ? '<br>' : '') + '<a class="ui-link" href="' + places[key].site_website.url + '" ontouchstart="openWeb()" onclick="openWeb()">' + (places[key].site_website.description || places[key].site_website.url) + '</a>' : '');
    if (html) html += '<br>';
    html += (places[key].site_description || '');
    $(".detail-desc p").html(html);


    $(".bookmark_btn").click(function (event) {
        event.stopPropagation();
        var key = $(this).parents('.itemtbl').attr('id');

        if (places[key].bookmark) {
            $(this).find('img').attr('src', 'images/item_bookmark_gray.png');
            places[key].bookmark = 0;
        }
        else {
            $(this).find('img').attr('src', 'images/item_bookmark_color.png');
            places[key].bookmark = 1;
        }
        bookmark_add(places[key].bookmark, places[key].serialno);
    });

    $(".select_btn").click(function (event) {
        event.stopPropagation();
        var key = $(this).parents('.itemtbl').attr('id');

        if (places[key].select) {

            selectedToShare.splice(selectedToShare.indexOf(places[key].serialno), 1);

            $(this).find('img').attr('src', 'images/item_select_gray.png');
            places[key].select = 0;
            share_count = selectedToShare.length;
            listCache = '';
        }
        else {

            selectedToShare.push(places[key].serialno);

            $(this).find('img').attr('src', 'images/item_select_color.png');
            places[key].select = 1;
            share_count = selectedToShare.length;
            listCache = '';
        }
        update_share();
    });

    $('#detail-page .ui-content').height(window_height - 60);
});

$(document).on('pageshow', '#directions-page', function (e, data) {

    $('#myMap2').html('');

    directionsManager = null;
    $("#directions-page .direction-list").html("");
    $("#directions-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });
    var key = current_place;
    var mapOptions = {
        credentials: mapkey,
        center: new Microsoft.Maps.Location(orig_current_latitude, orig_current_longitude),
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        zoom: 15,
        enableClickableLogo: false,
        enableSearchLogo: false,
        showScalebar: false,
        showDashboard: false,
        showMapTypeSelector: false
    };
    map2 = new Microsoft.Maps.Map(document.getElementById('myMap2'), mapOptions);
    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', { callback: createDrivingRoute });
    $('#directions-page .ui-content').height(window_height - 60);

});

function createDrivingRoute() {
    var key = current_place;
    if (!directionsManager) { createDirectionsManager(); }
    directionsManager.resetDirections();
    directionsManager.setRequestOptions({ routeMode: Microsoft.Maps.Directions.RouteMode.driving });
    var seattleWaypoint = new Microsoft.Maps.Directions.Waypoint({ draggable: false, address: "Current", location: new Microsoft.Maps.Location(orig_current_latitude, orig_current_longitude) });
    directionsManager.addWaypoint(seattleWaypoint);
    var tacomaWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: places[key].site_name, location: new Microsoft.Maps.Location(places[key].coordinates.latitude, places[key].coordinates.longitude) });
    directionsManager.addWaypoint(tacomaWaypoint);
    // Set the element in which the itinerary will be rendered
    directionsManager.setRenderOptions({ waypointPushpinOptions: { draggable: false }, itineraryContainer: document.getElementById('directionsItinerary') });
    directionsManager.calculateDirections();

}
function createDirectionsManager() {
    var displayMessage = "";
    if (!directionsManager) {
        directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map2);
        displayMessage = 'Directions Module loaded<BR>';
        displayMessage += 'Directions Manager loaded';
    }

    directionsManager.resetDirections();
    directionsErrorEventObj = Microsoft.Maps.Events.addHandler(directionsManager, 'directionsError', function (arg) {
        navigator.notification.alert(arg.message, function () { }, 'Range');
    });
    directionsUpdatedEventObj = Microsoft.Maps.Events.addHandler(directionsManager, 'directionsUpdated', function () { });
}
$(document).on('pageshow', '#settings-page', function (e, data) {
    $("#settings-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });
    $("#settings-page .aboutus-page-btn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("aboutus-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#settings-page .contact-page-btn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("contact-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#settings-page .terms-page-btn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("terms-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#settings-page .privacy-page-btn").click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("privacy-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $("#settings-page #location-services").val('' + (window.localStorage.locationServices || true)).slider('refresh');
    $("#settings-page #location-services").bind("change", function (event, ui) {
        window.localStorage.locationServices = $(this).val();
        console.log(typeof window.localStorage.locationServices, window.localStorage.locationServices);
        if (window.localStorage.locationServices == 'true') {
            geoinit = false;
            currentGeo();
        }
    });

});
$(document).on('pagebeforeshow', '#aboutus-page', function () {
    $('#appversion').text(navigator.manifest.version);
    $('#releasedate').text(moment(navigator.manifest.buildDate).format('MM/DD/YYYY'));
});
$(document).on('pageshow', '#aboutus-page', function (e, data) {
    $("#aboutus-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });

    $('#aboutus-page .ui-content').height(window_height - 111);

});
$(document).on('pageshow', '#contact-page', function (e, data) {
    $("#contact-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });

    var subject = 'Range Feedback';
    $("#contact-page input[type='radio']").bind("change", function (event, ui) {
        subject = $('input[name=radio-view]:checked').val();
    });

    $('#contact-page .contact-content').height(window_height - 111);

    $('#contact-page .sbtn').click(function () {
        if ($('#contact-page #contact-email:invalid').length > 0) {
            $.mobile.hidePageLoadingMsg();
            navigator.notification.alert('Invalid email address', function () { }, 'Range');
            return false;
        }
        if (!$('#contact-page #contact-email').val()) {
            navigator.notification.alert('Email address is required', function () { }, 'Range');
            return false;
        }
        if (!$('#contact-message').val()) {
            navigator.notification.alert('Message is required', function () { }, 'Range');
            return false;
        }
        $.mobile.showPageLoadingMsg();
        $.ajax({
            url: serverUrl + '/contactus',
            type: 'POST',
            data: {
                subject: subject,
                text: $('#contact-message').val(),
                from: $('#contact-page #contact-email').val()
            },
            dataType: 'json',
            success: function (data) {
                postAnalytics('Contact Us sent');
                $.mobile.hidePageLoadingMsg();
                navigator.notification.alert('Message sent successfully', function () {
                    onPressBack();
                }, 'Range');
            }
        }).fail(function (err) {
            $.mobile.hidePageLoadingMsg();
            navigator.notification.alert(err.responseText || 'Could not send message', function () { }, 'Range');
            console.log(arguments);
            console.log(JSON.stringify(err));
        });
    });
});
$(document).on('pageshow', '#terms-page', function (e, data) {
    $("#terms-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });
    $('#terms-page .ui-content').height(window_height - 111);
});
$(document).on('pageshow', '#privacy-page', function (e, data) {
    $("#privacy-page .ui-header .ui-btn").click(function (event) {
        event.stopPropagation();
        onPressBack();
        return false;
    });
    $('#href-contactus').click(function (event) {
        event.stopPropagation();
        $.mobile.changePage("contact-page.html", { transition: "slide", reverse: false, changeHash: false });
        return false;
    });
    $('#privacy-page .ui-content').height(window_height - 111);
});
