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