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
                var {DBG, ERR, WARN, INFO} = global.getLogger(__filename);
                var {PeripheralService, express, bodyParser} = global.getBundledModules();
                const {RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, RELATIONSHIP_MANAGED} = PeripheralService.relationships;
                const PERIPHERAL_TYPE = "nodejs_process";
                class Service extends PeripheralService {
                    constructor(opts, uptime, pmodule) {
                        super(opts, uptime, pmodule);
                        this.name = "ps-demo1";
                        this.types = [ PERIPHERAL_TYPE ];
                        this.pid = process.pid.toString();
                        this.monitors = [];
                    }
                    updatePeripheralState() {
                        var os = require("os");
                        var metadata = {
                            ppid: process.ppid,
                            versions: process.versions,
                            os_uptime: os.uptime(),
                            os_platform: os.platform()
                        };
                        this.emitPeripheralState(PERIPHERAL_TYPE, this.pid, RELATIONSHIP_MANAGED, metadata);
                    }
                    processMonitorData(s_type, s_id, data) {
                        this.emitData(PERIPHERAL_TYPE, this.pid, s_type, s_id, data);
                    }
                    init(done) {
                        var CpuMonitor = require("./monitors/cpu");
                        var cpu = new CpuMonitor(2e3);
                        this.monitors.push(cpu);
                        var MemoryMonitor = require("./monitors/memory");
                        var memory = new MemoryMonitor(1e4);
                        this.monitors.push(memory);
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
            "./monitors/cpu": 3,
            "./monitors/memory": 4,
            os: undefined,
            path: undefined
        } ],
        2: [ function(require, module, exports) {
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
        3: [ function(require, module, exports) {
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
            "./base": 2
        } ],
        4: [ function(require, module, exports) {
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
            "./base": 2
        } ]
    }, {}, [ 1 ])(1);
});