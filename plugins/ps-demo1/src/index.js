/**
 * This is wrapper codes for a PeripheralService implementation to 
 * be loaded by SensorWeb3 as a yapp plugin. Please DO NOT modify 
 * this file, and keep it as is.
 */
var YAPPS_PLUGIN_MODULE = {
    'attach': function (opts, helpers) {
        module.opts = opts;
        module.helpers = helpers;
    },

    'init': function (done) {
        var { systemUptime, psManager } = app = this;
        var { opts } = module;
        var CLASS = require('./service');
        var ps = new CLASS(opts, systemUptime, module);
        ps.init((err) => {
            return err ? done(err) : psManager.register(ps, done);
        });
    }
};

module.exports = exports = YAPPS_PLUGIN_MODULE;