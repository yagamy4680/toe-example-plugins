'use strict';
var BaseMonitor = require('./base');

class OsMonitor extends BaseMonitor {
    constructor(interval) {
        super(interval);
        this.name = 'os';
    }
    
    start() {
        super.start();
    }

    capture() {
        // os.getPriority() is supported since nodejs v10.0.0, 
        // unavailable at nodejs 8.x.x.
        //
        var priority = Math.floor(Math.random() * (19 - (-20)) + -20);
        var usage = process.cpuUsage(this.startUsage);
        this.emit('data-updated', this.name, 'current', {priority});
    }
}

module.exports = exports = OsMonitor;