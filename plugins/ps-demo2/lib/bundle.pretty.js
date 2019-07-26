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
                    name: "demo2",
                    version: "0.0.1",
                    created_at: "2019-07-26T20:24:04.600Z",
                    checksum: "9fd30a4adbef9680eece4baeea96c14d3a26e2cc0b753765955963510b684353"
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
                class Service extends PeripheralService {
                    constructor(opts, uptime, pmodule) {
                        super(opts, uptime, pmodule, require("./schema.json"));
                        this.pid = process.pid.toString();
                        this.monitors = [];
                        INFO(`name => ${this.name}`);
                        INFO(`types => ${JSON.stringify(this.types)}`);
                        INFO(`schema => \n${JSON.stringify(this.schema)}`);
                        this.state_index = 0;
                        this.states = [ RELATIONSHIP_MANAGED, RELATIONSHIP_CONFIGURED ];
                    }
                    updatePeripheralState() {
                        var os = require("os");
                        var metadata = {
                            ppid: process.ppid,
                            versions: process.versions,
                            os_uptime: os.uptime(),
                            os_platform: os.platform()
                        };
                        this.emitPeripheralState(this.types[0], this.pid, this.states[this.state_index % this.states.length], metadata);
                        this.state_index = this.state_index + 1;
                    }
                    processMonitorData(s_type, s_id, data) {
                        this.emitData(this.types[0], this.pid, s_type, s_id, data);
                    }
                    init(done) {
                        var CpuMonitor = require("./monitors/cpu");
                        var cpu = new CpuMonitor(2e3);
                        this.monitors.push(cpu);
                        var MemoryMonitor = require("./monitors/memory");
                        var memory = new MemoryMonitor(1e4);
                        this.monitors.push(memory);
                        var OsMonitor = require("./monitors/os");
                        var osm = new OsMonitor(5e3);
                        this.monitors.push(osm);
                        var self = this;
                        this.monitors.forEach(m => {
                            INFO(`add data listener for monitors[${m.getName().yellow}]`);
                            m.on("data-updated", (s_type, s_id, data) => {
                                return self.processMonitorData(s_type, s_id, data);
                            });
                        });
                        return done();
                    }
                    fini(done) {
                        if (this.peripheralTimer) {
                            INFO("stop peripheral timer");
                            clearInterval(this.peripheralTimer);
                        }
                        this.monitors.forEach(m => {
                            INFO(`stop monitors[${m.getName().yellow}]`);
                            m.stop();
                        });
                        return done();
                    }
                    atRegistered() {
                        INFO("the peripheral service is registered ...");
                        var self = this;
                        this.updatePeripheralState();
                        this.peripheralTimer = setInterval(() => {
                            self.updatePeripheralState();
                        }, 6e4);
                        this.monitors.forEach(m => {
                            m.start();
                        });
                    }
                    performAction(p_type, p_id, a_type, a_id, action, arg1, arg2, arg3, done) {
                        DBG(`got actuator-request: ${p_type}/${p_id}/${a_type}/${a_id}/${action} => ${arg1}, ${arg2}, ${arg3}`);
                        return done();
                    }
                }
                module.exports = exports = Service;
            }).call(this, require("path").join(__dirname, "src", "index.js"));
        }, {
            "./monitors/cpu": 4,
            "./monitors/memory": 5,
            "./monitors/os": 6,
            "./schema.json": 1,
            os: undefined,
            path: undefined
        } ],
        3: [ function(require, module, exports) {
            "use strict";
            const EventEmitter = require("events");
            class BaseMonitor extends EventEmitter {
                constructor(interval) {
                    super();
                    this.name = "base";
                    this.interval = interval;
                    this.timer = null;
                }
                getName() {
                    return this.name;
                }
                start() {
                    var self = this;
                    this.capture();
                    this.timer = setInterval(() => {
                        self.capture();
                    }, this.interval);
                }
                stop() {
                    if (this.timer) {
                        clearInterval(this.timer);
                    }
                }
                capture() {}
            }
            module.exports = exports = BaseMonitor;
        }, {
            events: undefined
        } ],
        4: [ function(require, module, exports) {
            "use strict";
            var BaseMonitor = require("./base");
            class CpuMonitor extends BaseMonitor {
                constructor(interval) {
                    super(interval);
                    this.name = "cpu";
                }
                start() {
                    super.start();
                    this.startUsage = process.cpuUsage();
                }
                capture() {
                    var usage = process.cpuUsage(this.startUsage);
                    this.emit("data-updated", "cpu", "0", usage);
                }
            }
            module.exports = exports = CpuMonitor;
        }, {
            "./base": 3
        } ],
        5: [ function(require, module, exports) {
            "use strict";
            var BaseMonitor = require("./base");
            class MemoryMonitor extends BaseMonitor {
                constructor(interval) {
                    super(interval);
                    this.name = "memory";
                }
                capture() {
                    var usage = process.memoryUsage();
                    this.emit("data-updated", "memory", "0", usage);
                }
            }
            module.exports = exports = MemoryMonitor;
        }, {
            "./base": 3
        } ],
        6: [ function(require, module, exports) {
            "use strict";
            var BaseMonitor = require("./base");
            var os = require("os");
            class OsMonitor extends BaseMonitor {
                constructor(interval) {
                    super(interval);
                    this.name = "os";
                }
                capture() {
                    var freeMemory = os.freemem();
                    var uptime = os.uptime();
                    this.emit("data-updated", "os", "current", {
                        freeMemory,
                        uptime
                    });
                }
            }
            module.exports = exports = OsMonitor;
        }, {
            "./base": 3,
            os: undefined
        } ]
    }, {}, [ 2 ])(2);
});