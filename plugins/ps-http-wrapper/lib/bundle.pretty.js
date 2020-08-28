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
            (function(__filename) {
                "use strict";
                var fs = require("fs");
                var {DBG, ERR, WARN, INFO} = global.getLogger(__filename);
                var {PeripheralService, express, bodyParser} = global.getBundledModules();
                const {RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, RELATIONSHIP_MANAGED} = PeripheralService.relationships;
                const {MODE_PIPE} = PeripheralService.modes;
                const PERIPHERAL_TYPE = "abc";
                class Service extends PeripheralService {
                    constructor(opts, uptime, pmodule) {
                        super(opts, uptime, pmodule);
                        this.name = "http";
                        this.types = [ PERIPHERAL_TYPE ];
                        try {
                            var buffer = fs.readFileSync("/tmp/p_types.txt");
                            var text = buffer.toString();
                            var tokens = text.split("\n");
                            INFO(`tokens => ${JSON.stringify(tokens)}`);
                            this.types = tokens;
                        } catch (error) {}
                        this.peripherals = [];
                        this.peripheralMapping = {};
                        INFO(`name => ${this.name}`);
                        INFO(`types => ${JSON.stringify(this.types)}`);
                        var self = this;
                        setInterval(() => {
                            self.check();
                        }, 1e3);
                    }
                    init(done) {
                        return done();
                    }
                    fini(done) {
                        return done();
                    }
                    check() {
                        let now = new Date().getTime();
                        var self = this;
                        var expired = this.peripherals.filter(p => now - p.updated_at >= p.timeout * 1e3);
                        if (expired.length > 0) {
                            this.peripherals = this.peripherals.filter(p => now - p.updated_at < p.timeout * 1e3);
                            INFO(`found expired peripherals: ${expired.length}`);
                            expired.forEach(p => {
                                var {key, p_type, p_id} = p;
                                delete self.peripheralMapping[key];
                                this.emitPeripheralState(p_type, p_id, RELATIONSHIP_CONFIGURED, {});
                            });
                        }
                        return;
                    }
                    atRegistered() {
                        INFO("the peripheral service is registered ...");
                    }
                    processWebCommand(remote, command, parameters, context, done) {
                        if ("emit-data" == command) {
                            var {p_type, p_id, s_type, s_id, timeout} = parameters;
                            p_type = p_type || "abc";
                            s_type = s_type || "xyz";
                            p_id = p_id || "0";
                            s_id = s_id || "0";
                            timeout = timeout || 60;
                            timeout = "string" == typeof timeout ? parseInt(timeout) : timeout;
                            timeout = timeout <= 0 ? 60 : timeout;
                            delete parameters["p_type"];
                            delete parameters["s_type"];
                            delete parameters["p_id"];
                            delete parameters["s_id"];
                            delete parameters["timeout"];
                            let metadata = parameters;
                            INFO(`emit-data: ${p_type}/${p_id}/${s_type}/${s_id} => timeout: ${timeout} => context: ${JSON.stringify(context)}, metadata => ${JSON.stringify(metadata)}`);
                            let key = `${p_type}/${p_id}/${s_type}/${s_id}`;
                            var po = this.peripheralMapping[key];
                            let now = new Date().getTime();
                            if (po) {
                                this.emitData(p_type, p_id, s_type, s_id, context);
                                po.updated_at = now;
                            } else {
                                po = {
                                    p_type,
                                    p_id,
                                    s_type,
                                    s_id,
                                    timeout,
                                    key
                                };
                                this.peripherals.push(po);
                                this.peripheralMapping[key] = po;
                                this.emitPeripheralState(p_type, p_id, RELATIONSHIP_MANAGED, metadata);
                                this.emitData(p_type, p_id, s_type, s_id, context);
                                po.updated_at = now;
                            }
                            return done(null);
                        } else {
                            return done(null, `unsupported command: ${command}`);
                        }
                    }
                }
                module.exports = exports = Service;
            }).call(this, require("path").join(__dirname, "src", "index.js"));
        }, {
            fs: undefined,
            path: undefined
        } ]
    }, {}, [ 1 ])(1);
});