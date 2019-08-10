## demo4

The plugin is derived from [ps-demo2](../ps-demo2), but running sensor data measurement logics in separate process with tcp daemon. The plugin utilizes SensorWeb's `pipe` feature (as tcp client) to connect to the sensor process via tcp connection.

`Pipe` in SensorWeb is the tcp connection to remote/local TCP server, that supports bi-direction data transmission. Comparing to the standard tcp connection, `Pipe` in SensorWeb offers these additional functionalities:

- support both **byline** and **raw** packet reading
- support auto-reconnect
- support data monitoring for bi-direction transmission



### Tcp Daemon for Sensor Data

The source codes of tcp daemon are located [daemon](./daemon), and its entry point is `daemon/procd.js`:

```text
$  find daemon
daemon
daemon/monitors
daemon/monitors/cpu.js
daemon/monitors/os.js
daemon/monitors/memory.js
daemon/monitors/base.js
daemon/procd.js
```

To startup Tcp daemon process, just ask nodejs to run `procd.js`, that listens port number 9000:

```text
$ node daemon/procd.js
server is listening 9000 ...
```

Then, you can simply telnet to port 9000 to receive sensor data updates:

```text
$  telnet localhost 9000
Trying ::1...
Connected to localhost.
Escape character is '^]'.
# hello-world
0	1564484673651	sensor-updated	cpu	0	{"user":4964,"system":583}
1	1564484674638	sensor-updated	memory	0	{"rss":21962752,"heapTotal":7684096,"heapUsed":5161256,"external":8240}
2	1564484674657	sensor-updated	cpu	0	{"user":5895,"system":1110}
3	1564484675660	sensor-updated	cpu	0	{"user":6226,"system":1195}
^]
telnet> quit
Connection closed.
```

The protocol for this tcp daemon is line-separated CSV+JSON. 

- All packets are text-based, that means only ASCII 0x30 ~ 0x7F characters are allowed in packet content.
- `\r\n` is used to separate packets.
- There are 2 types of packets: COMMENT and DATA
- **COMMENT** packet starts with `#` character. Entire packet content except 1st character is the verbose message from Tcp daemon
- **DATA** packet contains 5 fields, and `\t` is used to separate fields.
  1. `id`, the auto-incremental identity
  2. `epoch`, the timestamp when the packet is sent out
  3. `evt`, the event of this packet to carry
  4. `token1`, the 1st token for this event
  5. `token2`, the 2nd token for this event
  6. `payload`, the payload of this event, in JSON format (single line)
  
```text
id \t epoch \t evt \t token1 \t token2 \t payload \r\n
id \t epoch \t evt \t token1 \t token2 \t payload \r\n
```

Here are supported events in DATA packet:

- `sensor-update`, indicates a DATA packet with sensor udpate event with measurement
  - `token1` is the sensor type
  - `token2` is the sensor id
  - `payload` is the measured data for this sensor udpate event
- `peripheral-updated`, indicates a DATA packet with peripheral object update event
  - `token1` is the peripheral id, that we use `process.pid` as identity of peripheral object
  - `token2` is the ppid.
  - `payload` is the metadata for the peripheral object

### Compile Schema

Same as [ps-demo2](../ps-demo2).


### Plugin with Pipe

In the constructor of peripheral service, the `mode` needs to configure as `MODE_PIPE`, and specify the pipe information in the field `mode_settings`:

```javascript
const PIPE_NAME = 'aaa';
constructor(opts, uptime, pmodule) {
    super(opts, uptime, pmodule, require('./schema.json'));
    this.pid = process.pid.toString();
    this.mode = MODE_PIPE;
    this.mode_settings = {
        pipes: [
            { name: PIPE_NAME, byline: true }
        ]
    };
}
```

In this plugin, it's assumed that the PIPE `aaa` is connecting to remote tcp daemon that measures cpu and memory sensor data regularly, and the communication protocol is `line` based. The bash script [run-sensorweb-with-extra-tcp](./run-sensorweb-with-extra-tcp) can help configure SensorWeb for the additional PIPE required by this plugin. The bash script has 3 arguments:

```text
run-sensorweb-with-extra-tcp  [PIPE NAME]  [REMOTE SERVER ADDRESS]  [REMOTE SERVER PORT]
```

