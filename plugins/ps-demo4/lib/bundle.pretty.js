(function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f();
    } else if (typeof define === "function" && define.amd) {
        define([], f);
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window;
        } else if (typeof global !== "undefined") {
            g = global;
        } else if (typeof self !== "undefined") {
            g = self;
        } else {
            g = this;
        }
        g.Service = f();
    }
})(function() {
    var define, module, exports;
    return function() {
        function r(e, n, t) {
            function o(i, f) {
                if (!n[i]) {
                    if (!e[i]) {
                        var c = "function" == typeof require && require;
                        if (!f && c) return c(i, !0);
                        if (u) return u(i, !0);
                        var a = new Error("Cannot find module '" + i + "'");
                        throw a.code = "MODULE_NOT_FOUND", a;
                    }
                    var p = n[i] = {
                        exports: {}
                    };
                    e[i][0].call(p.exports, function(r) {
                        var n = e[i][1][r];
                        return o(n || r);
                    }, p, p.exports, r, e, n, t);
                }
                return n[i].exports;
            }
            for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
            return o;
        }
        return r;
    }()({
        1: [ function(require, module, exports) {
            module.exports = {
                manifest: {
                    format: 2,
                    name: "demo4",
                    version: "0.0.1",
                    created_at: "2019-09-11T15:31:30.178Z",
                    checksum: "dc1357ac95f6b8a31326d65ed27576a56ce515fe750e8d728b53d005f8ac0c9f"
                },
                content: {
                    peripheral_types: [ {
                        p_type: "schema_base_class",
                        p_type_parent: null,
                        class_name: "SchemaBaseClass",
                        sensor_types: []
                    }, {
                        p_type: "nodejs_process",
                        p_type_parent: "schema_base_class",
                        class_name: "NodejsProcess",
                        sensor_types: [ {
                            s_type: "cpu",
                            s_identities: [ "0" ],
                            fields: [ {
                                name: "user",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "bytes",
                                annotations: {}
                            }, {
                                name: "system",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "bytes",
                                annotations: {}
                            } ],
                            actions: []
                        }, {
                            s_type: "memory",
                            s_identities: [ "0" ],
                            fields: [ {
                                name: "rss",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "bytes",
                                annotations: {}
                            }, {
                                name: "heapTotal",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "bytes",
                                annotations: {}
                            }, {
                                name: "heapUsed",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "bytes",
                                annotations: {}
                            }, {
                                name: "external",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "bytes",
                                annotations: {}
                            } ],
                            actions: []
                        }, {
                            s_type: "os",
                            s_identities: [ "current" ],
                            fields: [ {
                                name: "freeMemory",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "bytes",
                                annotations: {}
                            }, {
                                name: "uptime",
                                writeable: false,
                                value: {
                                    type: "int",
                                    range: [ 0, 4294967296 ]
                                },
                                unit: "seconds",
                                annotations: {}
                            }, {
                                name: "priority",
                                writeable: true,
                                value: {
                                    type: "enum",
                                    range: [ "low", "below_normal", "normal", "above_normal", "high", "highest" ]
                                },
                                unit: "",
                                annotations: {}
                            } ],
                            actions: []
                        } ]
                    } ]
                }
            };
        }, {} ],
        2: [ function(require, module, exports) {
            (function(__filename) {
                "use strict";
                var {DBG, ERR, WARN, INFO} = global.getLogger(__filename);
                var {PeripheralService, express, bodyParser} = global.getBundledModules();
                const {RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, RELATIONSHIP_MANAGED} = PeripheralService.relationships;
                const {MODE_PIPE} = PeripheralService.modes;
                const PIPE_NAME = "dcd";
                const PRIORITY_VALUE_TABLE = [ "low", "below_normal", "normal", "above_normal", "high", "highest" ];
                class Sender {
                    constructor(parent) {
                        this.parent = parent;
                        this.index = 0;
                    }
                    serialize(evt, token1, token2, payload) {
                        var timestamp = Date.now().toString();
                        var index = this.index.toString();
                        var records = JSON.stringify(payload);
                        var tokens = [ index, timestamp, evt, token1, token2, records ];
                        var text = tokens.join("\t");
                        this.index = this.index + 1;
                        return text;
                    }
                    send(evt, token1, token2, payload) {
                        var text = this.serialize(evt, token1, token2, payload);
                        return this.parent.emitPipeData(PIPE_NAME, `${text}\n`);
                    }
                    sendAction(a_type, a_id, action, value) {
                        return this.send("actuator-action", a_type, a_id, {
                            action,
                            value
                        });
                    }
                }
                class Service extends PeripheralService {
                    constructor(opts, uptime, pmodule) {
                        super(opts, uptime, pmodule, require("./schema.json"));
                        this.pid = null;
                        this.mode = MODE_PIPE;
                        this.mode_settings = {
                            pipes: [ {
                                name: PIPE_NAME,
                                byline: true
                            } ]
                        };
                        this.sender = new Sender(this);
                        INFO(`name => ${this.name}`);
                        INFO(`types => ${JSON.stringify(this.types)}`);
                        INFO(`schema => \n${JSON.stringify(this.schema)}`);
                    }
                    init(done) {
                        return done();
                    }
                    fini(done) {
                        return done();
                    }
                    atRegistered() {
                        INFO("the peripheral service is registered ...");
                    }
                    atPipeEstablished(name, metadata) {
                        INFO(`${name}: pipe established => ${JSON.stringify(metadata)}`);
                    }
                    atPipeData(name, data, byline = yes) {
                        if (!byline) {
                            return;
                        }
                        if (data.startsWith("#")) {
                            INFO(`${name} <= ${data.gray}`);
                            return;
                        }
                        var handler = null;
                        var tokens = data.split("\t");
                        var [id, timestamp, evt, token1, token2, payload] = tokens;
                        timestamp = new Date(parseInt(timestamp));
                        if (evt == "sensor-updated") {
                            handler = this.processPacket_sensor_updated;
                        } else if (evt == "peripheral-updated") {
                            handler = this.processPacket_peripheral_updated;
                        }
                        if (handler) {
                            INFO(`${name} <- ${id.blue} ${timestamp.toISOString()} ${evt.yellow} ${token1.cyan} ${token2.green} ${payload.red}`);
                            handler.apply(this, [ token1, token2, payload ]);
                        } else {
                            INFO(`unknown event type: ${evt}`);
                            INFO(`${name} <= ${data.gray}`);
                            return;
                        }
                    }
                    processPacket_sensor_updated(s_type, s_id, payload) {
                        var measurement = JSON.parse(payload);
                        if (this.pid) {
                            this.emitData(this.types[0], this.pid, s_type, s_id, measurement);
                        }
                        if (s_type == "os") {
                            var {priority} = measurement;
                            var name = PRIORITY_VALUE_TABLE[priority];
                            INFO(`${name} <= os/current, priority: ${priority} (${name})`);
                        }
                    }
                    processPacket_peripheral_updated(pid, ppid, payload) {
                        var metadata = JSON.parse(payload);
                        this.pid = pid;
                        this.ppid = ppid;
                        this.emitPeripheralState(this.types[0], this.pid, RELATIONSHIP_MANAGED, metadata);
                    }
                    performAction(p_type, p_id, a_type, a_id, action, arg1, arg2, arg3, done) {
                        INFO(`got actuator-request: ${p_type}/${p_id}/${a_type}/${a_id}/${action} => ${arg1}, ${arg2}, ${arg3}`);
                        if (a_type == "os" && a_id == "current") {
                            this.sender.sendAction(a_type, a_id, action, arg1);
                        }
                        return done();
                    }
                }
                module.exports = exports = Service;
            }).call(this, require("path").join(__dirname, "src", "index.js"));
        }, {
            "./schema.json": 1,
            path: undefined
        } ]
    }, {}, [ 2 ])(2);
});