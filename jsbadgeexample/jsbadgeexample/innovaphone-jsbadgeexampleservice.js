var count = 1;


var connectionsUser = [];
new JsonApi("user").onconnected(function (conn) {
    connectionsUser.push(conn);

    if (conn.app === "innovaphone-jsbadgeexample") {
        conn.onmessage(function(msg) {
            var obj = JSON.parse(msg);
            log(msg);

            if (obj.mt === "UserMessage") {
                conn.send(JSON.stringify({ api: "user", mt: "UserMessageResult", src: obj.src }));
            }
            if (obj.mt === "GetCount") {
                conn.send(JSON.stringify({ api: "user", mt: "GetCountResult", count: count, src: obj.src }));
            }
            if (obj.mt === "IncrementCount") {
                count++;
                conn.send(JSON.stringify({ api: "user", mt: "IncrementCountResult", count: count, src: obj.src }));

                log("Sending updates via Presence Signalling");
                connectionsPbxSignal.forEach(function (connection) {
                    connection.calls.forEach(function (call) {
                        updateBadge(connection.ws, call, count);
                    });
                });

                log("Sending updates via WS");
                connectionsUser.forEach(function (connection) {
                    connection.send(JSON.stringify({ api: "user", mt: "UpdateCount", count: count }));
                });
            }
        });
    }

    conn.onclose(function () {
        log("User: disconnected");
        connectionsUser.splice(connectionsUser.indexOf(conn), 1);
    });
});


var connectionsPbxSignal = [];
new PbxApi("PbxSignal").onconnected(function (conn) {
    log("PbxSignal: connected");

    // for each PBX API connection an own call array is maintained
    connectionsPbxSignal.push({ ws: conn, calls: [] });

    // register to the PBX in order to acceppt incoming presence calls
    conn.send(JSON.stringify({ "api": "PbxSignal", "mt": "Register", "flags": "NO_MEDIA_CALL" }));

    conn.onmessage(function (msg) {
        var obj = JSON.parse(msg);
        log(msg);

        if (obj.mt === "RegisterResult") {
            log("PBXSignal: registration result " + JSON.stringify(obj));
        }

        // handle incoming presence_subscribe call setup messages
        // the callid "obj.call" required later for sending badge notifications
        if (obj.mt === "Signaling" && obj.sig.type === "setup" && obj.sig.fty.some(function (v) { return v.type === "presence_subscribe" })) {

            log("PbxSignal: incoming presence subscription for user " + obj.sig.cg.sip);

            // connect call
            conn.send(JSON.stringify({ "mt": "Signaling", "api": "PbxSignal", "call": obj.call, "sig": { "type": "conn" } }));

            // add callid to the array for calls for this connection
            connectionsPbxSignal.filter(function (v) { return v.ws === conn })[0].calls.push(obj.call);

            // send notification with badge count first time the user has connected
            conn.send(JSON.stringify(
                {
                    "api": "PbxSignal",
                    "mt": "Signaling",
                    "call": obj.call,
                    "sig": {
                        "fty": [
                            {
                                "contact": "app:",
                                "note": "#badge:" + count,
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

        // handle incoming call release messages
        if (obj.mt === "Signaling" && obj.sig.type === "rel") {
            // remove callid from the array for calls for this connection
            var calllist = connectionsPbxSignal.filter(function (v) { return v.ws === conn })[0].calls;
            calllist.splice(calllist.indexOf(obj.call), 1);
        }
    });

    conn.onclose(function () {
        log("PbxSignal: disconnected");
        connectionsPbxSignal.splice(connectionsPbxSignal.indexOf(conn), 1);
    });
});


function updateBadge(ws, callid, count) {
    var msg = {
        "api": "PbxSignal", "mt": "Signaling", "call": callid, "src": "badge",
        "sig": {
            "type": "facility",
            "fty": [{ "type": "presence_notify", "status": "open", "note": "#badge:" + count, "contact": "app:" }]
        }
    };

    ws.send(JSON.stringify(msg));
}