'use strict';

/**
 * Get logger apis in ToeAgent
 */
var { DBG, ERR, WARN, INFO } = global.getLogger(__filename);

/**
 * Get the Agent class declaration from ToeAgent
 */
var { Agent } = global.getBundledModules();


class Demo2 extends Agent {

    constructor(dummy) {
        super(module);
        this.preferences['ps']['sensor_events'] = [];
        this.preferences['web']['commands'] = [
            {
                name: 'hello-world',
                help: 'show hello world at the console'
            },
            {
                name: 'show-emoji-number',
                help: 'show a number on emoji display'
            }
        ];
    }

    /**
     * Process a command request from web interface, either HTTP REST (POST)
     * or Websocket.
     *
     * HTTP REST (POST):
     *     When ToeAgent receives request from `/api/v3/c/[agent-class-name]/[command]`,
     *     the HTTP request are packed as arguments to this callback function. For example,
     *     when you use httpie tool to perform following request:
     *
     *       http http://127.0.0.1:6040/api/v3/c/TestAgent/hello-world \
     *         user==root \
     *         date==$(date '+%Y%m%d') \
     *         message=great \
     *         value:=23 \
     *         verbose:=true
     *
     *     Then, the function shall receive following arguments:
     *
     *         remote    : {'type': 'unknown', 'ip': '127.0.0.1', 'port': 65291}
     *         command   : 'hello-world'
     *         parameters: {'user': 'root', 'date': '20171214'}
     *         context   : {'message': 'great', 'value': 23, 'verbose': true}
     *
     *
     * Websocket:
     *     ...
     *
     * @remote     the information about remote client which issues this command
     *             request.
     *
     * @command    the name of command to be proceeded.
     *
     * @parameters the dictionary object of parameters for the command, composed from
     *             the query string of HTTP request. By default, it is `{}`.
     *
     * @context    the json object of the context for the command, derived from
     *             the POST body of HTTP request. By default, it is `{}`.
     *
     * @done       callback function to indicate ToeAgent when the command processing
     *             is finished. 1st argument as error, while 2nd argument as
     *             processing results to be sent back to remote client. 2nd argument
     *             shall be a JSON object, or a `null`.
     */
    processWebCommand(remote, command, parameters, context, done) {
        if ('hello-world' == command) {
            return this.processHelloWorld(remote, parameters, context, done);
        }
        else if ('show-emoji-number' == command) {
            return this.processShowEmojiNumbber(remote, parameters, context, done);
        }
        else {
            return done(`unsupported command: ${command}`);
        }
    }

    processHelloWorld(remote, parameters, context, done) {
        INFO(`processHelloWorld: (${(JSON.stringify(remote)).yellow}), parameters: ${(JSON.stringify(parameters)).cyan}, context: ${(JSON.stringify(context)).green}`);
        var timestamp = new Date();
        return done(null, { timestamp, parameters, context });
    }

    processShowEmojiNumbber(remote, parameters, context, done) {
        INFO(`processShowEmojiNumbber: (${(JSON.stringify(remote)).yellow}), parameters: ${(JSON.stringify(parameters)).cyan}, context: ${(JSON.stringify(context)).green}`);
        var { jarvis } = this;
        var { value } = context;
        if (value) {
            var t = typeof (value);
            if ('number' == t) {
                var v = Math.floor(value);
                jarvis.performActuatorAction('sensorboard', 'ttyO1', 'emoji', '_', 'show_number', v, null, null, (err) => {
                    return done(err);
                });
            }
            else {
                return done(`value field in request body is not a number, but ${t}`);
            }
        }
        else {
            return done(`missing value field in HTTP request body as context`);
        }
    }
}

module.exports = exports = Demo2;