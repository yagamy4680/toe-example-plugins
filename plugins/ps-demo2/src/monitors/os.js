'use strict';

var BaseMonitor = require('./base');
var os = require('os');

class OsMonitor extends BaseMonitor {
    constructor(interval) {
        super(interval);
        this.name = 'os';
    }

    capture() {
        var freeMemory = os.freemem();
        var uptime = os.uptime();
        this.emit('data-updated', 'os', 'current', {freeMemory, uptime});
    }
}

module.exports = exports = OsMonitor;