So, running SensorWeb with following command can configure SensorWeb to start a PIPE named `aaa` to remote tcp server at `192.168.1.100:8080`:

```bash
$ ./run-sensorweb-with-extra-tcp aaa 192.168.1.100 8080
```

After the pipe is established, the callback function `atPipeEstablished` of peripheral service is called:

```javascript
/**
 * Indicates the PIPE with TcpProxy bridge is established. After this callback,
 * the implementation of PeripheralService might receive data from PIPE, or
 * can send data to PIPE.
 * 
 * @param {*} name                  the name of tcp-proxy's bridge
 * @param {*} metadata              the meta information for the bridge
 */
atPipeEstablished(name, metadata) {
    INFO(`${name}: pipe established => ${JSON.stringify(metadata)}`);
    this.emitPeripheralState(this.types[0], this.pid, RELATIONSHIP_MANAGED, metadata);
}
```

Then, when SensorWeb receives tcp packet from remote tcp server, the callback function `atPipeData` of peripheral service is called:

```javascript
/**
 * Process the data from pipe, either LINE or BUFFER.
 * 
 * @param {string} name             the name of tcp-proxy's bridge, whose communicator's connection
 *                                  receives these data, and forward to PeripheralService to
 *                                  process. E.g. `sb0`, `bm0`...
 * 
 * @param {string or buffer} data   the data to be sent to communicator's connection. Might be string or 
 *                                  buffer object.
 * 
 * @param {boolean} byline          `false` indicates the `data` parameter is an Buffer object with binary data,
 *                                  `true` indicates the `data` parameter is a String with text data.
 */
atPipeData(name, data, byline = yes) {
    var tokens = data.split('\t');
    var [id, timestamp, evt, token1, token2, payload] = tokens
    if (evt != 'sensor-updated') {
        return;
    }
    timestamp = new Date(parseInt(timestamp));
    INFO(`${name} <- ${id.blue} ${timestamp.toISOString()} ${evt.yellow} ${token1.cyan} ${token2.green} ${payload.red}`);
    payload = JSON.parse(payload);
    this.emitData(this.types[0], this.pid, token1, token2, payload);
}
```



### Build Javascript Bundle

Same as [ps-demo2](../ps-demo2).



### Run SensorWeb on Docker

Then, let's simply start SensorWeb to connect to the local tcp daemon to receive sensor data updates:

```text
$ ES6=true \
  YAPPS_DUMP_LOADED_CONFIG=true \
  ./run-sensorweb-with-extra-tcp \
    aaa \
    host.docker.internal \
    9000
```

Please note, 

