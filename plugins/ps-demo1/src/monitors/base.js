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