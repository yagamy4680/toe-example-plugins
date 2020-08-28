var Service = require('./bundle.min');
class WrapperService extends Service {
    constructor(opts, uptime) {
        super(opts, uptime, module);
    }
};
module.exports = exports = WrapperService;