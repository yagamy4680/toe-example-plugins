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
        var ps = module.ps = new CLASS(opts, systemUptime, module);
        ps.init((err1) => {
            if (err1) {
                return done();
            }
            psManager.register(ps, (err2) => {
                return err2 ? done(err2) : done(null, ps.start());
            });
        });
    },

    'fini': function(done) {
        var {ps} = module;
        if (!ps) {
            return done();
        }
        var {fini} = ps;
        if (!fini) {
            return done();
        }
        return fini.apply(ps, [done]);
    }
};

module.exports = exports = YAPPS_PLUGIN_MODULE;