- `ES6=true` indicates SensorWeb to load plugin from `src/index.js` (instead of `lib/index.js`)
- `YAPPS_DUMP_LOADED_CONFIG` asks SensorWeb to dump entire config (including pipe configurations) before loading plugins
- `host.docker.internal` is a special domain name pointing to your host computer that runs SensorWeb docker instance. Refer to official [Docker documentation](https://docs.docker.com/docker-for-mac/networking/) for details. If the tcp daemon for sensor data is running in another computer, you can specify the ip address (e.g. 192.168.1.100) or domain name in 2nd commandline argument.

Here are startup logs:

```text
$  ES6=true YAPPS_DUMP_LOADED_CONFIG=true ./run-sensorweb-with-extra-tcp aaa host.docker.internal 9000
SCRIPT_CURRENT_NAME = run-sensorweb-with-extra-tcp
SCRIPT_BASE_NAME = run-sensorweb
SCRIPT_SUBCOMMAND = with-extra-tcp
FUNC = run_with_extra_tcp
-o ^communicator.connections.aaa:ewogICJlbmFibGVkIjogdHJ1ZSwKICAidXJsIjogInRjcDovL2hvc3QuZG9ja2VyLmludGVybmFsOjkwMDAiLAogICJjaGFubmVsIjogbnVsbCwKICAiYnJvYWRjYXN0IjogZmFsc2UKfQo=
-o ^sock.servers.aaa:ewogICJ1cmkiOiAidGNwOi8vMC4wLjAuMDoxMDAwMCIsCiAgImxpbmUiOiB0cnVlCn0K
-o ^tcp-proxy.bridges.aaa:ewogICJtZXRhZGF0YSI6IHsKICAgICJndWVzcyI6IGZhbHNlLAogICAgImRlZmF1bHRzIjogewogICAgICAiZGV2aWNlIjogInJlbW90ZSIsCiAgICAgICJhcHAiOiAiYWFhIgogICAgfQogIH0KfQo=

launch script:

#!/bin/bash
#
docker run \
	-it \
	--init \
	--rm \
	--name sensor-web-test-0730-194950 \
	-p 6020:6020 -p 6021:6021 -p 6022:6022 -p 6023:6023 -p 6024:6024  \
	 \
	-v /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-example-plugins/plugins/ps-demo4:/opt/plugins/ps-demo4 \
	 \
	-e YAPPS_DUMP_LOADED_CONFIG=true \
	-e YAPPS_EXTRA_PERIPHERAL_SERVICES=/opt/plugins/ps-demo4/src \
	 \
	 \
	tictactoe/yapps.sensor-web:4.0.0 \
		node \
			--expose-gc \
			index.js \
				 \
				-b ps-manager.handlers.console.enabled=true -o ^communicator.connections.aaa:ewogICJlbmFibGVkIjogdHJ1ZSwKICAidXJsIjogInRjcDovL2hvc3QuZG9ja2VyLmludGVybmFsOjkwMDAiLAogICJjaGFubmVsIjogbnVsbCwKICAiYnJvYWRjYXN0IjogZmFsc2UKfQo= -o ^sock.servers.aaa:ewogICJ1cmkiOiAidGNwOi8vMC4wLjAuMDoxMDAwMCIsCiAgImxpbmUiOiB0cnVlCn0K -o ^tcp-proxy.bridges.aaa:ewogICJtZXRhZGF0YSI6IHsKICAgICJndWVzcyI6IGZhbHNlLAogICAgImRlZmF1bHRzIjogewogICAgICAiZGV2aWNlIjogInJlbW90ZSIsCiAgICAgICJhcHAiOiAiYWFhIgogICAgfQogIH0KfQo=

...

07/30 11:49:52 ps-manager                   [INFO] psw[demo2]: at-bridge-cc-connected() => true
07/30 11:49:52 ps-demo4::index              [INFO] aaa: pipe established => {"device":"remote","app":"aaa"}
07/30 11:49:52 ps-manager                   [INFO] [demo2] nodejs_process/6 => state: 2 =>
	device: remote
	app:    aaa

07/30 11:49:52 ps-demo4::index              [INFO] aaa <= # hello-world
07/30 11:49:52 ps-demo4::index              [INFO] aaa <= 11	1564487392801	sensor-updated	cpu	0	{"user":368634,"system":98408}
07/30 11:49:52 ps-demo4::index              [INFO] aaa <- 11 2019-07-30T11:49:52.801Z sensor-updated cpu 0 {"user":368634,"system":98408}
07/30 11:49:52 ps-evt-handlers::console     [INFO] [boot1://491767594ms] nodejs_process/6/cpu/0 => user=368634 system=98408

...
```


And, you can use HTTPie to get sensor data snapshot:

```text
$  http -v :6020/api/v3/d
GET /api/v3/d HTTP/1.1
Accept: */*
Accept-Encoding: gzip, deflate
Connection: keep-alive
Host: localhost:6020
User-Agent: HTTPie/0.9.9



HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 221
Content-Type: application/json; charset=utf-8
Date: Tue, 30 Jul 2019 11:50:55 GMT
ETag: W/"dd-BEXBCF+bj4b/RxJexfZHIw"
X-Powered-By: Express

{
    "code": 0,
    "data": {
        "nodejs_process": {
            "7": {
                "cpu": {
                    "0": {
                        "system": 101587,
                        "user": 378913
                    }
                },
                "memory": {
                    "0": {
                        "external": 8240,
                        "heapTotal": 7684096,
                        "heapUsed": 5870400,
                        "rss": 23773184
                    }
                }
            }
        }
    },
    "error": null,
    "message": null,
    "url": "/api/v3/d"
}
```



## TODO

- [x] Change schema name from `demo2` to `demo4`
- [ ] Add actuator action support to plugin and tcp-daemon
- [ ] Add `atPipeDisconnected` event
- [x] Add peripheral object state update (using same process id as tcp-daemon)