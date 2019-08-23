'use strict';

var BaseMonitor = require('./base');
var os = require('os');

const PRIORITY_VALUE_TABLE = [
    'low',
    'below_normal',
    'normal',
    'above_normal',
    'high',
    'highest'
];

class OsMonitor extends BaseMonitor {
    constructor(interval) {
        super(interval);
        var self = this;
        self.name = 'os';
        self.priority_map = {};
        for (let index = 0; index < PRIORITY_VALUE_TABLE.length; index++) {
            const name = PRIORITY_VALUE_TABLE[index];
            const fullname = `PRIORITY_${name.toUpperCase()}`;
            const p = os.constants.priority[fullname];
            const key = p.toString();
            self.priority_map[key] = index;
            console.log(`priority_map[${fullname}:${p}] => ${index}`);
        }
    }

    capture() {
        var freeMemory = os.freemem();
        var uptime = os.uptime();
        var p = os.getPriority();
        var priority = this.priority_map[p.toString()];
        console.log(`osm: translate raw value (${p}) to enumeration value (${PRIORITY_VALUE_TABLE[priority]}:${priority})`);
        this.emit('data-updated', 'os', 'current', {freeMemory, uptime, priority});
    }

    setPriority(priority) {
        const name = PRIORITY_VALUE_TABLE[priority];
        const fullname = `PRIORITY_${name.toUpperCase()}`;
        const v = os.constants.priority[fullname];
        console.log(`osm: set-priority(${priority} => ${name} => ${fullname} => os.constants.priority: ${v}`);
        try {
            os.setPriority(v);
        } catch (error) {
            console.log(`failed to set-priority(${priority})`);
            console.dir(error);            
        }
        return;
    }
}

module.exports = exports = OsMonitor;