(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Service = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (__filename){
'use strict';

/**
 * Get logger apis in SensorWeb3
 */
var { DBG, ERR, WARN, INFO } = global.getLogger(__filename);

/**
 * Get the PeripheralService class declaration from SensorWeb3
 */
var { PeripheralService, express, bodyParser } = global.getBundledModules();

/**
 * Get the declaration of constants.
 */
const { RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, RELATIONSHIP_MANAGED } = PeripheralService.relationships;


const PERIPHERAL_TYPE = 'nodejs_process';


class Service extends PeripheralService {

    constructor(opts, uptime, pmodule) {
        super(opts, uptime, pmodule);
        this.name = 'ps-demo1';
        this.types = [PERIPHERAL_TYPE];
        this.pid = process.pid.toString();
        this.monitors = [];
    }

    updatePeripheralState() {
        var os = require('os');
        var metadata = {
            'ppid': process.ppid,
            'versions': process.versions,
            'os_uptime': os.uptime(),
            'os_platform': os.platform()
        };
        this.emitPeripheralState(PERIPHERAL_TYPE, this.pid, RELATIONSHIP_MANAGED, metadata);
    }

    processMonitorData(s_type, s_id, data) {
        this.emitData(PERIPHERAL_TYPE, this.pid, s_type, s_id, data);
    }

    /**
     * Initialize the peripheral-service instance.
     *
     * @param {function} done the callback function to indicate the initialization of this
     *                        peripheral-service is done.
     */
    init(done) {
        /*
         * All resources related to this peripheral-service shall be initialized here. For
         * example, the peripheral-service serves all BluetoothLE heartbeat rate sensors, then
         * the init() shall be responsible for initializing the Bluetooth LE protocol stack
         * on Linux (or establish connection with another process which is a dedicated Bluetooth
         * daemon).
         * 
         * Please don't perform sensor data or peripheral state updates within this function. 
         * Please perform sensor data updates and peripheral state updates after `atRegistered()` is 
         * called.
         */

        /* Keep updating cpu usages as sensor data, every 2 seconds. */
        var CpuMonitor = require('./monitors/cpu');
        var cpu = new CpuMonitor(2000);
        this.monitors.push(cpu);

        /* Keep updating memory usages as sensor data, every 10 seconds. */
        var MemoryMonitor = require('./monitors/memory');
        var memory = new MemoryMonitor(10000);
        this.monitors.push(memory);

        /* Listen to data updates of each monitor */
        var self = this;
        this.monitors.forEach(m => {
            INFO(`add data listener for monitors[${m.getName().yellow}]`);
            m.on('data-updated', (s_type, s_id, data) => {
                return self.processMonitorData(s_type, s_id, data);
            });
        });
        return done();
    }

    /**
     * Finalize the peripheral-service before SensorWeb3 fully shutdown.
     */
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

    /**
     * After registration is successfully done, then start the service.
     */
    atRegistered() {
        INFO("the peripheral service is registered ...");

        /**
         * Update the only one peripheral every 60 seconds. Please note, typically the 
         * peripheral state update is not so frequent. Here we just show how to update 
         * peripheral state with metadata to SensorWeb3, so ToeAgent or other apps can 
         * process the state with metadata.
         */
        var self = this;
        this.updatePeripheralState();
        this.peripheralTimer = setInterval(() => {
            self.updatePeripheralState();
        }, 60000);

        this.monitors.forEach(m => {
            m.start();
        });
    }

    /**
     * Request to perform an action with the actuator on the peripheral (board or machine)
     * associated with the host/node running SensorWeb.
     *
     * @param {*} p_type    the type of peripheral (board or machine) associated with the host/node that
     *                      runs SensorWeb, e.g. sensorboard, mainboard, echonetlite, hvac,
     *                      and so on... The associate is either wired (e.g. UART, RS485,
     *                      I2C, ...) or wireless (Bluetooth LE, 802.11a/b/g, LoRa, or ZigBee).
     *
     * @param {*} p_id      the unique id of the board (or machine) associated with the host/node.
     *                      Sometimes, one host/node might associate more than one board with same
     *                      type, e.g. A home gateway is associated with 3 BLE coffee machines
     *                      in a coffee shop, and use the BLE mac address of each coffee machine
     *                      as its unique identity.
     *
     * @param {*} a_type    the type of actuator on the board (or machine) associated with the host/node,
     *                      such as fan, pump, led, led-matrix, and so on.
     *
     * @param {*} a_id      the unique id of actuator on the same board (or same machine), because one
     *                      board (or machine) might have more than one actuator with same type. For
     *                      example, an A/C might might have 2 FANs with different identity: 0000 and
     *                      0001.
     *
     * @param {*} action    the supported action of the actuator. Typically, the action `set` is the
     *                      most frequently supported. In some special types of actuators, there are
     *                      more supported actions. Taking led-matrix as example, here are the supported
     *                      actions:
     *                        - `show_number`     , to display 00 ~ 99 number on led matrix.
     *                        - `show_ascii`      , to display one visible ascii character on led matrix.
     *                        - `show_animation`  , to play built-in animation on led matrix.
     *
     * @param {*} arg1      the 1st argument value for the action to be performed.
     *
     * @param {*} arg2      the 2nd argument value for the action to be performed.
     *
     * @param {*} arg3      the 3rd argument value for the action to be performed.
     *
     * @param {*} done      the callback function to indicate the request is successful or not.
     *                      when failure, the 1st argument `err` shall be the error object.
     */
    performAction(p_type, p_id, a_type, a_id, action, arg1, arg2, arg3, done) {
        /**
         * If you run the plugin with SensorWeb3 locally, you can perform http post request to
         * perform actuator action as below:
         *
         *    http http://localhost:6020/api/v3/a/demo1/9876/cpu/0/set_clock arg1:=10
         *    http http://localhost:6020/api/v3/a/demo1/9876/xxx/555/set arg1:=45
         *
         * If you run the plugin with Conscious box (remotely), you can perform actuator request
         * as below (assuming the Conscious box uses the ip 10.90.0.108, and its id is C99900002)
         *
         *    http http://10.90.0.108:6020/api/v3/a/demo1/9876/cpu/0/set_clock arg1:=10
         *    http -a morioka:ub8gGj98SYeqT36U https://wstty.cestec.jp/api/v1/toe/C99900002/sensor-web/v3/a/demo1/9876/cpu/0/set_clock arg1:=10
         *
         * The 2nd example demonstrates how to use RDC (remote device control) feature in TIC to
         * perform http request to SensorWeb3 running on any Conscious box.
         */
        DBG(`got actuator-request: ${p_type}/${p_id}/${a_type}/${a_id}/${action} => ${arg1}, ${arg2}, ${arg3}`);
        return done();
    }

}

module.exports = exports = Service;
}).call(this,require("path").join(__dirname,"src","index.js"))
},{"./monitors/cpu":3,"./monitors/memory":4,"os":undefined,"path":undefined}],2:[function(require,module,exports){
'use strict';

const EventEmitter = require('events');

class BaseMonitor extends EventEmitter {
    constructor(interval) {
        super();
        this.name = 'base';
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

    capture() {
    }
}

module.exports = exports = BaseMonitor;
},{"events":undefined}],3:[function(require,module,exports){
'use strict';

var BaseMonitor = require('./base');

class CpuMonitor extends BaseMonitor {
    constructor(interval) {
        super(interval);
        this.name = 'cpu';
    }
    
    start() {
        super.start();
        this.startUsage = process.cpuUsage();
    }

    capture() {
        /**
         * The cpuUsage() shall output an object:
         *
         *  { user: 76553, system: 26834 }
         */
        var usage = process.cpuUsage(this.startUsage);
        this.emit('data-updated', 'cpu', '0', usage);
    }
}

module.exports = exports = CpuMonitor;
},{"./base":2}],4:[function(require,module,exports){
'use strict';

var BaseMonitor = require('./base');

class MemoryMonitor extends BaseMonitor {
    constructor(interval) {
        super(interval);
        this.name = 'memory';
    }

    capture() {
        /**
         * The memoryUsage() shall output an object:
         * 
         *  { rss: 32477184, heapTotal: 18169856, heapUsed: 8554328, external: 36657 }
         */
        var usage = process.memoryUsage();
        this.emit('data-updated', 'memory', '0', usage);
    }
}

module.exports = exports = MemoryMonitor;
},{"./base":2}]},{},[1])(1)
});
