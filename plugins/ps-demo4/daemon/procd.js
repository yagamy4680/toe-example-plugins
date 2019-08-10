'use strict';
const os = require('os');
const net = require('net');
const CPU = require('./monitors/cpu');
const MEMORY = require('./monitors/memory');
const PORT = 9000;

global.connections = {};
global.index = 0;
global.monitors = [];
global.metadata = {};

monitors.push(new CPU(1000));
monitors.push(new MEMORY(3000));

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

const server = net.createServer({}, (c) => {
    var name = `${c.remoteAddress}:${c.remotePort}`;
    global.connections[name] = c;
    console.log(`client from ${name} connected!!`);
    c.on('end', () => {
        console.log(`client from ${name} disconnected`);
        delete global.connections[name];
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
