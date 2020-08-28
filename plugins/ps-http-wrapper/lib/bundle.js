(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Service = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (__filename){
'use strict';

var fs = require('fs');

/**
 * Get logger apis in SensorWeb
 */
var { DBG, ERR, WARN, INFO } = global.getLogger(__filename);

/**
 * Get the PeripheralService class declaration from SensorWeb3
 */
var { PeripheralService, express, bodyParser } = global.getBundledModules();

/**
 * Get the declaration of constants.
 */
const { RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, RELATIONSHIP_MANAGED } = PeripheralService.relationships;

/**
 * Get pipe mode declaration.
 */
const { MODE_PIPE } = PeripheralService.modes;

/**
 * Peripheral type
 */
const PERIPHERAL_TYPE = 'abc';


class Service extends PeripheralService {

    constructor(opts, uptime, pmodule) {
        super(opts, uptime, pmodule);
        /**
         * With the given schema.json (compiled from schema.ls), following 3 member fields
         * of current service object is set:
         *
         *  - this.name     (from `schema.json:manifest/name`)
         *  - this.types    (from `schema.json:peripheral_types`)
         *
         * So, service object doesn't need to initialize `name` and `types`
         * variables in constructor anymore.
         */
        this.name = 'http';
        this.types = [PERIPHERAL_TYPE];

        try {
            var buffer = fs.readFileSync('/tmp/p_types.txt');
            var text = buffer.toString();
            var tokens = text.split('\n');
            INFO(`tokens => ${JSON.stringify(tokens)}`);
            this.types = tokens;
        } catch (error) {
            // do nothing
        }

        this.peripherals = [];
        this.peripheralMapping = {};
        INFO(`name => ${this.name}`);
        INFO(`types => ${JSON.stringify(this.types)}`);
        var self = this;
        setInterval(() => {
            self.check();
        }, 1000);
    }

    /**
     * Initialize the peripheral-service instance.
     *
     * @param {function} done the callback function to indicate the initialization of this
     *                        peripheral-service is done.
     */
    init(done) {
        return done();
    }

    /**
     * Finalize the peripheral-service before SensorWeb3 fully shutdown.
     */
    fini(done) {
        return done();
    }

    check() {
        let now = (new Date()).getTime();
        var self = this;
        var expired = this.peripherals.filter(p => (now - p.updated_at) >= p.timeout * 1000);
        if (expired.length > 0) {
            this.peripherals = this.peripherals.filter(p => (now - p.updated_at) < p.timeout * 1000);
            INFO(`found expired peripherals: ${expired.length}`);
            expired.forEach(p => {
                var {key, p_type, p_id} = p;
                delete self.peripheralMapping[key];
                this.emitPeripheralState(p_type, p_id, RELATIONSHIP_CONFIGURED, {});
            });
        }
        return;
    }

    /**
     * After registration is successfully done, then start the service.
     */
    atRegistered() {
        INFO("the peripheral service is registered ...");
    }

    /**
     * Process a command request from web interface, either HTTP REST (POST)
     * or Websocket.
     * 
     * HTTP REST (POST):
     *      When SensorWeb3 receives request from `/api/v3/ps/[service-name]/request/[command]`,
     *      the HTTP request are packed as arguments to this callback function. For example,
     *      when you use httpie tool to perform following request:
     * 
     *          http http://127.0.0.1:6020/api/v3/ps/[service-name]/request/[command] \
     *              user==root \
     *              date==$(date '+%Y%m%d') \
     *              message=great \
     *              value:=23 \
     *              verbose:=true
     * 
     *      Then, the function shall receive following arguments:
     * 
     *          remote    : {'type': 'unknown', 'ip': '127.0.0.1', 'port': 65291}
     *          command   : 'hello-world'
     *          parameters: {'user': 'root', 'date': '20171214'}
     *          context   : {'message': 'great', 'value': 23, 'verbose': true}
     * 
     * @param {*} remote        the information about remote client which issues this command request.
     * 
     * @param {*} command       the name of command to be proceeded.
     * 
     * @param {*} parameters    the dictionary object of parameters for the command, composed from
     *                          the query string of HTTP request. By default, it is `{}`.
     * 
     * @param {*} context       the json object of the context for the command, derived from
     *                          the POST body of HTTP request. By default, it is `{}`.
     * 
     * @param {*} done          callback function to indicate ToeAgent when the command processing
     *                          is finished. 1st argument as error, while 2nd argument as
     *                          processing results to be sent back to remote client. 2nd argument
     *                          shall be a JSON object, or a `null`.
     */
    processWebCommand(remote, command, parameters, context, done) {
        if ("emit-data" == command) {
            var {p_type, p_id, s_type, s_id, timeout} = parameters;
            p_type = p_type || 'abc';
            s_type = s_type || 'xyz';
            p_id = p_id || '0';
            s_id = s_id || '0';
            timeout = timeout || 60;
            timeout = 'string' == typeof(timeout) ? parseInt(timeout) : timeout;
            timeout = timeout <= 0 ? 60 : timeout;
            delete parameters['p_type'];
            delete parameters['s_type'];
            delete parameters['p_id'];
            delete parameters['s_id'];
            delete parameters['timeout'];
            let metadata = parameters;
            INFO(`emit-data: ${p_type}/${p_id}/${s_type}/${s_id} => timeout: ${timeout} => context: ${JSON.stringify(context)}, metadata => ${JSON.stringify(metadata)}`);
            let key = `${p_type}/${p_id}/${s_type}/${s_id}`;
            var po = this.peripheralMapping[key];
            let now = (new Date()).getTime();
            if (po) {
                this.emitData(p_type, p_id, s_type, s_id, context);
                po.updated_at = now;
            }
            else {
                po = {p_type, p_id, s_type, s_id, timeout, key};
                this.peripherals.push(po);
                this.peripheralMapping[key] = po;
                this.emitPeripheralState(p_type, p_id, RELATIONSHIP_MANAGED, metadata);
                this.emitData(p_type, p_id, s_type, s_id, context);
                po.updated_at = now;
            }
            return done(null);
        }
        else {
            return done(null, `unsupported command: ${command}`);
        }
    }

}

module.exports = exports = Service;
}).call(this,require("path").join(__dirname,"src","index.js"))
},{"fs":undefined,"path":undefined}]},{},[1])(1)
});
