'use strict';
const os = require('os');
const net = require('net');
const CPU = require('./monitors/cpu');
const MEMORY = require('./monitors/memory');
const OS = require('./monitors/os');
const PORT = 9000;

global.connections = {};
global.index = 0;
global.monitors = [];
global.metadata = {};

// Ensure the tcp daemon is running with nodejs v10+.
//
const version = parseInt(process.version.substring(1).split('.')[0]);
if (version < 10) {
    console.log(`current nodejs version is ${process.version}, please run the tcp daemon with nodejs v10+ in order to use os.setPriority() API ...`);
    process.exit(1);
}
else {
    console.log(`current nodejs version is ${process.version} => checked.`)
}

// Configure the current daemon process with PRIORITY_BELOW_NORMAL
// 
os.setPriority(os.constants.priority['PRIORITY_BELOW_NORMAL']);

var osm = new OS(5000);

global.monitors.push(new CPU(1000));
global.monitors.push(new MEMORY(3000));
global.monitors.push(osm);

var SERIALIZE_DATA = (evt, token1, token2, payload) => {
    var timestamp = Date.now().toString();
    var index = global.index.toString();
    var records = JSON.stringify(payload);
    var tokens = [index, timestamp, evt, token1, token2, records];
    var text = tokens.join('\t');
    return text;
};

var SERIALIZE_COMMENT = (message) => {
    return `#\t${message}`;
};

var SEND_PACKET = (c, text) => {
    c.write(`${text}\r\n`);
};

var BROADCAST = (evt, token1, token2, payload) => {
    var {connections} = global;
    var xs = Object.entries(connections);
    if (0 == xs.length) {
        return;
    }
    var text = SERIALIZE_DATA(evt, token1, token2, payload);
    global.index = global.index + 1;

    for (let [name, c] of xs) {
        console.log(`sending to client (${name})`);
        SEND_PACKET(c, text);
    }
};

var HANLDE_INCOMING_PACKET = (connection, evt, token1, token2, payload) => {
    if (evt == "actuator-action") {
        var a_type = token1;
        var a_id = token2;
        var {action, value} = payload;
        console.log(`receive actuator request => ${a_type}/${a_id}/${action} => ${value}`);
        if (a_type == "os" && a_id == "current" && action == "set_priority") {
            return osm.setPriority(value);
        }
    }
};

var PARSE_RAW_PACKET = (connection, text) => {
    if ("" == text.trim()) {
        /** Ignore empty/blank string */
        return;
    }
    // console.log(`incoming packet: ${text}`);
    var tokens = text.split('\t');
    var payload = {};
    // console.log(`incoming packet: (tokenized) => ${JSON.stringify(tokens)}`);
    var [index, timestamp, evt, token1, token2, records] = tokens;
    if (records && records != "") {
        var payload = JSON.parse(records);
    }
    var xs = {index, timestamp, evt, token1, token2, records};
    // console.log(`incoming packet: (parsed) => ${JSON.stringify(xs)}`);
    return HANLDE_INCOMING_PACKET(connection, evt, token1, token2, payload);
};

const server = net.createServer({}, (c) => {
    var name = `${c.remoteAddress}:${c.remotePort}`;
    var queue = [];
    global.connections[name] = c;
    console.log(`client from ${name} connected!!`);
    c.on('end', () => {
        console.log(`client from ${name} disconnected`);
        delete global.connections[name];
    });
    c.on('data', (buffer) => {
        console.log(`incoming ${buffer.length} bytes`);
        /**
         * Read all bytes from the TCP connection, and 
         * recognize packet by detecting `\n` character.
         */
        var xs = Array.from(buffer);
        for (let index = 0; index < xs.length; index++) {
            const c = xs[index];
            if (c == 10) {
                var b = Buffer.from(queue);
                PARSE_RAW_PACKET(c, b.toString());
                queue.splice(0, queue.length);
                continue;
            }
            else {
                queue.push(c);
            }
        }
    });
    SEND_PACKET(c, SERIALIZE_COMMENT("hello-world"));
    SEND_PACKET(c, SERIALIZE_DATA('peripheral-updated', process.pid.toString(), process.ppid.toString(), global.metadata));
});

server.on('error', (err) => {
    console.dir(err);
});

server.listen(PORT, () => {
    var architecture = os.arch();
    var endianness = os.endianness();
    var platform = os.platform();
    var release = os.release();
    var system = {platform, release, endianness};
    var user = os.userInfo();
    global.metadata = {architecture, system, user};
    console.log(`server is listening ${PORT} ...`);
});

monitors.forEach(m => {
    m.on('data-updated', (s_type, s_id, measurements) => {
        BROADCAST('sensor-updated', s_type, s_id, measurements);
    });
    m.start();
});
