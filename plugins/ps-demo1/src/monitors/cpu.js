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