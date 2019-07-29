'use strict';
const net = require('net');
const CPU = require('./monitors/cpu');
const MEMORY = require('./monitors/memory');
const PORT = 9000;

global.connections = {};
global.index = 0;
global.monitors = [];

monitors.push(new CPU(1000));
monitors.push(new MEMORY(3000));

var BROADCAST = (evt, token1, token2, payload) => {
    var {index, connections} = global;
    var xs = Object.entries(connections);
    if (0 == xs.length) {
        return;
    }
    var timestamp = Date.now().toString();
    var id = index.toString();
    global.index = index + 1;
    var records = JSON.stringify(payload);
    var tokens = [id, timestamp, evt, token1, token2, records];
    var text = tokens.join('\t');

    for (let [name, c] of xs) {
        console.log(`sending to client (${name})`);
        c.write(`${text}\r\n`);
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
    c.write(`# hello-world\r\n`);
});

server.on('error', (err) => {
    console.dir(err);
});

server.listen(PORT, () => {
    console.log(`server is listening ${PORT} ...`);
});

monitors.forEach(m => {
    m.on('data-updated', (s_type, s_id, measurements) => {
        BROADCAST('sensor-updated', s_type, s_id, measurements);
    });
    m.start();
});
