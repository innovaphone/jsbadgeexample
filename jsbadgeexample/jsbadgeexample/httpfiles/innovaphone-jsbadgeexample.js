
/// <reference path="../../web1/lib1/innovaphone.lib1.js" />
/// <reference path="../../web1/appwebsocket/innovaphone.appwebsocket.Connection.js" />
/// <reference path="../../web1/ui1.lib/innovaphone.ui1.lib.js" />

var innovaphone = innovaphone || {};
innovaphone.jsbadgeexample = innovaphone.jsbadgeexample || function (start, args) {
    this.createNode("body");
    var that = this;

    var colorSchemes = {
        dark: {
            "--bg": "#191919",
            "--button": "#303030",
            "--text-standard": "#f2f5f6",
        },
        light: {
            "--bg": "white",
            "--button": "#e0e0e0",
            "--text-standard": "#4a4a49",
        }
    };
    var schemes = new innovaphone.ui1.CssVariables(colorSchemes, start.scheme);
    start.onschemechanged.attach(function () { schemes.activate(start.scheme) });

    var texts = new innovaphone.lib1.Languages(innovaphone.jsbadgeexampleTexts, start.lang);
    start.onlangchanged.attach(function () { texts.activate(start.lang) });

    var counter = this.add(new innovaphone.ui1.Div("position:absolute; left:0px; width:100%; top:calc(50% - 50px); font-size:100px; text-align:center", "-"));
    var status = this.add(new innovaphone.ui1.Div("position:absolute; left:0px; width:100%; top:calc(80% - 10px); font-size:20px; text-align:center", ""));
    var app = new innovaphone.appwebsocket.Connection(start.url, start.name);
    app.checkBuild = true;
    app.onconnected = app_connected;
    app.onmessage = app_message;

    function app_connected(domain, user, dn, appdomain) {
        app.sendSrc({ api: "user", mt: "GetCount" }, function (obj) {
            updateUI(obj);
        });

        that.add(new innovaphone.ui1.Div(null, null, "button")).addTranslation(texts, "countUp").addEvent("click", function () {
            app.sendSrc({ api: "user", mt: "IncrementCount" }, function (obj) {
                updateUI(obj);
            });
        });
    }

    function app_message(obj) {
        if (obj.api === "user" && obj.mt === "UpdateCount") {
            updateUI(obj);
        }
    }

    function updateUI(obj) {
        counter.addHTML("" + obj.count);
        status.addHTML(obj.pbxconnected ? "" : "Warning: WebSocket connection from PBX not established");
    }
};

innovaphone.jsbadgeexample.prototype = innovaphone.ui1.nodePrototype;
