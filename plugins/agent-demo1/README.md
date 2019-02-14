<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [demo1](#demo1)
  - [Build](#build)
  - [Setup and Installation](#setup-and-installation)
  - [Run](#run)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## demo1

The app demonstrates how to implement [Agent](../../docs/agent.ls) with simple logic (showing the CPU percentages on Emoji display of Uno Sense box), so the app can be loaded by ToeAgent as a plugin to execute:

![](../../docs/toe3-architecture-20171208.png)

Its implementation is very short as below (written in [Livescript](http://livescript.net/)):

```ruby
{DBG, ERR, WARN, INFO} = global.get-logger __filename
{lodash_merge, lodash_sum, Agent} = global.get-bundled-modules!

class DemoAgent1 extends Agent
  (@dummy) ->
    super ...
    @preferences['ps']['sensor_events'] = <[
      linux::*::cpu::*
      sensorboard::*::humidity::*
      ]>

  at-sensor-updated: (timestamp, p_type, p_id, s_type, s_id, pp) ->
    {jarvis} = self = @
    INFO "#{JSON.stringify timestamp}: #{p_type}/#{p_id}/#{s_type}/#{s_id} => #{JSON.stringify pp}"
    if p_type is \linux and s_type is \cpu
      (err) <- jarvis.perform-actuator-action \sensorboard, \ttyO1, \led-matrix, \_, \show-number, (Math.floor pp['percentage']), null, null
      ERR err, "failed to perform." if err?

module.exports = exports = DemoAgent1
```

Equals to javascript as below (in short):

```javascript
// ...
  DemoAgent1 = (function(superclass){
    var prototype = extend$((import$(DemoAgent1, superclass).displayName = 'DemoAgent1', DemoAgent1), superclass).prototype, constructor = DemoAgent1;
    function DemoAgent1(dummy){
      this.dummy = dummy;
      DemoAgent1.superclass.apply(this, arguments);
      this.preferences['ps']['sensor_events'] = ['linux::*::cpu::*', 'sensorboard::*::humidity::*'];
    }
    prototype.atSensorUpdated = function(timestamp, p_type, p_id, s_type, s_id, pp){
      var self, jarvis;
      jarvis = (self = this).jarvis;
      INFO(JSON.stringify(timestamp) + ": " + p_type + "/" + p_id + "/" + s_type + "/" + s_id + " => " + JSON.stringify(pp));
      if (p_type === 'linux' && s_type === 'cpu') {
        return jarvis.performActuatorAction('sensorboard', 'ttyO1', 'led-matrix', '_', 'show-number', Math.floor(pp['percentage']), null, null, function(err){
          if (err != null) {
            return ERR(err, "failed to perform.");
          }
        });
      }
    };
    return DemoAgent1;
  }(Agent));
// ...
```

This implementation shall:

- Register to listen these sensor events:
  - `linux::*::cpu::*`
  - `sensorboard::*::humidity::*`
- Request SensorWeb3 to show CPU percentages on Emoji display when receiving CPU sensor data update
- Display all received sensor update events on console


### Build

Please run `npm run build` command at current directory to compile all livescript sources (`src/*.ls`) to javascript sources (`lib/*.js`):

```text
$  npm run build

> agent-demo1@0.0.2 build /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-dhvac-plugins/plugins/agent-demo1
> find src -name '*.ls' | xargs -I{} sh -c "echo compiling {} ...; cat {} | lsc -cp > lib/\$(basename {} .ls).js"

compiling src/demo1.ls ...
compiling src/index.ls ...
```

### Setup and Installation

Please ensure you've installed [Docker](https://docs.docker.com/install/) on your Mac OS X or Ubuntu/Linux development environment.

### Run

ToeAgent cannot run without SensorWeb3. Please ensure you have a Uno Sense box in the same LAN network, installed with profile release [20180114a](https://redmine.dhvac.io/redmine/projects/dhvac/wiki/Dhvac-profile-release-20180114a) (or afterwards), and switched to **development** deployment environment. (using `yac enboot development` command after `ENV=production yac upgrade_profile`)

Let's run ToeAgent with following assumptions:

- the plugin directory is `/Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-dhvac-plugins/plugins/agent-demo1`
- the Uno Sense box is located in the same subnet, with ip address `10.90.0.114`
- the default token for development environment is `ABCD` (because SensorWeb3 needs to authenticate the Websocket connection from IP other than 127.0.0.1)

Then, let's startup ToeAgent with Docker:

```text
$  ./run-toeagent-with-remote-box 10.90.0.114
SCRIPT_CURRENT_NAME = run-toeagent-with-remote-box
SCRIPT_BASE_NAME = run-toeagent
SCRIPT_SUBCOMMAND = with-remote-box
FUNC = run_with_remote_box
10.90.0.114 is alive
10.90.0.114 port 22 is ready
10.90.0.114 with user yagamy to login SSH service
10.90.0.114:/tmp/ttt_system is downloaded =>
	id	1646I3000043
	sn	1646I3000043
	token	000000000000
	alias	1646I3000043
	base_version	99991231z
	profile	dhvac
	profile_version	20180129a
	profile_env	development
	wireless_ap_mac
	wireless_ip_addr
	wireless_mac_addr	68:9e:19:87:06:c5
	wireless_handshake_time
	wireless_ssid
10.90.0.114/profile => dhvac
BLEMO_SERVICE_ENABLED => False
TIC_HUB_SERVER => https://hub3.dhvac.io
TIC_DM_SERVER => https://tic-dm.dhvac.io
launch script:

#!/bin/bash
#
docker run \
	-it \
	--init \
	--rm \
	--name toe-agent-test-0130-003649 \
	-p 6020:6020  \
	-v /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-dhvac-plugins/plugins/agent-demo1:/opt/agent-demo1 \
	-e YAPPS_EXTRA_AGENTS=/opt/agent-demo1 \
	-e YAPPS_DUMP_LOADED_CONFIG=false \
	tictactoe/yapps.toe-agent:latest \
		node index.js \
			-v \
			--expose-gc \
			-o "sensorweb3-client.wss.client_opts={}" -s "tic-client.dg.hub=https://hub3.dhvac.io" -s "tic-client.dm.server=https://tic-dm.dhvac.io" -s system-info.remote=10.90.0.114 -s communicator.connections.ps_s_data.url=tcp://10.90.0.114:6022 -s communicator.connections.ps_p_data.url=tcp://10.90.0.114:6023 -s sensorweb3-client.wss.server=http://10.90.0.114:6020 -s sensorweb3-client.wss.token=ABCD

y-module-dir = /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/y_modules
2018/01/29 16:36:50 yapps::resource              [DBG ] checking /yapps
2018/01/29 16:36:50 yapps::resource              [DBG ] use /yapps as work_dir
2018/01/29 16:36:50 yapps::resource              [DBG ] use /yapps as app_dir
2018/01/29 16:36:50 yapps::system-uptime         [INFO] retrieve 870780ms from /proc/uptime
2018/01/29 16:36:50 yapps::inner                 [INFO] application name: toe-agent
2018/01/29 16:36:50 yapps::inner                 [DBG ] create web with options: {"a":1,"b":2}
2018/01/29 16:36:50 yapps::system-uptime         [INFO] boots: 0ms
2018/01/29 16:36:50 yapps::system-uptime         [INFO] system: 870780ms
2018/01/29 16:36:50 yapps::system-uptime         [INFO] app: 260ms
2018/01/29 16:36:50 yapps::WebApp                [INFO] web-app initiates
2018/01/29 16:36:50 yapps::signal                [DBG ] register signal event: SIGABRT
2018/01/29 16:36:50 yapps::signal                [DBG ] register signal event: SIGALRM
2018/01/29 16:36:50 yapps::signal                [DBG ] register signal event: SIGHUP
2018/01/29 16:36:50 yapps::signal                [DBG ] register signal event: SIGINT
2018/01/29 16:36:50 yapps::signal                [DBG ] register signal event: SIGTERM
2018/01/29 16:36:50 yapps::resource              [DBG ] failed to load /yapps/config/default.ls, err: Error: ENOENT: no such file or directory, open '/yapps/config/default.ls'
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying sensorweb3-client.wss.client_opts = {}
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied sensorweb3-client.wss.client_opts = [object Object]
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying tic-client.dg.hub = https://hub3.dhvac.io
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied tic-client.dg.hub = https://hub3.dhvac.io
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying tic-client.dm.server = https://tic-dm.dhvac.io
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied tic-client.dm.server = https://tic-dm.dhvac.io
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying system-info.remote = 10.90.0.114
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied system-info.remote = 10.90.0.114
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying communicator.connections.ps_s_data.url = tcp://10.90.0.114:6022
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied communicator.connections.ps_s_data.url = tcp://10.90.0.114:6022
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying communicator.connections.ps_p_data.url = tcp://10.90.0.114:6023
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied communicator.connections.ps_p_data.url = tcp://10.90.0.114:6023
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying sensorweb3-client.wss.server = http://10.90.0.114:6020
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied sensorweb3-client.wss.server = http://10.90.0.114:6020
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applying sensorweb3-client.wss.token = ABCD
2018/01/29 16:36:50 yapps::BaseApp               [INFO] applied sensorweb3-client.wss.token = ABCD
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin sock with options: {"appName":"toe-agent","servers":{"system":{"uri":"unix:///tmp/yap/toe-agent.system.sock","line":true}}}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin web with options: {"appName":"toe-agent","host":"0.0.0.0","port":6040,"api":3,"headless":true,"express_partial_response":false,"express_method_overrid":false,"express_multer":false}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin system-info with options: {"appName":"toe-agent","remote":"10.90.0.114"}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin system-helpers with options: {"appName":"toe-agent","helpers":{"regular-gc":{"period":180}}}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin profile-storage with options: {"appName":"toe-agent"}
2018/01/29 16:36:50 profile-storage              [INFO] profile-dir: /tmp
2018/01/29 16:36:50 profile-storage              [INFO] app-dir: /tmp/toe-agent
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin communicator with options: {"appName":"toe-agent","verbose":false,"connections":{"ps_s_data":{"enabled":true,"url":"tcp://10.90.0.114:6022","channel":null,"broadcast":false},"ps_p_data":{"enabled":true,"url":"tcp://10.90.0.114:6023","channel":null,"broadcast":false}}}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin sensorweb3-client with options: {"appName":"toe-agent","verboses":{"sensor_updated":false,"peripheral_updated":true,"actuator_performed":false,"blemo_push":true,"invoke_webapi":true},"enabled":true,"wss":{"server":"http://10.90.0.114:6020","user":"admin","token":"ABCD","verbose":false,"wsc_opts":{},"client_opts":{}},"tcp":{"sensor":"ps_s_data","peripheral":"ps_p_data"}}
2018/01/29 16:36:50 sensorweb3-client            [INFO] opts => {"appName":"toe-agent","verboses":{"sensor_updated":false,"peripheral_updated":true,"actuator_performed":false,"blemo_push":true,"invoke_webapi":true},"enabled":true,"wss":{"server":"http://10.90.0.114:6020","user":"admin","token":"ABCD","verbose":false,"wsc_opts":{},"client_opts":{}},"tcp":{"sensor":"ps_s_data","peripheral":"ps_p_data"}}
2018/01/29 16:36:50 sensorweb3-client            [INFO] verboses => {"sensor_updated":false,"actuator_performed":false,"blemo_push":true,"peripheral_updated":true,"invoke_webapi":true}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin tic-client with options: {"appName":"toe-agent","dg":{"enabled":true,"verbose":false,"hub":"https://hub3.dhvac.io","check_interval":180,"pack_interval":20},"dm":{"enabled":true,"verbose":false,"server":"https://tic-dm.dhvac.io","use_sn_as_id":false}}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin agent-manager with options: {"appName":"toe-agent","verbose":false,"preloaded_agents":["smith"],"bluetooth_modems":[{"prefix":"*","binary":true},{"prefix":"&","binary":false}],"agent_settings":{"TestAgent1":{"aaa":true,"bbb":10,"ccc":"hello"},"TestAgent2":{"aaa":false,"bbb":99,"ccc":"world"},"Smith":{"aaa":true,"bbb":88.6,"ccc":"great"}}}
2018/01/29 16:36:50 agent-manager                [INFO] opts => {"appName":"toe-agent","verbose":false,"preloaded_agents":["smith"],"bluetooth_modems":[{"prefix":"*","binary":true},{"prefix":"&","binary":false}],"agent_settings":{"TestAgent1":{"aaa":true,"bbb":10,"ccc":"hello"},"TestAgent2":{"aaa":false,"bbb":99,"ccc":"world"},"Smith":{"aaa":true,"bbb":88.6,"ccc":"great"}}}
2018/01/29 16:36:50 agent-manager                [INFO] ee2 => {"wildcard":true,"delimiter":"::","newListener":false,"maxListeners":20,"verboseMemoryLeak":true}
2018/01/29 16:36:50 yapps::BaseApp               [DBG ] load plugin agent-webapi with options: {"appName":"toe-agent"}
2018/01/29 16:36:50 yapps::sock                  [INFO] listening /tmp/yap/toe-agent.system.sock
2018/01/29 16:36:50 yapps::utils                 [DBG ] creating /yapps/work/web/upload ...
2018/01/29 16:36:50 system-info                  [INFO] context: {"ttt":{"profile":"dhvac","profile_version":"20180129a","id":"1646I3000043","sn":"1646I3000043","token":"000000000000","alias":"1646I3000043","base_version":"99991231z","profile_env":"development","wireless_ap_mac":"","wireless_ip_addr":"","wireless_mac_addr":"68:9e:19:87:06:c5","wireless_handshake_time":"","wireless_ssid":""},"os":{"hostname":"1646I3000043"},"runtime":{"node_version":"v4.4.7","node_arch":"arm","node_platform":"linux"},"cwd":"/","interfaces":[{"interface":"eth0","link":"ethernet","address":"68:9e:19:87:06:c5","ipv6_address":"fe80::6a9e:19ff:fe87:6c5/64","ipv4_address":"10.90.0.114","ipv4_broadcast":"10.90.0.255","ipv4_subnet_mask":"255.255.255.0","up":true,"broadcast":true,"running":true,"multicast":true},{"interface":"lo","link":"local","ipv6_address":"::1/128","ipv4_address":"127.0.0.1","ipv4_subnet_mask":"255.0.0.0","up":true,"running":true,"loopback":true},{"interface":"sit0","link":"ipv6-in-ipv4"},{"interface":"usb0","link":"ethernet","address":"68:9e:19:87:06:c0","ipv4_address":"192.168.7.2","ipv4_broadcast":"192.168.7.3","ipv4_subnet_mask":"255.255.255.252","up":true,"broadcast":true,"multicast":true},{"interface":"wlan0","link":"ethernet","address":"68:9e:19:87:06:c5","up":true,"broadcast":true,"multicast":true}],"iface":{"name":"eth0","iface":{"interface":"eth0","link":"ethernet","address":"68:9e:19:87:06:c5","ipv6_address":"fe80::6a9e:19ff:fe87:6c5/64","ipv4_address":"10.90.0.114","ipv4_broadcast":"10.90.0.255","ipv4_subnet_mask":"255.255.255.0","up":true,"broadcast":true,"running":true,"multicast":true}},"mac_address":"689e198706c5","id":"1646I3000043"}
2018/01/29 16:36:50 system-helpers               [INFO] successfully initiate an instance of regular-gc
2018/01/29 16:36:50 system-helpers::regular-gc   [INFO] period = 180
2018/01/29 16:36:50 communicator                 [INFO] connections[ps_s_data]: settings => {"enabled":true,"url":"tcp://10.90.0.114:6022","channel":null,"broadcast":false}
2018/01/29 16:36:50 communicator                 [INFO] connections[ps_p_data]: settings => {"enabled":true,"url":"tcp://10.90.0.114:6023","channel":null,"broadcast":false}
2018/01/29 16:36:50 communicator                 [INFO] connection[ps_s_data]: initiate connection with tcp protocol => tcp://10.90.0.114:6022
2018/01/29 16:36:50 communicator::tcp            [DBG ] tcp[ps_s_data] initiated
2018/01/29 16:36:50 communicator                 [INFO] connection[ps_p_data]: initiate connection with tcp protocol => tcp://10.90.0.114:6023
2018/01/29 16:36:50 communicator::tcp            [DBG ] tcp[ps_p_data] initiated
2018/01/29 16:36:50 sensorweb3-client            [INFO] initiate-wss-client: http://10.90.0.114:6020, admin, ABCD, false
2018/01/29 16:36:50 sensorweb3-client            [INFO] initiate-tcp-client: {"sensor":"ps_s_data","peripheral":"ps_p_data"}
2018/01/29 16:36:50 sensorweb3-client            [INFO] communicator.connections[ps_s_data]: set callback successfully
2018/01/29 16:36:50 sensorweb3-client            [INFO] communicator.connections[ps_p_data]: set callback successfully
2018/01/29 16:36:50 sensorweb3-client            [INFO] initialized.
2018/01/29 16:36:50 tic-client::ticc             [INFO] id=1646I3000043 token=000000000000 profile=dhvac version=20180129a
2018/01/29 16:36:50 tic-client::tic-dg           [INFO] TIC-DG: options => {"enabled":true,"verbose":false,"hub":"https://hub3.dhvac.io","check_interval":180,"pack_interval":20}
2018/01/29 16:36:50 tic-client::tic-dg           [INFO] TIC-DG: settings => {"enabled":true,"verbose":false,"hub":"https://hub3.dhvac.io","check_interval":180,"pack_interval":20}
2018/01/29 16:36:50 tic-client::tic-dm           [WARN] dm-client is disabled, because defaul invalid token => 000000000000
2018/01/29 16:36:50 tic-client::tic-dm           [WARN] !!!!
2018/01/29 16:36:50 tic-client::tic-dm           [WARN] !!!!
2018/01/29 16:36:50 tic-client::ticc             [INFO] using /tmp/toe-agent/ticc as working directory
2018/01/29 16:36:50 tic-client::tic-dg           [INFO] detect boots from /opt/ys/share/timestamp: 1 (fallback to '0' because of err: Error: ENOENT: no such file or directory, scandir '/opt/ys/share/timestamp')
2018/01/29 16:36:50 yapps::timer                 [DBG ] initiate timer w/ period = 20
2018/01/29 16:36:50 tic-client::tic-dg           [INFO] TIC-DG: start pack timer with 20s
2018/01/29 16:36:50 yapps::timer                 [DBG ] initiate timer w/ period = 180
2018/01/29 16:36:50 tic-client::tic-dg           [INFO] TIC-DG: start check timer with 180s
2018/01/29 16:36:50 bluetooth-modem              [INFO] creating blemodem[*]
2018/01/29 16:36:50 bluetooth-modem              [INFO] creating blemodem[&]
2018/01/29 16:36:50 agent-manager                [INFO] load class from smith (prebuilt: true) ...
2018/01/29 16:36:50 agent-manager                [INFO] create wrapper instance for smith ...
2018/01/29 16:36:50 agent-wrapper                [WARN] agents[t::smith] missing settings from constructor or config repository...
2018/01/29 16:36:50 agent-wrapper                [INFO] create AgentWrapper with smith
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[t::smith]: create instance ...
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[t::smith]: initialize instance with settings => {}
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[t::smith]: initialize instance successfully. runtime-preferences => {"timer":{"interval":-1},"ps":{"peripheral_state_updated":false,"sensor_events":[]},"web":{"commands":[]},"blemo":{"channels":[{"prefix":"0x01"},{"prefix":"0x02"}]},"aaa":"smith"}
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[t::smith]: supported commands =>
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[t::smith]: initialize environment with wrapper successfully.
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[t::smith]: initialize environment with jarvis successfully.
2018/01/29 16:36:50 agent-manager                [INFO] agents[t::smith]: register blemo[...][0x01] successfully
2018/01/29 16:36:50 agent-manager                [INFO] agents[t::smith]: register blemo[...][0x02] successfully
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[t::smith]: add agent to list.
2018/01/29 16:36:50 agent-manager                [INFO] load class from /opt/agent-demo1 (prebuilt: false) ...
2018/01/29 16:36:50 agent-manager                [INFO] create wrapper instance for /opt/agent-demo1 ...
2018/01/29 16:36:50 agent-wrapper                [WARN] agents[DemoAgent1::agent-demo1] missing settings from constructor or config repository...
2018/01/29 16:36:50 agent-wrapper                [INFO] create AgentWrapper with agent-demo1
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1]: create instance ...
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1]: initialize instance with settings => {}
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1]: initialize instance successfully. runtime-preferences => {"timer":{"interval":-1},"ps":{"peripheral_state_updated":false,"sensor_events":["linux::*::cpu::*","sensorboard::*::humidity::*"]},"web":{"commands":[]},"blemo":{"channels":[{"prefix":"0x01"},{"prefix":"0x02"}]}}
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1]: supported commands =>
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1]: initialize environment with wrapper successfully.
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1].jarvis: successfully register sensor event: linux/*/cpu/*
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1].jarvis: successfully register sensor event: sensorboard/*/humidity/*
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1]: initialize environment with jarvis successfully.
2018/01/29 16:36:50 agent-manager                [WARN] agents[DemoAgent1::agent-demo1]: register blemo[...][0x01] but occupied by t
2018/01/29 16:36:50 agent-manager                [WARN] agents[DemoAgent1::agent-demo1]: register blemo[...][0x02] but occupied by t
2018/01/29 16:36:50 agent-wrapper                [INFO] agents[DemoAgent1::agent-demo1]: add agent to list.
2018/01/29 16:36:50 agent-manager                [INFO] successfully initialized.
2018/01/29 16:36:50 yapps::BaseApp               [INFO] toe-agent initialized.
2018/01/29 16:36:50 yapps::web                   [DBG ] preparing middlewares ...
2018/01/29 16:36:50 yapps::web                   [DBG ] use middleware: body-parser
2018/01/29 16:36:50 yapps::web                   [DBG ] no bunyan logger plugin
2018/01/29 16:36:50 yapps::web                   [INFO] api: add /api/v3/c
2018/01/29 16:36:50 yapps::web                   [WARN] socketio-auth is empty-ized
2018/01/29 16:36:50 yapps::web                   [INFO] _opts[ws] = {"port":6040,"host":"0.0.0.0","headless":true,"view_verbose":false,"api":3,"upload_path":"/yapps/work/web/upload","express_partial_response":false,"express_method_overrid":false,"express_multer":false,"ws":{},"appName":"toe-agent"}
2018/01/29 16:36:50 yapps::web                   [DBG ] starting web server ...
2018/01/29 16:36:50 yapps::web                   [INFO] listening 0.0.0.0:6040
2018/01/29 16:36:50 __app__                      [DBG ] started
2018/01/29 16:36:50 communicator::tcp            [INFO] connected to 10.90.0.114:6022
2018/01/29 16:36:50 communicator                 [INFO] connections[ps_s_data] connected: true
2018/01/29 16:36:50 communicator::tcp            [INFO] connected to 10.90.0.114:6023
2018/01/29 16:36:50 communicator                 [INFO] connections[ps_p_data] connected: true
2018/01/29 16:36:50 sensorweb3-client            [INFO] at-sensor-data: ignore data before wss ready => [0,26036039,1517243902600,"sensorboard","ttyO1","humidity","_",{"temperature":21.9,"humidity":59.1}]
2018/01/29 16:36:50 yapps::wss-client-core       [INFO] connected to http://10.90.0.114:6020 (channel: client) via websocket protocol
2018/01/29 16:36:50 sensorweb3-client            [INFO] connected to sensorweb3 via websocket
2018/01/29 16:36:50 sensorweb3-client            [INFO] connected to sensorweb3 via websocket and configured. (true)
2018/01/29 16:36:51 system-helpers::regular-gc   [WARN] missing global.gc() function
2018/01/29 16:36:53 ??::demo1                    [INFO] {"boots":0,"uptime":26039045,"epoch":1517243905605}: sensorboard/ttyO1/humidity/_ => {"temperature":21.9,"humidity":59}
2018/01/29 16:36:55 ??::demo1                    [INFO] {"boots":0,"uptime":26040670,"epoch":1517243907231}: linux/7F000001/cpu/_ => {"percentage":18.3}
2018/01/29 16:36:55 yapps::wss-client-core       [DBG ] admin: [client] me>>peer[req]: {"index":"1517243815274_1","action":"wsrr_perform_action","response":true,"args":["sensorboard","ttyO1","emoji","_","show_number",18,null,null]}
2018/01/29 16:36:55 yapps::wss-client-core       [DBG ] admin: [client] me>>peer[rsp]: {"index":"1517243815274_1","result":null,"error":"sensorboard/ttyO1/emoji/_ perform show_number with 18,null,null but error: dhvac/sensorboard does not support any actuator"}
2018/01/29 16:36:55 ??::demo1                    [ERR ] err: sensorboard/ttyO1/emoji/_ perform show_number with 18,null,null but error: dhvac/sensorboard does not support any actuator => failed to perform.
2018/01/29 16:36:56 ??::demo1                    [INFO] {"boots":0,"uptime":26042055,"epoch":1517243908616}: sensorboard/ttyO1/humidity/_ => {"temperature":21.9,"humidity":58.7}
2018/01/29 16:36:59 ??::demo1                    [INFO] {"boots":0,"uptime":26045065,"epoch":1517243911625}: sensorboard/ttyO1/humidity/_ => {"temperature":21.9,"humidity":58.8}
2018/01/29 16:37:02 ??::demo1                    [INFO] {"boots":0,"uptime":26048076,"epoch":1517243914636}: sensorboard/ttyO1/humidity/_ => {"temperature":21.9,"humidity":58.9}
2018/01/29 16:37:05 ??::demo1                    [INFO] {"boots":0,"uptime":26050689,"epoch":1517243917250}: linux/7F000001/cpu/_ => {"percentage":14.2}
2018/01/29 16:37:05 yapps::wss-client-core       [DBG ] admin: [client] me>>peer[req]: {"index":"1517243825294_2","action":"wsrr_perform_action","response":true,"args":["sensorboard","ttyO1","emoji","_","show_number",14,null,null]}
2018/01/29 16:37:05 yapps::wss-client-core       [DBG ] admin: [client] me>>peer[rsp]: {"index":"1517243825294_2","result":null,"error":"sensorboard/ttyO1/emoji/_ perform show_number with 14,null,null but error: dhvac/sensorboard does not support any actuator"}
2018/01/29 16:37:05 ??::demo1                    [ERR ] err: sensorboard/ttyO1/emoji/_ perform show_number with 14,null,null but error: dhvac/sensorboard does not support any actuator => failed to perform.
2018/01/29 16:37:05 ??::demo1                    [INFO] {"boots":0,"uptime":26051085,"epoch":1517243917645}: sensorboard/ttyO1/humidity/_ => {"temperature":21.9,"humidity":58.7}
2018/01/29 16:37:08 ??::demo1                    [INFO] {"boots":0,"uptime":26054095,"epoch":1517243920656}: sensorboard/ttyO1/humidity/_ => {"temperature":21.9,"humidity":58.7}
2018/01/29 16:37:10 tic-client::tic-dg           [INFO] TIC-DG: total 60 points, with 3061 bytes (compressed: 1278 bytes)
2018/01/29 16:37:10 tic-client::tic-dg           [INFO] TIC-DG: uploading to https://hub3.dhvac.io/api/v3/upload/dhvac/1646I3000043
2018/01/29 16:37:11 tic-client::tic-dg           [INFO] TIC-DG: successfully upload 1278 bytes to https://hub3.dhvac.io/api/v3/upload/dhvac/1646I3000043, response: {"code":0,"message":null,"result":{},"configs":{"upload_strategy":{"enabled":true}}}
2018/01/29 16:37:11 tic-client::tic-dg           [INFO] TIC-DG: enabled from server: true
2018/01/29 16:37:11 ??::demo1                    [INFO] {"boots":0,"uptime":26057105,"epoch":1517243923666}: sensorboard/ttyO1/humidity/_ => {"temperature":21.9,"humidity":58.8}
```

For those lines with `??::demo1`, they show the `demo1` agent receives sensor updates from SensorWeb3 running on `10.90.0.114`.

For those lines with `tic-client::tic-dg`, they show the sensor data are archived and uploaded onto Tic/SensorHub3 server: `https://hub3.dhvac.io`.
