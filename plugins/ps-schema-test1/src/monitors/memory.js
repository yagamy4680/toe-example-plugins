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
        // usage['heapTotal'] = null;
        // usage['heapUsed'] = true;
        // usage['heapUsed'] = -1;
        usage['ext'] = usage['external'] % 8;
        // usage['ext'] = 1.1;
        // usage['ext'] = 9;
        // usage['external'] = undefined;
        // usage['heapTotal'] = undefined;
        // delete usage['rss'];
        // delete usage['heapTotal'];
        this.emit('data-updated', 'memory', '0', usage);
    }
}

module.exports = exports = MemoryMonitor;