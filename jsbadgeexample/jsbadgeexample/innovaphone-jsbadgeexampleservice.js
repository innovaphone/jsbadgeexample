
new JsonApi("user").onconnected(function(conn) {
    if (conn.app == "innovaphone-jsbadgeexample") {
        conn.onmessage(function(msg) {
            var obj = JSON.parse(msg);
            if (obj.mt == "UserMessage") {
                conn.send(JSON.stringify({ api: "user", mt: "UserMessageResult", src: obj.src }));
            }
        });
    }
});

new JsonApi("admin").onconnected(function(conn) {
    if (conn.app == "innovaphone-jsbadgeexampleadmin") {
        conn.onmessage(function(msg) {
            var obj = JSON.parse(msg);
            if (obj.mt == "AdminMessage") {
                conn.send(JSON.stringify({ api: "admin", mt: "AdminMessageResult", src: obj.src }));
            }
        });
    }
});

var connections = [];
var presence_calls = [];

new PbxApi("PbxSignal").onconnected(function (conn) {
    log("PbxSignal: connected");

    connections.push(conn);

    conn.send(JSON.stringify({ "api": "PbxSignal", "mt": "Register", "flags": "NO_MEDIA_CALL" }));

    conn.onmessage(function (msg) {
        var obj = JSON.parse(msg);
        log(msg);

        if (obj.mt === "RegisterResult") {
            log("PBXSignal: registration result " + JSON.stringify(obj));
        }

        if (obj.mt === "Signaling") {
            if (obj.sig.type === "setup") {

                // handle incoming presence_subscribe call
                // the callid "obj.call" required later for sending badge notifications
                if (obj.sig.fty.some(function (v) { return v.type === "presence_subscribe"; })) {
                    log("PbxSignal: incoming presence subscription for user " + obj.sig.cg.sip);

                    // connect call
                    conn.send(JSON.stringify({ "mt": "Signaling", "api": "PbxSignal", "call": obj.call, "sig": { "type": "conn" } }));

                    // send notification with badge count 2
                    conn.send(JSON.stringify(
                        {
                            "api": "PbxSignal",
                            "mt": "Signaling",
                            "call": obj.call,
                            "sig": {
                                "fty": [
                                    {
                                        "contact": "app:",
                                        "note": "#badge:2",
                                        "status": "open",
                                        "type": "presence_notify"
                                    }
                                ],
                                "type": "facility"
                            },
                            "src": "badge"
                        }
                    ));
                }
            }
        } 
    });

    conn.onclose(function () {
        log("PbxSignal: disconnected");
    });
});


function updateBadge(count, callid) {

    var msg = {
        "api": "PbxSignal", "mt": "Signaling", "call": callid, "src": "badge",
        "sig": {
            "type": "facility",
            "fty": [{ "type": "presence_notify", "status": "open", "note": "#badge:" + count, "contact": "app:" }]
        }
    };

    connections.filter(function (v) { return v.api === "PbxSignal" })[0].send(JSON.stringify(msg));
}