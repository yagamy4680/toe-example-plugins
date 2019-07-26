## demo2

The plugin demonstrates how to implement [PeripheralService](../../docs/peripheral-service.ls) with regular sensor data updates with CPU usage of current nodejs process, based on the 2nd version of schema format. Here are implemented features:

- notify SensorWeb3 a sensor update event every 2 seconds, with `cpuUsage` data, under these tags
  - peripheral-type: `nodejs_processs`
  - peripheral-id: `process.pid`
  - sensor-type: `cpu`
  - sensor-id: `0`
- cpu usage data contains these fields
  - `user`
  - `system`
- notify SensorWeb3 about the peripheral managing state.

Here are sample data when the plugin is running inside SensorWeb3:

```text
$ telnet localhost 6021
Trying ::1...
Connected to localhost.
Escape character is '^]'.
2019-07-26T20:14:11.691Z	ps-sensor-updated	boot1://204951880ms	nodejs_process/6/cpu/0	user=90000	system=40000
2019-07-26T20:14:13.688Z	ps-sensor-updated	boot1://204953875ms	nodejs_process/6/memory/0	rss=48713728	heapTotal=24735744	heapUsed=20154328	external=25008
2019-07-26T20:14:13.689Z	ps-sensor-updated	boot1://204953878ms	nodejs_process/6/os/current	freeMemory=190070784	uptime=204953
2019-07-26T20:14:13.692Z	ps-sensor-updated	boot1://204953881ms	nodejs_process/6/cpu/0	user=120000	system=120000
2019-07-26T20:14:15.700Z	ps-sensor-updated	boot1://204955889ms	nodejs_process/6/cpu/0	user=120000	system=120000
^]
telnet> quit
Connection closed.
```


### Compile Schema

