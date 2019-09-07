# demo4

This agent demonstrates how to implement [Agent](../../docs/agent.ls) to receive sensor data updates from [ps-demo4](../ps-demo4) SensorWeb inside Docker running on the same host environment (e.g. Mac OS X). The agent is written in (https://www.w3schools.com/js/js_es6.asp), very short:

```javascript
// Get logger apis in ToeAgent
var { DBG, ERR, WARN, INFO } = global.getLogger(__filename);

// Get the Agent class declaration from ToeAgent
var { Agent } = global.getBundledModules();

class Demo4 extends Agent {

    constructor(dummy) {
        super(module);
        this.preferences['ps']['sensor_events'] = [
            'nodejs_process::*::cpu::*',
            'nodejs_process::*::memory::*',
            'nodejs_process::*::os::*'
        ];
    }

    /**
     * Notify the Agent instance with a sensor data update event that is registered at
     * Agent initiation phase by specify `ps/sensor_events` field in runtime preference
     * json object.
     */
    atSensorUpdated(timestamp, p_type, p_id, s_type, s_id, pp) {
        var self = this;
        var {jarvis} = self;
        INFO(`${JSON.stringify(timestamp)}: ${p_type}/${p_id}/${s_type}/${s_id} => ${JSON.stringify(pp)}`);
    }
}

module.exports = exports = Demo4;
```

The agent implements following logics:

- Register to listen these sensor events
  - `nodejs_process::*::cpu::*`
  - `nodejs_process::*::memory::*`
  - `nodejs_process::*::os::*`
- Listen the sensor update events, and show them on the console.


## Execution with Container (Box)

### Prerequisites

Please run [ps-demo4](../ps-demo4) in Docker on the x86 host environment.


### Run

Please execute the launch script `run-toeagent-with-container-box` with the ip address of x86 host environment that runs SensorWeb/ps-demo4 in Docker. If the x86 host environment is same machine to run ToeAgent and its OS is Mac OS X, you can specify ip address with `host.docker.internal`.

```text
$  ./run-toeagent-with-container-box host.docker.internal
SCRIPT_CURRENT_NAME = run-toeagent-with-container-box
SCRIPT_BASE_NAME = run-toeagent
SCRIPT_SUBCOMMAND = with-container-box
FUNC = run_with_container_box
launch script:

#!/bin/bash
#
docker run \
	-it \
	--init \
	--rm \
	--name toe-agent-test-0908-013838 \
	-p 6040:6040  \
	 \
	-v /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-example-plugins/plugins/agent-demo4:/opt/plugins/agent-demo4 \
	 \
	-e YAPPS_DUMP_LOADED_CONFIG=false \
	-e YAPPS_EXTRA_AGENTS=/opt/plugins/agent-demo4 \
	 \
	 \
	tictactoe/yapps.toe-agent:0.9.7 \
		node \
			--expose-gc \
			index.js \
				 -b 'tic-client.uploaders.dg-ts.enabled=false' \
                 -b 'tic-client.uploaders.dg-ss.enabled=false' \
                 -b 'tic-client.uploaders.dm-po.enabled=false' \
                 -s system-info.remote=host.docker.internal \
                 -s communicator.connections.ps_s_data.url=tcp://host.docker.internal:6022 \
                 -s communicator.connections.ps_p_data.url=tcp://host.docker.internal:6023 \
                 -s sensorweb3-client.wss.server=http://host.docker.internal:6020 \
                 -s sensorweb3-client.wss.token=ABCD \
                 -o ^sensorweb3-client.wss.client_opts:ewp9Cg==
...
```

After the agent is loaded and starts to subscribe sensor update events, you can see following logs on the console:

```text
09/07 17:38:40 yapps::web                   [INFO] listening 0.0.0.0:6040
09/07 17:38:40 yapps::wss-client-core       [INFO] connected to http://host.docker.internal:6020 (channel: client) via websocket protocol
09/07 17:38:40 sensorweb3-client            [INFO] connected to sensorweb3 via websocket
09/07 17:38:40 sensorweb3-client            [INFO] connected to sensorweb3 via websocket and configured. (true), info => {"uptime":{"boots":1,"app":595,"system":6087520,"diff":6086925}}
09/07 17:38:40 sensorweb3-client            [INFO] ignore handshaking with server's uptime
09/07 17:38:40 agent-demo4::agent           [INFO] {"boots":1,"uptime":11774831,"epoch":1567877920408}: nodejs_process/7/os/current => {"freeMemory":150167552,"uptime":68148,"priority":1}
09/07 17:38:40 agent-demo4::agent           [INFO] {"boots":1,"uptime":11775290,"epoch":1567877920866}: nodejs_process/7/memory/0 => {"rss":28635136,"heapTotal":7372800,"heapUsed":3802344,"external":877816}
09/07 17:38:41 system-helpers::regular-gc   [INFO] run global.gc()
09/07 17:38:41 agent-demo4::agent           [INFO] {"boots":1,"uptime":11775573,"epoch":1567877921150}: nodejs_process/7/cpu/0 => {"user":2111574,"system":824132}
09/07 17:38:42 agent-demo4::agent           [INFO] {"boots":1,"uptime":11776577,"epoch":1567877922154}: nodejs_process/7/cpu/0 => {"user":2111724,"system":824196}
09/07 17:38:43 agent-demo4::agent           [INFO] {"boots":1,"uptime":11777581,"epoch":1567877923157}: nodejs_process/7/cpu/0 => {"user":2111864,"system":824259}
09/07 17:38:43 agent-demo4::agent           [INFO] {"boots":1,"uptime":11778297,"epoch":1567877923873}: nodejs_process/7/memory/0 => {"rss":28643328,"heapTotal":7372800,"heapUsed":3810704,"external":877816}
```