The v2 schema is still based on [Livescript](http://livescript.net/), and here is the schema [demo2.ls](./assets/schema/demo2.ls):

```livescript
class NodejsProcess extends SchemaBaseClass
  cpu:
    * field: \user      , unit: \bytes  , value: [\int, [0, 4294967296]]
    * field: \system    , unit: \bytes  , value: [\int, [0, 4294967296]]

  memory:
    * field: \rss       , unit: \bytes  , value: [\int, [0, 4294967296]]
    * field: \heapTotal , unit: \bytes  , value: [\int, [0, 4294967296]]
    * field: \heapUsed  , unit: \bytes  , value: [\int, [0, 4294967296]]
    * field: \external  , unit: \bytes  , value: [\int, [0, 4294967296]]

  os:
    * field: \freeMemory, unit: \bytes  , value: [\int, [0, 4294967296]]
    * field: \uptime    , unit: \seconds, value: [\int, [0, 4294967296]]

  ->
    super!
    @
      ##
      # Declare the instances (with unique identities) of each sensor type
      #
      .declareSensorIdentities \cpu     , <[0]>
      .declareSensorIdentities \memory  , <[0]>
      .declareSensorIdentities \os      , <[current]>
```

To compile schema (parse Livescript to produce schema IR file in JSON format), you need to download https://github.com/t2t-io/tic-data-toolkit. Here are setup instructions:

```bash
$ cd /opt
$ git clone https://github.com/t2t-io/tic-data-toolkit.git
$ cd /opt/tic-data-toolkit
$ npm install
```

Here is example to compile schema:

```text
$ /opt/tic-data-toolkit/bin/cli.ls schema2ir /tmp/toe-example-plugins/plugins/ps-demo2/assets/schema/demo2.ls
2019/07/27 04:24:04 tic-data-toolkit::schema2ir  [INFO] output => /tmp/toe-example-plugins/plugins/ps-demo2/assets/schema
2019/07/27 04:24:04 tic-data-toolkit::schema2ir  [INFO] file => /tmp/toe-example-plugins/plugins/ps-demo2/assets/schema/demo2.ls
2019/07/27 04:24:04 tic-data-toolkit::schema-parser [INFO] these variables shall be ignored: MANIFEST
2019/07/27 04:24:04 tic-data-toolkit::schema-parser [INFO] load classes in order: NodejsProcess
2019/07/27 04:24:04 tic-data-toolkit::schema-parser [INFO] nodejs_process/_/cpu/[0] => fields: [{"field":"user","unit":"bytes","value":["int",[0,4294967296]]},{"field":"system","unit":"bytes","value":["int",[0,4294967296]]}]
2019/07/27 04:24:04 tic-data-toolkit::schema-parser [INFO] nodejs_process/_/memory/[0] => fields: [{"field":"rss","unit":"bytes","value":["int",[0,4294967296]]},{"field":"heapTotal","unit":"bytes","value":["int",[0,4294967296]]},{"field":"heapUsed","unit":"bytes","value":["int",[0,4294967296]]},{"field":"external","unit":"bytes","value":["int",[0,4294967296]]}]
2019/07/27 04:24:04 tic-data-toolkit::schema-parser [INFO] nodejs_process/_/os/[current] => fields: [{"field":"freeMemory","unit":"bytes","value":["int",[0,4294967296]]},{"field":"uptime","unit":"seconds","value":["int",[0,4294967296]]}]
2019/07/27 04:24:04 tic-data-toolkit::schema2ir  [INFO] writing /tmp/toe-example-plugins/plugins/ps-demo2/assets/schema/demo2.js with 3522 bytes
2019/07/27 04:24:04 tic-data-toolkit::schema2ir  [INFO] writing /tmp/toe-example-plugins/plugins/ps-demo2/assets/schema/demo2.js.colored with 10404 bytes
2019/07/27 04:24:04 tic-data-toolkit::schema2ir  [INFO] writing /tmp/toe-example-plugins/plugins/ps-demo2/assets/schema/demo2.ir.json with 2871 bytes
2019/07/27 04:24:04 tic-data-toolkit::schema2ir  [INFO] writing /tmp/toe-example-plugins/plugins/ps-demo2/assets/schema/demo2.ir.yaml with 2351 bytes
2019/07/27 04:24:04 tic-data-toolkit::schema2ir  [INFO] done.
```

The compiled schema can be found here: [demo2.ir.json](./assets/schema/demo2.ir.json).


### Build Javascript Bundle

The plugin is written in ES6, and the build script of npm can compile all ES6 scripts to ES5 and bundle all of them together to produce single javascript file:

```text
$  ls -al ./lib
total 88
drwxr-xr-x   7 yagamy  staff    224 Jul 27 01:37 .
drwxr-xr-x  15 yagamy  staff    480 Jul 27 04:16 ..
-rw-r--r--   1 yagamy  staff  15262 Jul 27 01:37 bundle.js
-rw-r--r--   1 yagamy  staff   5125 Jul 27 01:37 bundle.min.js
-rw-r--r--   1 yagamy  staff  14135 Jul 27 01:37 bundle.pretty.js
-rw-r--r--   1 yagamy  staff    198 Jul 27 01:37 index.js
lrwxr-xr-x   1 yagamy  staff     30 Oct 12  2018 schema.json -> ../assets/schema/demo2.ir.json
```

The bundled (and minified) javascript is located at `ps-demo2/lib/bundle.min.js`. The bundled javascript is loaded by `lib/index.js`:

```javascript
$  cat lib/index.js
var Service = require('./bundle.min');
class WrapperService extends Service {
    constructor(opts, uptime) {
        super(opts, uptime, module);
    }
};
module.exports = exports = WrapperService;
```

To perform build script, please run `npm run build`:


### Run SensorWeb3 on Docker

Just simply type `./run-sensorweb3-standalone`, that shall startup a SensorWeb3 instance in Docker environment, and ask it to load this plugin for execution. Please note, by default, the entry point of this plugin is `lib/index.js` that means you always need to build javascript bundle before running SensorWeb3.

If you want to run SensorWeb3 to directly load javascript source (ES6 at `src/index.js`), please run `ES6=true ./run-sensorweb3-standalone`:

```text
$  ES6=true ./run-sensorweb3-standalone
SCRIPT_CURRENT_NAME = run-sensorweb3-standalone
SCRIPT_BASE_NAME = run-sensorweb3
SCRIPT_SUBCOMMAND = standalone
FUNC = run_standalone
launch script:

#!/bin/bash
#
docker run \
	-it \
	--init \
	--rm \
	--name sensor-web3-test-0727-043001 \
	-p 6020:6020 -p 6021:6021 -p 6022:6022 -p 6023:6023 -p 6024:6024  \
	 \
	-v /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-example-plugins/plugins/ps-demo2:/opt/plugins/ps-demo2 \
	 \
	-e YAPPS_DUMP_LOADED_CONFIG=false \
	-e YAPPS_EXTRA_PERIPHERAL_SERVICES=/opt/plugins/ps-demo2/src \
	 \
	 \
	tictactoe/yapps.sensor-web3:3.9.7 \
		node \
			--expose-gc \
			index.js \
				 \
				-b ps-manager.handlers.console.enabled=true

[yapps-loader] => begin => 1564173002842 (2019-07-26T20:30:02.842Z)
[yapps] arguments: ["/usr/local/bin/node","/yapps/index.js","-b","ps-manager.handlers.console.enabled=true"]
[yapps] environment variables:
	YAPPS_DUMP_LOADED_CONFIG: false
	YAPPS_EXTRA_PERIPHERAL_SERVICES: /opt/plugins/ps-demo2/src

[yapps] argv => {"_":[],"h":false,"v":false,"verbose":false,"q":false,"quiet":false,"b":"ps-manager.handlers.console.enabled=true","config_bool":["ps-manager.handlers.console.enabled=true","ps-manager.handlers.console.enabled=true"],"c":"default","config":["default","default"],"p":null,"pidfile":[null,null],"u":null,"unixsock":[null,null],"d":false,"deployment":false,"$0":"/usr/local/bin/node ./index.js"}
[logger] y-module-dir = /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/y_modules
07/26 20:30:03 yapps::system-uptime         [INFO] retrieve 205904360ms from /proc/uptime
07/26 20:30:03 yapps::inner                 [INFO] application name: yapps
07/26 20:30:03 yapps::WebApp                [INFO] web-app initiates
module._extensions[.js]
module._extensions[.json]
module._extensions[.node]
module._extensions[.ls]
07/26 20:30:03 yapps::BaseApp               [INFO] applying ps-manager.handlers.console.enabled = true
07/26 20:30:03 yapps::BaseApp               [INFO] applied ps-manager.handlers.console.enabled = true
07/26 20:30:03 yapps::BaseApp               [INFO] writing /tmp/yapps/yapps.pid with 6
07/26 20:30:03 yapps::BaseApp               [INFO] writing /tmp/yapps/yapps.pid.ppid with 1
07/26 20:30:03 yapps::web                   [INFO] user's configs: {"appName":"yapps","appPackageJson":{"author":{"name":["t2t inc."],"email":"yagamy@t2t.io"},"description":"N/A","name":"sensor-web3","version":"3.9.7","engines":{"node":"8.11.1"},"dependencies":{"livescript":"1.4.0","socket.io":"2.0.4","source-map-support":"0.3.2","systeminformation":"4.14.4"},"yapp":{"encloses":{"colors":"1.1.2","async":"1.4.2","eventemitter2":"0.4.14","moment":"2.10.6","optimist":"0.6.1","uid":"0.0.2","uuid":"3.2.1","utf8":"2.1.2","prettyjson":"1.1.3","semver":"5.5.0","js-yaml":"3.11.0","body-parser":"1.14.1","express":"4.13.3","handlebars":"4.0.3","byline":"4.2.1","through":"2.3.8"}}},"appCtrlSock":"unix:///tmp/yapps/yapps.sock","host":"0.0.0.0","port":6020,"api":3,"auth":false,"headless":true,"express_partial_response":false,"express_method_overrid":false,"express_multer":false}
07/26 20:30:03 yapps::web                   [INFO] default configs: {"port":6010,"host":"0.0.0.0","auth":true,"headless":true,"cors":false,"view_verbose":false,"api":1,"upload_path":"/yapps/work/web/upload","express_partial_response":true,"express_method_overrid":true,"express_multer":true,"ws":{}}
07/26 20:30:03 yapps::web                   [INFO] merged configs: {"port":6020,"host":"0.0.0.0","auth":false,"headless":true,"cors":false,"view_verbose":false,"api":3,"upload_path":"/yapps/work/web/upload","express_partial_response":false,"express_method_overrid":false,"express_multer":false,"ws":{},"appName":"yapps","appPackageJson":{"author":{"name":["t2t inc."],"email":"yagamy@t2t.io"},"description":"N/A","name":"sensor-web3","version":"3.9.7","engines":{"node":"8.11.1"},"dependencies":{"livescript":"1.4.0","socket.io":"2.0.4","source-map-support":"0.3.2","systeminformation":"4.14.4"},"yapp":{"encloses":{"colors":"1.1.2","async":"1.4.2","eventemitter2":"0.4.14","moment":"2.10.6","optimist":"0.6.1","uid":"0.0.2","uuid":"3.2.1","utf8":"2.1.2","prettyjson":"1.1.3","semver":"5.5.0","js-yaml":"3.11.0","body-parser":"1.14.1","express":"4.13.3","handlebars":"4.0.3","byline":"4.2.1","through":"2.3.8"}}},"appCtrlSock":"unix:///tmp/yapps/yapps.sock"}
07/26 20:30:03 system-info                  [INFO] ttt => profile:misc, profile_version:19700101z
07/26 20:30:03 system-info                  [INFO] context => ttt:{"profile":"misc","profile_version":"19700101z"}
07/26 20:30:03 ps-manager                   [INFO] opts => {"appName":"yapps","appPackageJson":{"author":{"name":["t2t inc."],"email":"yagamy@t2t.io"},"description":"N/A","name":"sensor-web3","version":"3.9.7","engines":{"node":"8.11.1"},"dependencies":{"livescript":"1.4.0","socket.io":"2.0.4","source-map-support":"0.3.2","systeminformation":"4.14.4"},"yapp":{"encloses":{"colors":"1.1.2","async":"1.4.2","eventemitter2":"0.4.14","moment":"2.10.6","optimist":"0.6.1","uid":"0.0.2","uuid":"3.2.1","utf8":"2.1.2","prettyjson":"1.1.3","semver":"5.5.0","js-yaml":"3.11.0","body-parser":"1.14.1","express":"4.13.3","handlebars":"4.0.3","byline":"4.2.1","through":"2.3.8"}}},"appCtrlSock":"unix:///tmp/yapps/yapps.sock","verbose":true,"policy":{"bad_sensor_data":"reject","schema_strict_sensor_type":false,"schema_strict_sensor_id":false},"handlers":{"console":{"enabled":true,"excluded_p_types":["mainboard","sensorboard"]},"debug":{"enabled":true,"server_name":"ps"},"storage":{"enabled":true,"sync_dir":"/yapps/tmp"},"sock":{"enabled":true,"sensor":{"server_name":"ps_s_data"},"peripheral":{"server_name":"ps_p_data"},"app":{"server_name":"ps_app_data","p_types":["linux"]}}}}
07/26 20:30:03 yapps::system-uptime         [INFO] detect boots from /opt/ys/share/timestamp: 1 (fallback to '0' because of err: Error: ENOENT: no such file or directory, scandir '/opt/ys/share/timestamp')
07/26 20:30:03 yapps::system-uptime         [INFO] boots: 1 times
07/26 20:30:03 yapps::system-uptime         [INFO] system: 205904360ms
07/26 20:30:03 yapps::system-uptime         [INFO] app: 325ms
07/26 20:30:03 yapps::sock                  [INFO] sock[ps]: listening tcp://0.0.0.0:6021
07/26 20:30:03 yapps::sock                  [INFO] sock[ps_s_data]: listening tcp://0.0.0.0:6022
07/26 20:30:03 yapps::sock                  [INFO] sock[ps_p_data]: listening tcp://0.0.0.0:6023
07/26 20:30:03 yapps::sock                  [INFO] sock[ps_app_data]: listening tcp://0.0.0.0:6024
07/26 20:30:03 yapps::sock                  [INFO] sock[sb0]: listening tcp://0.0.0.0:10011
07/26 20:30:03 yapps::sock                  [INFO] sock[bm0]: listening tcp://0.0.0.0:10014
07/26 20:30:03 yapps::sock                  [INFO] sock[bm1]: listening tcp://0.0.0.0:10024
07/26 20:30:03 yapps::sock                  [INFO] sock[stats]: listening tcp://0.0.0.0:10020
07/26 20:30:03 yapps::sock                  [INFO] listening /tmp/yap/yapps.sb0.sock
07/26 20:30:03 yapps::sock                  [INFO] listening /tmp/yap/yapps.bm0.sock
07/26 20:30:03 system-helpers               [INFO] successfully initiate an instance of regular-gc
07/26 20:30:03 system-helpers               [INFO] successfully initiate an instance of dump-info-service
07/26 20:30:03 system-helpers::regular-gc   [INFO] period = 180
07/26 20:30:03 system-info                  [WARN] Error: ENOENT: no such file or directory, open '/tmp/ttt_system'
07/26 20:30:03 system-info                  [WARN] failed to read /tmp/ttt_system
07/26 20:30:03 system-info                  [INFO] ttt.id is empty => false
07/26 20:30:03 system-info                  [INFO] ttt.id is null => false
07/26 20:30:03 system-info                  [INFO] ttt => {"profile":"misc","profile_version":"19700101z"}
07/26 20:30:03 system-info                  [INFO] context: {"ttt":{"profile":"misc","profile_version":"19700101z"},"runtime":{"node_version":"v8.12.0","node_arch":"x64","node_platform":"linux"},"cwd":"/yapps","mac_address":"0242ac110002","iface":{"name":"eth0","iface":{"ipv4":"172.17.0.2","mac":"02:42:ac:11:00:02"}},"interfaces":[{"iface":"lo","ifaceName":"lo","ip4":"127.0.0.1","ip6":"","mac":"","internal":true,"virtual":false,"operstate":"unknown","type":"virtual","duplex":"","mtu":65536,"speed":-1,"carrierChanges":0},{"iface":"eth0","ifaceName":"eth0","ip4":"172.17.0.2","ip6":"","mac":"02:42:ac:11:00:02","internal":false,"virtual":false,"operstate":"up","type":"wired","duplex":"full","mtu":1500,"speed":10000,"carrierChanges":2}],"distro":{"name":"linux--","arch":"x86_64","uname":{"kernel":"linux","architecture":"x86_64","release":"4.9.125-linuxkit"},"dist":{"name":"","codename":""}},"system":{"manufacturer":"","model":"Docker Container","version":"1.0","serial":"None","uuid":"E66E4D4B-0000-0000-9015-3A859530BC31","sku":"-"},"cpu":{"manufacturer":"Intel®","brand":"Core™ i7-7920HQ","vendor":"","family":"","model":"","stepping":"","revision":"","voltage":"","speed":"3.10","speedmin":"","speedmax":"","cores":4,"physicalCores":0.25,"processors":4,"socket":"","cache":{"l1d":"","l1i":"","l2":"","l3":""}},"os":{"platform":"linux","distro":"Alpine Linux","release":"3.8.1","codename":"","kernel":"4.9.125-linuxkit","arch":"x64","hostname":"09e07f4559cf","codepage":"UTF-8","logofile":"alpine linux","serial":"09e07f4559cf","build":"","servicepack":""},"id":"09E07F4559CF_0242AC110002","instance_id":"09E07F4559CF_0242AC110002_6_16C2FF9E7F0"}
07/26 20:30:03 communicator                 [INFO] connections[sb0]: settings => {"enabled":false,"url":"tcp://127.0.0.1:10011","channel":null,"broadcast":false}
07/26 20:30:03 communicator                 [INFO] connections[sb0]: DISABLED!!
07/26 20:30:03 communicator                 [INFO] connections[bm0]: settings => {"enabled":false,"url":"tcp://127.0.0.1:10014","channel":null,"broadcast":true}
07/26 20:30:03 communicator                 [INFO] connections[bm0]: DISABLED!!
07/26 20:30:03 communicator                 [INFO] connections[bm1]: settings => {"enabled":false,"url":"tcp://0.0.0.0:10014","channel":null,"broadcast":true}
07/26 20:30:03 communicator                 [INFO] connections[bm1]: DISABLED!!
07/26 20:30:03 communicator                 [INFO] connections[stats]: settings => {"enabled":false,"url":"exec:///yapps/assets/scripts/linux-stats/stats","channel":null,"broadcast":false,"peer":"stderr","args":["a","b","c","d"],"cwd":"/yapps","env":{"WAIT_TIME":10,"SYS_STATS_CPU_PERCENTAGE_SENSOR_PERIOD":10,"SYS_STATS_CPU_ALL_PERCENTAGES_SENSOR_PERIOD":10,"SYS_STATS_CPU_TIMES_SENSOR_PERIOD":10,"SYS_STATS_CPU_FREQ_SENSOR_PERIOD":5,"SYS_STATS_VIRTUAL_MEMORY_SENSOR_PERIOD":60,"SYS_STATS_SWAP_MEMORY_SENSOR_PERIOD":28800,"SYS_STATS_DISK_PARTITION_SENSOR_PERIOD":86400,"SYS_STATS_DISK_USAGE_SENSOR_PERIOD":300,"SYS_STATS_DISK_IO_SENSOR_PERIOD":300,"SYS_STATS_PROCESS_SENSOR_PERIOD":8,"SYS_STATS_PROCESS_SENSOR_EXTRA_KEYWORDS":"sandbox","SYS_STATS_PROCESS_SENSOR_DISABLED_FIELDS":"num_threads,num_fds","SYS_STATS_SYSTEM_UPTIME_SENSOR_PERIOD":120,"SYS_STATS_NETWORK_IO_SENSOR_PERIOD":60,"SYS_STATS_ADVANCED_NETWORK_IO_SENSOR_PERIOD":60,"SYS_STATS_WIRELESS_SENSOR_PERIOD":5,"SYS_STATS_CURL_HTTP_STAT_SENSOR_PERIOD":60,"SYS_STATS_CURL_HTTP_STAT_SENSOR_URL":"https://fc.t2t.io"}}
07/26 20:30:03 communicator                 [INFO] connections[stats]: DISABLED!!
07/26 20:30:03 tcp-proxy                    [WARN] bridge[sb0] DISABLED because of missing communicator
07/26 20:30:03 tcp-proxy                    [WARN] bridge[bm0] DISABLED because of missing communicator
07/26 20:30:03 tcp-proxy                    [WARN] bridge[bm1] DISABLED because of missing communicator
07/26 20:30:03 tcp-proxy                    [WARN] bridge[stats] DISABLED because of missing communicator
07/26 20:30:03 ps-manager                   [INFO] names => ["console","debug","storage","sock"]
07/26 20:30:03 ps-evt-handlers::console     [INFO] enabled = true
07/26 20:30:03 ps-evt-handlers::debug       [INFO] enabled = true
07/26 20:30:03 ps-evt-handlers::debug       [INFO] server_name = ps
07/26 20:30:03 ps-evt-handlers::storage     [INFO] enabled = true
07/26 20:30:03 ps-evt-handlers::sock        [INFO] enabled = true
07/26 20:30:03 ps-evt-handlers::sock        [INFO] s: ps_s_data, p: ps_p_data, app: ps_app_data:(linux)
07/26 20:30:03 ps-manager                   [INFO] successfully initialized.
07/26 20:30:03 ps-impls::linux-stats        [WARN] DISABLED!!!
07/26 20:30:03 ps-impls::linux-wireless     [WARN] DISABLED!!!
07/26 20:30:03 blemo::index                 [WARN] missing these pipes in tcp-proxy: bm0, bm1
07/26 20:30:03 blemo::index                 [WARN] DISABLED!!!
07/26 20:30:03 ps-extras                    [INFO] loading external peripheral-service: /opt/plugins/ps-demo2/src
07/26 20:30:03 ps-demo2::index              [INFO] name => demo2
07/26 20:30:03 ps-demo2::index              [INFO] types => ["nodejs_process"]
07/26 20:30:03 ps-demo2::index              [INFO] schema =>
{"manifest":{"format":2,"name":"demo2","version":"0.0.1","created_at":"2019-07-26T20:24:04.600Z","checksum":"9fd30a4adbef9680eece4baeea96c14d3a26e2cc0b753765955963510b684353"},"content":{"peripheral_types":[{"p_type":"schema_base_class","p_type_parent":null,"class_name":"SchemaBaseClass","sensor_types":[]},{"p_type":"nodejs_process","p_type_parent":"schema_base_class","class_name":"NodejsProcess","sensor_types":[{"s_type":"cpu","s_identities":["0"],"fields":[{"name":"user","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"bytes","annotations":{}},{"name":"system","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"bytes","annotations":{}}],"actions":[]},{"s_type":"memory","s_identities":["0"],"fields":[{"name":"rss","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"bytes","annotations":{}},{"name":"heapTotal","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"bytes","annotations":{}},{"name":"heapUsed","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"bytes","annotations":{}},{"name":"external","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"bytes","annotations":{}}],"actions":[]},{"s_type":"os","s_identities":["current"],"fields":[{"name":"freeMemory","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"bytes","annotations":{}},{"name":"uptime","writeable":false,"value":{"type":"int","range":[0,4294967296]},"unit":"seconds","annotations":{}}],"actions":[]}]}]}}
07/26 20:30:03 ps-demo2::index              [INFO] add data listener for monitors[cpu]
07/26 20:30:03 ps-demo2::index              [INFO] add data listener for monitors[memory]
07/26 20:30:03 ps-demo2::index              [INFO] add data listener for monitors[os]
07/26 20:30:03 helpers::schema-ir-parser    [INFO] parser: __memory__, 2 peripheral types.
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading schema_base_class
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/cpu => 0
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/cpu/*/user => int, [0, 4294967296], unit:bytes,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/cpu/*/system => int, [0, 4294967296], unit:bytes,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/memory => 0
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/memory/*/rss => int, [0, 4294967296], unit:bytes,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/memory/*/heapTotal => int, [0, 4294967296], unit:bytes,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/memory/*/heapUsed => int, [0, 4294967296], unit:bytes,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/memory/*/external => int, [0, 4294967296], unit:bytes,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/os => current
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/os/*/freeMemory => int, [0, 4294967296], unit:bytes,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] loading nodejs_process/os/*/uptime => int, [0, 4294967296], unit:seconds,
07/26 20:30:03 helpers::schema-ir-parser    [INFO] init schema_base_class
07/26 20:30:03 helpers::schema-ir-parser    [INFO] init nodejs_process
07/26 20:30:03 helpers::schema-ir-parser    [INFO] init nodejs_process/cpu
07/26 20:30:03 helpers::schema-ir-parser    [INFO] init nodejs_process/memory
07/26 20:30:03 helpers::schema-ir-parser    [INFO] init nodejs_process/os
07/26 20:30:03 helpers::schema-ir-parser    [INFO] tree schema_base_class
07/26 20:30:03 helpers::schema-ir-parser    [INFO] tree     nodejs_process
07/26 20:30:03 ps-manager                   [INFO] psw[demo2]: register callback for peripheral-service[data-updated] event
07/26 20:30:03 ps-manager                   [INFO] psw[demo2]: register callback for peripheral-service[peripheral-updated] event
07/26 20:30:03 ps-manager                   [WARN] psw[demo2]: missing module object reference to initiate rootdir
07/26 20:30:03 ps-manager                   [INFO] psw[demo2]: register peripheral-type nodejs_process
07/26 20:30:03 ps-manager                   [INFO] psw[demo2]: pipe starts
07/26 20:30:03 ps-manager                   [INFO] psw[demo2]: self.ready = yes!!!
07/26 20:30:03 ps-manager                   [INFO] psw[demo2]: service registration is successfully done.
07/26 20:30:03 yapps::BaseApp               [INFO] yapps initialized.
07/26 20:30:03 ps-demo2::index              [INFO] the peripheral service is registered ...
07/26 20:30:03 ps-manager                   [INFO] [demo2] nodejs_process/6 => state: 2 =>
	ppid:        1
	versions:
	    http_parser: 2.8.0
	    node:        8.12.0
	    v8:          6.2.414.66
	    uv:          1.19.2
	    zlib:        1.2.11
	    ares:        1.10.1-DEV
	    modules:     57
	    nghttp2:     1.32.0
	    napi:        3
	    openssl:     1.0.2p
	    icu:         60.1
	    unicode:     10.0
	    cldr:        32.0
	    tz:          2017c
	os_uptime:   205904
	os_platform: linux

07/26 20:30:03 ps-evt-handlers::console     [INFO] [boot1://205904784ms] nodejs_process/6/cpu/0 => user=460000 system=200000
07/26 20:30:03 ps-evt-handlers::console     [INFO] [boot1://205904788ms] nodejs_process/6/memory/0 => rss=57528320 heapTotal=40677376 heapUsed=27308848 external=51944
07/26 20:30:03 ps-evt-handlers::console     [INFO] [boot1://205904789ms] nodejs_process/6/os/current => freeMemory=203583488 uptime=205904
07/26 20:30:03 yapps::sock                  [INFO] listening /tmp/yapps/yapps.sock
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/t
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/psm
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/ps
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/p
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/a
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/d
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/s
07/26 20:30:03 yapps::web                   [INFO] api: add /api/v3/system
07/26 20:30:03 yapps::web                   [WARN] socketio-auth is empty-ized
07/26 20:30:03 yapps::web                   [INFO] _opts[ws] = {"port":6020,"host":"0.0.0.0","auth":false,"headless":true,"cors":false,"view_verbose":false,"api":3,"upload_path":"/yapps/work/web/upload","express_partial_response":false,"express_method_overrid":false,"express_multer":false,"ws":{},"appName":"yapps","appPackageJson":{"author":{"name":["t2t inc."],"email":"yagamy@t2t.io"},"description":"N/A","name":"sensor-web3","version":"3.9.7","engines":{"node":"8.11.1"},"dependencies":{"livescript":"1.4.0","socket.io":"2.0.4","source-map-support":"0.3.2","systeminformation":"4.14.4"},"yapp":{"encloses":{"colors":"1.1.2","async":"1.4.2","eventemitter2":"0.4.14","moment":"2.10.6","optimist":"0.6.1","uid":"0.0.2","uuid":"3.2.1","utf8":"2.1.2","prettyjson":"1.1.3","semver":"5.5.0","js-yaml":"3.11.0","body-parser":"1.14.1","express":"4.13.3","handlebars":"4.0.3","byline":"4.2.1","through":"2.3.8"}}},"appCtrlSock":"unix:///tmp/yapps/yapps.sock"}
07/26 20:30:03 yapps::web                   [INFO] configs = {}
07/26 20:30:03 yapps::web                   [INFO] ws : add ws://0.0.0.0:6020/ps
07/26 20:30:03 yapps::web                   [INFO] ws : add ws://0.0.0.0:6020/client
07/26 20:30:03 yapps::web                   [INFO] listening 0.0.0.0:6020
07/26 20:30:04 system-helpers::regular-gc   [INFO] run global.gc()
07/26 20:30:05 ps-evt-handlers::console     [INFO] [boot1://205906791ms] nodejs_process/6/cpu/0 => user=80000 system=30000
07/26 20:30:07 ps-evt-handlers::console     [INFO] [boot1://205908797ms] nodejs_process/6/cpu/0 => user=90000 system=30000
07/26 20:30:08 ps-evt-handlers::console     [INFO] [boot1://205909793ms] nodejs_process/6/os/current => freeMemory=200089600 uptime=205909
07/26 20:30:09 ps-evt-handlers::console     [INFO] [boot1://205910799ms] nodejs_process/6/cpu/0 => user=90000 system=30000
07/26 20:30:11 ps-evt-handlers::console     [INFO] [boot1://205912806ms] nodejs_process/6/cpu/0 => user=90000 system=30000
07/26 20:30:13 ps-evt-handlers::console     [INFO] [boot1://205914795ms] nodejs_process/6/memory/0 => rss=48365568 heapTotal=23687168 heapUsed=20078664 external=25008
07/26 20:30:13 ps-evt-handlers::console     [INFO] [boot1://205914797ms] nodejs_process/6/os/current => freeMemory=214433792 uptime=205914
07/26 20:30:13 ps-evt-handlers::console     [INFO] [boot1://205914808ms] nodejs_process/6/cpu/0 => user=150000 system=90000
07/26 20:30:15 ps-evt-handlers::console     [INFO] [boot1://205916811ms] nodejs_process/6/cpu/0 => user=150000 system=90000
07/26 20:30:17 ps-evt-handlers::console     [INFO] [boot1://205918814ms] nodejs_process/6/cpu/0 => user=150000 system=90000
07/26 20:30:18 ps-evt-handlers::console     [INFO] [boot1://205919800ms] nodejs_process/6/os/current => freeMemory=214614016 uptime=205919
07/26 20:30:19 ps-evt-handlers::console     [INFO] [boot1://205920816ms] nodejs_process/6/cpu/0 => user=150000 system=90000
```


### Data Validation

SensorWeb3 supports data validation based on schema v2, but those validation policies are disabled by default since v3.9.7:

```text
\ps-manager :
  verbose: yes
  policy:
    bad_sensor_data: \reject        # warn, reject, nothing
    schema_strict_sensor_type: no
    schema_strict_sensor_id: no
```

To enable `schema_strict_sensor_type`, please run SensorWeb3 with cmdline arguments: `ES6=true ./run-sensorweb3-standalone -b 'ps-manager.policy.schema_strict_sensor_type=true'`. With strict sensor type, SensorWeb3 rejects sensor data events whose sensor types are not defined in schema. For example, following data emittions are rejected because schema only defines `os`, `cpu`, and `memory` sensor types:

```javascript
// this.emitData(p_type, p_id, s_type, s_id, measurements)
this.emitData(this.types[0], this.pid, 'hello', '0', data);
this.emitData(this.types[0], this.pid, 'world', '0', data);
```


To enable `schema_strict_sensor_id`, please run SensorWeb3 with cmdline arguments: `ES6=true ./run-sensorweb3-standalone -b 'ps-manager.policy. schema_strict_sensor_id=true'`. With strict sensor identities, SensorWeb3 rejects sensor data events whose sensor identities are not declared in schema. For example, following data emittions are rejected because schema only declares sensor identity `0` for `cpu` sensor type:

```javascript
// this.emitData(p_type, p_id, s_type, s_id, measurements)
this.emitData(this.types[0], this.pid, 'cpu', '1', data);
this.emitData(this.types[0], this.pid, 'cpu', '2', data);
```

