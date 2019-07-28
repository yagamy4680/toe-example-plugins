## demo1

The app demonstrates how to implement [Agent](../../docs/agent.ls) with simple logic (showing the CPU percentages on Emoji display of CONSCIOUS box), so the app can be loaded by ToeAgent as a plugin to execute:

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

> demo1@0.0.1 build /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-cestec-plugins/plugins/agent-demo1
> find src -name '*.ls' | xargs -I{} sh -c "echo compiling {} ...; cat {} | lsc -cp > lib/\$(basename {} .ls).js"

compiling src/demo1.ls ...
compiling src/index.ls ...
```

### Setup and Installation

Please download [ToeAgent](https://redmine.cestec.jp/projects/conscious/wiki/ToeAgent) from redmine to install. Then, switch to ToeAgent directory, and run `npm install` to install all required nodejs modules from Internet.


### Run

ToeAgent cannot run without SensorWeb3. Please ensure you have a ConsciousBox in the same LAN network, installed with profile release [20171208a](https://redmine.cestec.jp/projects/conscious/wiki/Conscious-profile-release-20171208a) (or afterwards), and switched to **development** deployment environment. (using `yac enboot development` command after `ENV=production yac upgrade_profile`)

Let's run ToeAgent with following assumptions:

- the plugin directory is `/Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-cestec-plugins/plugins/agent-demo1`
- the conscious box is located in the same subnet, with ip address `10.90.0.111`
- the default token for development environment is `ABCD` (because SensorWeb3 needs to authenticate the Websocket connection from IP other than 127.0.0.1)

Then, let's startup ToeAgent with these commands:

```text
# yagamy @ grandia in /tmp/toe-agent [1:30:05]
$ export YAPPS_DUMP_LOADED_CONFIG=false

# yagamy @ grandia in /tmp/toe-agent [1:30:07]
$ export YAPPS_EXTRA_AGENTS=/Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-cestec-plugins/plugins/agent-demo1

# yagamy @ grandia in /tmp/toe-agent [1:30:09]
$ node ./index.js \
    -s 'sensorweb3-client.wss.token=ABCD' \
    -b 'sensorweb3-client.verboses.actuator_performed=true' \
    -s 'communicator.connections.ps.url=tcp://10.90.0.111:6022' \
    -s 'sensorweb3-client.wss.server=http://10.90.0.111:6020'

y-module-dir = /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/y_modules
2017/12/09 01:33:12 yapps::resource              [DBG ] checking /private/tmp/toe-agent
2017/12/09 01:33:12 yapps::resource              [DBG ] use /private/tmp/toe-agent as work_dir
2017/12/09 01:33:12 yapps::resource              [DBG ] use /private/tmp/toe-agent as app_dir
2017/12/09 01:33:12 yapps::system-uptime         [WARN] using process uptime (246ms) as system uptime for mac osx
2017/12/09 01:33:12 yapps::inner                 [INFO] application name: toe-agent
2017/12/09 01:33:12 yapps::inner                 [DBG ] create web with options: {"a":1,"b":2}
2017/12/09 01:33:12 yapps::system-uptime         [INFO] boots: 0ms
2017/12/09 01:33:12 yapps::system-uptime         [INFO] system: 246ms
2017/12/09 01:33:12 yapps::system-uptime         [INFO] app: 269ms
2017/12/09 01:33:12 yapps::WebApp                [INFO] web-app initiates
2017/12/09 01:33:12 yapps::signal                [DBG ] register signal event: SIGABRT
2017/12/09 01:33:12 yapps::signal                [DBG ] register signal event: SIGALRM
2017/12/09 01:33:12 yapps::signal                [DBG ] register signal event: SIGHUP
2017/12/09 01:33:12 yapps::signal                [DBG ] register signal event: SIGINT
2017/12/09 01:33:12 yapps::signal                [DBG ] register signal event: SIGTERM
2017/12/09 01:33:12 yapps::BaseApp               [INFO] applying sensorweb3-client.wss.token = ABCD
2017/12/09 01:33:12 yapps::BaseApp               [INFO] applying communicator.connections.ps.url = tcp://10.90.0.111:6022
2017/12/09 01:33:12 yapps::BaseApp               [INFO] applying sensorweb3-client.wss.server = http://10.90.0.111:6020
2017/12/09 01:33:12 yapps::BaseApp               [INFO] applying sensorweb3-client.verboses.actuator_performed = true
...
2017/12/09 01:33:12 profile-storage              [INFO] profile-dir: /tmp
2017/12/09 01:33:12 profile-storage              [INFO] app-dir: /tmp/toe-agent
2017/12/09 01:33:12 sensorweb3-client            [INFO] opts => {"appName":"toe-agent","verboses":{"sensor_updated":false,"actuator_performed":true},"enabled":true,"broadcast":false,"wss":{"server":"http://10.90.0.111:6020","user":"admin","token":"ABCD","verbose":false,"wsc_opts":{},"client_opts":{}},"tcp":"ps"}
2017/12/09 01:33:12 sensorweb3-client            [INFO] verboses => {"sensor_updated":false,"actuator_performed":true}
2017/12/09 01:33:12 agent-manager                [INFO] opts => {"appName":"toe-agent","verbose":false,"preloaded_agents":["smith"],"agent_settings":{"TestAgent1":{"aaa":true,"bbb":10,"ccc":"hello"},"TestAgent2":{"aaa":false,"bbb":99,"ccc":"world"},"Smith":{"aaa":true,"bbb":88.6,"ccc":"great"}}}
2017/12/09 01:33:12 agent-manager                [INFO] ee2 => {"wildcard":true,"delimiter":"::","newListener":false,"maxListeners":20,"verboseMemoryLeak":true}
2017/12/09 01:33:12 yapps::sock                  [INFO] listening /tmp/yap/toe-agent.system.sock
2017/12/09 01:33:12 system-info                  [WARN] Error: ENOENT: no such file or directory, open '/tmp/ttt_system'
    at Error (native)
2017/12/09 01:33:12 system-info                  [WARN] failed to read /tmp/ttt_system
2017/12/09 01:33:12 system-info                  [WARN] No available network adapter interfaces with pattern en/eth/wlan/ppp: lo0:
2017/12/09 01:33:12 system-info                  [INFO] context: {"ttt":{"profile":"misc","profile_version":"19700101a"},"os":{"hostname":"grandia"},"runtime":{"node_version":"v4.4.0","node_arch":"x64","node_platform":"darwin"},"cwd":"/private/tmp/toe-agent","interfaces":[{"interface":"lo0:","up":true,"broadcast":true,"running":true,"multicast":true,"loopback":true}],"id":"unknown-undefined"}
2017/12/09 01:33:12 system-helpers               [INFO] successfully initiate an instance of regular-gc
2017/12/09 01:33:12 system-helpers::regular-gc   [INFO] period = 180
2017/12/09 01:33:12 communicator                 [INFO] connections[ps]: settings => {"enabled":true,"url":"tcp://10.90.0.111:6022","channel":null,"broadcast":false}
2017/12/09 01:33:12 communicator                 [INFO] connections[sb0]: settings => {"enabled":false,"url":"tcp://127.0.0.1:10011","channel":null,"broadcast":false}
2017/12/09 01:33:12 communicator                 [INFO] connections[sb0]: DISABLED!!
2017/12/09 01:33:12 communicator                 [INFO] connections[bm0]: settings => {"enabled":false,"url":"tcp://127.0.0.1:10014","channel":null,"broadcast":false}
2017/12/09 01:33:12 communicator                 [INFO] connections[bm0]: DISABLED!!
2017/12/09 01:33:12 communicator                 [INFO] connection[ps]: initiate connection with tcp protocol => tcp://10.90.0.111:6022
2017/12/09 01:33:12 sensorweb3-client            [INFO] initiate-wss-client: http://10.90.0.111:6020, admin, ABCD, false
2017/12/09 01:33:12 sensorweb3-client            [INFO] initiate-tcp-client
2017/12/09 01:33:12 sensorweb3-client            [INFO] communicator.connections[ps]: set callback successfully
2017/12/09 01:33:12 sensorweb3-client            [INFO] initialized.
2017/12/09 01:33:12 agent-manager                [INFO] load class from smith (prebuilt: true) ...
2017/12/09 01:33:12 agent-manager                [INFO] create wrapper instance for smith ...
2017/12/09 01:33:12 agent-wrapper                [WARN] agents[t::smith] missing settings from constructor or config repository...
2017/12/09 01:33:12 agent-wrapper                [INFO] create AgentWrapper with smith
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[t::smith]: create instance ...
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[t::smith]: initialize instance with settings => {}
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[t::smith]: initialize instance successfully. runtime-preferences => {"timer":{"interval":-1},"ps":{"peripheral_state_updated":false,"sensor_events":[]},"aaa":"smith"}
2017/12/09 01:33:12 agent-wrapper                [INFO] jarvis => preferences: {"timer":{"interval":-1},"ps":{"peripheral_state_updated":false,"sensor_events":[]},"aaa":"smith"}
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[t::smith]: initialize environment with jarvis successfully.
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[t::smith]: attach instance to environment successfully.
2017/12/09 01:33:12 agent-manager                [INFO] load class from /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-cestec-plugins/plugins/agent-demo1/src (prebuilt: false) ...
2017/12/09 01:33:12 agent-manager                [INFO] create wrapper instance for /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-cestec-plugins/plugins/agent-demo1/src ...
2017/12/09 01:33:12 agent-wrapper                [WARN] agents[DemoAgent1::src] missing settings from constructor or config repository...
2017/12/09 01:33:12 agent-wrapper                [INFO] create AgentWrapper with src
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[DemoAgent1::src]: create instance ...
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[DemoAgent1::src]: initialize instance with settings => {}
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[DemoAgent1::src]: initialize instance successfully. runtime-preferences => {"timer":{"interval":-1},"ps":{"peripheral_state_updated":false,"sensor_events":["linux::*::cpu::*","sensorboard::*::humidity::*"]}}
2017/12/09 01:33:12 agent-wrapper                [INFO] jarvis => preferences: {"timer":{"interval":-1},"ps":{"peripheral_state_updated":false,"sensor_events":["linux::*::cpu::*","sensorboard::*::humidity::*"]}}
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[DemoAgent1::src].jarvis: successfully register sensor event: linux/*/cpu/*
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[DemoAgent1::src].jarvis: successfully register sensor event: sensorboard/*/humidity/*
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[DemoAgent1::src]: initialize environment with jarvis successfully.
2017/12/09 01:33:12 agent-wrapper                [INFO] agents[DemoAgent1::src]: attach instance to environment successfully.
2017/12/09 01:33:12 agent-manager                [INFO] successfully initialized.
2017/12/09 01:33:12 yapps::BaseApp               [INFO] toe-agent initialized.
2017/12/09 01:33:12 yapps::web                   [WARN] socketio-auth is empty-ized
2017/12/09 01:33:12 yapps::web                   [INFO] _opts[ws] = {"port":6040,"host":"0.0.0.0","headless":true,"view_verbose":false,"api":3,"upload_path":"/private/tmp/toe-agent/work/web/upload","express_partial_response":false,"express_method_overrid":false,"express_multer":false,"ws":{},"appName":"toe-agent"}
2017/12/09 01:33:12 yapps::web                   [INFO] listening 0.0.0.0:6040
2017/12/09 01:33:12 communicator::tcp            [INFO] connected to 10.90.0.111:6022
2017/12/09 01:33:12 yapps::wss-client-core       [INFO] connected to http://10.90.0.111:6020 (channel: client) via websocket protocol
2017/12/09 01:33:12 sensorweb3-client            [INFO] connected to sensorweb3 via websocket
2017/12/09 01:33:12 sensorweb3-client            [INFO] connected to sensorweb3 via websocket and configured. (true)
2017/12/09 01:33:13 system-helpers::regular-gc   [WARN] missing global.gc() function
2017/12/09 01:33:17 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24104527,"epoch":1512754545376}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.7}
2017/12/09 01:33:17 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24105110,"epoch":1512754545959}: linux/7F000001/cpu/_ => {"percentage":6.8}
2017/12/09 01:33:18 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":6} 339ms
2017/12/09 01:33:22 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24110136,"epoch":1512754550986}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.6}
2017/12/09 01:33:27 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24115125,"epoch":1512754555975}: linux/7F000001/cpu/_ => {"percentage":8.3}
2017/12/09 01:33:27 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":8} 22ms
2017/12/09 01:33:28 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24115742,"epoch":1512754556592}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.6}
2017/12/09 01:33:33 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24121348,"epoch":1512754562198}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.5}
2017/12/09 01:33:37 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24125146,"epoch":1512754565996}: linux/7F000001/cpu/_ => {"percentage":16.7}
2017/12/09 01:33:37 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":16} 19ms
2017/12/09 01:33:39 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24126954,"epoch":1512754567804}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.5}
2017/12/09 01:33:45 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24132557,"epoch":1512754573407}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.4}
2017/12/09 01:33:47 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24135162,"epoch":1512754576011}: linux/7F000001/cpu/_ => {"percentage":5.6}
2017/12/09 01:33:47 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":5} 17ms
2017/12/09 01:33:50 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24138166,"epoch":1512754579016}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.5}
2017/12/09 01:33:56 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24143772,"epoch":1512754584622}: sensorboard/ttyO1/humidity/_ => {"temperature":22.3,"humidity":54.4}
2017/12/09 01:33:57 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24145178,"epoch":1512754586028}: linux/7F000001/cpu/_ => {"percentage":5.5}
2017/12/09 01:33:57 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":5} 25ms
2017/12/09 01:34:01 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24149378,"epoch":1512754590227}: sensorboard/ttyO1/humidity/_ => {"temperature":22.2,"humidity":54.4}
2017/12/09 01:34:07 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24154983,"epoch":1512754595833}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.6}
2017/12/09 01:34:07 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24155195,"epoch":1512754596045}: linux/7F000001/cpu/_ => {"percentage":8.5}
2017/12/09 01:34:07 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":8} 29ms
2017/12/09 01:34:13 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24160589,"epoch":1512754601439}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.8}
2017/12/09 01:34:17 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24165210,"epoch":1512754606059}: linux/7F000001/cpu/_ => {"percentage":10.5}
2017/12/09 01:34:17 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":10} 29ms
2017/12/09 01:34:18 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24166196,"epoch":1512754607045}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.8}
2017/12/09 01:34:24 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24171801,"epoch":1512754612651}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.8}
2017/12/09 01:34:27 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24175234,"epoch":1512754616084}: linux/7F000001/cpu/_ => {"percentage":6.7}
2017/12/09 01:34:27 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":6} 19ms
2017/12/09 01:34:29 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24177407,"epoch":1512754618257}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.9}
2017/12/09 01:34:35 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24183014,"epoch":1512754623863}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.9}
2017/12/09 01:34:37 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24185248,"epoch":1512754626097}: linux/7F000001/cpu/_ => {"percentage":5.8}
2017/12/09 01:34:37 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":5} 18ms
2017/12/09 01:34:41 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24188619,"epoch":1512754629469}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.8}
2017/12/09 01:34:46 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24194223,"epoch":1512754635073}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.8}
2017/12/09 01:34:47 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24195266,"epoch":1512754636116}: linux/7F000001/cpu/_ => {"percentage":5.8}
2017/12/09 01:34:47 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":5} 16ms
2017/12/09 01:34:52 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24199830,"epoch":1512754640679}: sensorboard/ttyO1/humidity/_ => {"temperature":22.2,"humidity":54.8}
2017/12/09 01:34:57 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24205282,"epoch":1512754646131}: linux/7F000001/cpu/_ => {"percentage":4.8}
2017/12/09 01:34:57 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":4} 28ms
2017/12/09 01:34:58 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24205437,"epoch":1512754646287}: sensorboard/ttyO1/humidity/_ => {"temperature":22.2,"humidity":54.7}
2017/12/09 01:35:03 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24211042,"epoch":1512754651892}: sensorboard/ttyO1/humidity/_ => {"temperature":22.2,"humidity":54.6}
2017/12/09 01:35:07 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24215299,"epoch":1512754656149}: linux/7F000001/cpu/_ => {"percentage":6.3}
2017/12/09 01:35:07 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":6} 18ms
2017/12/09 01:35:09 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24216648,"epoch":1512754657498}: sensorboard/ttyO1/humidity/_ => {"temperature":22.2,"humidity":54.5}
2017/12/09 01:35:14 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24222254,"epoch":1512754663104}: sensorboard/ttyO1/humidity/_ => {"temperature":22.2,"humidity":54.5}
2017/12/09 01:35:17 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24225318,"epoch":1512754666167}: linux/7F000001/cpu/_ => {"percentage":7.6}
2017/12/09 01:35:17 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":7} 16ms
2017/12/09 01:35:20 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24227858,"epoch":1512754668708}: sensorboard/ttyO1/humidity/_ => {"temperature":22.2,"humidity":54.5}
2017/12/09 01:35:26 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24233471,"epoch":1512754674320}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.5}
2017/12/09 01:35:27 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24235333,"epoch":1512754676183}: linux/7F000001/cpu/_ => {"percentage":8}
2017/12/09 01:35:27 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":8} 25ms
2017/12/09 01:35:31 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24239077,"epoch":1512754679927}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.7}
2017/12/09 01:35:37 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24244683,"epoch":1512754685533}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.7}
2017/12/09 01:35:37 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24245353,"epoch":1512754686203}: linux/7F000001/cpu/_ => {"percentage":16.9}
2017/12/09 01:35:37 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":16} 19ms
2017/12/09 01:35:42 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24250296,"epoch":1512754691146}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.8}
2017/12/09 01:35:47 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24255370,"epoch":1512754696219}: linux/7F000001/cpu/_ => {"percentage":7.4}
2017/12/09 01:35:47 sensorweb3-client            [INFO] perform-actuator-action: sensorboard/ttyO1/led-matrix/_/show-number => {"arg1":7} 29ms
2017/12/09 01:35:48 agent-demo1::demo1           [INFO] {"boots":0,"uptime":24255894,"epoch":1512754696744}: sensorboard/ttyO1/humidity/_ => {"temperature":22.1,"humidity":54.8}
...
```

Then, you can observe the keyword `perform-actuator-action` in console logs to show the cpu percentages to be shown on emoji display. Also refer to following UART logs:

```text
1646I3000038 development#20171208a node@4.4.7 02:14:32 root@1646I3000038 /conscious/current/logs [0]
# socat - unix-connect:/tmp/yap/sensor-web3.sb0.sock
02:37:49.613 ttyO1(127.0.0.1:10001) 0000115271 [->] 21 53                                            | !S
02:37:49.637 ttyO1(127.0.0.1:10001) 0000115272 [->] 30 56                                            | 0V
02:37:49.643 ttyO1(127.0.0.1:10001) 0000115273 [->] 2C 31 33 34 32 33 31 36 32 30 5F 31 33 34 32 33  | ,134231620_13423
02:37:49.643 ttyO1(127.0.0.1:10001) 0000115273 [->] 31 37 34 30 0A                                   | 1740n
02:37:54.211 ttyO1(127.0.0.1:10001) 0000115274 [->] 21 54                                            | !T
02:37:54.214 ttyO1(127.0.0.1:10001) 0000115275 [->] 2C 32 32 2E 31 0A                                | ,22.1n
02:37:54.312 ttyO1(127.0.0.1:10001) 0000115276 [->] 21 48 2C 35 34                                   | !H,54
02:37:54.317 ttyO1(127.0.0.1:10001) 0000115277 [->] 2E 35 0A                                         | .5n
02:37:54.413 ttyO1(127.0.0.1:10001) 0000115278 [->] 21 50 2C 31 30                                   | !P,10
02:37:54.418 ttyO1(127.0.0.1:10001) 0000115279 [->] 32 33 2E 30 0A                                   | 23.0n
02:37:54.513 ttyO1(127.0.0.1:10001) 0000115280 [->] 21 43                                            | !C
02:37:54.517 ttyO1(127.0.0.1:10001) 0000115281 [->] 2C 35                                            | ,5
02:37:54.522 ttyO1(127.0.0.1:10001) 0000115282 [->] 31 37 0A                                         | 17n
02:37:54.613 ttyO1(127.0.0.1:10001) 0000115283 [->] 21 56                                            | !V
02:37:54.617 ttyO1(127.0.0.1:10001) 0000115284 [->] 43 2C                                            | C,
02:37:54.622 ttyO1(127.0.0.1:10001) 0000115285 [->] 36 31 37 0A                                      | 617n
02:37:54.713 ttyO1(127.0.0.1:10001) 0000115286 [->] 21 56                                            | !V
02:37:54.718 ttyO1(127.0.0.1:10001) 0000115287 [->] 2C 31                                            | ,1
02:37:54.722 ttyO1(127.0.0.1:10001) 0000115288 [->] 37 31 0A                                         | 71n
02:37:54.814 ttyO1(127.0.0.1:10001) 0000115289 [->] 21 44                                            | !D
02:37:54.818 ttyO1(127.0.0.1:10001) 0000115290 [->] 2C 31                                            | ,1
02:37:54.823 ttyO1(127.0.0.1:10001) 0000115291 [->] 37 32 2E 34 0A                                   | 72.4n
02:37:54.914 ttyO1(127.0.0.1:10001) 0000115292 [->] 21 53                                            | !S
02:37:54.918 ttyO1(127.0.0.1:10001) 0000115293 [->] 2C 30                                            | ,0
02:37:54.923 ttyO1(127.0.0.1:10001) 0000115294 [->] 2E 30 0A                                         | .0n
02:37:55.014 ttyO1(127.0.0.1:10001) 0000115295 [->] 21 4C                                            | !L
02:37:55.019 ttyO1(127.0.0.1:10001) 0000115296 [->] 4D 2C 31                                         | M,1
02:37:55.023 ttyO1(127.0.0.1:10001) 0000115297 [->] 39 39 0A                                         | 99n
02:37:55.114 ttyO1(127.0.0.1:10001) 0000115298 [->] 21 5A 2C 30 0A                                   | !Z,0n
02:37:55.214 ttyO1(127.0.0.1:10001) 0000115299 [->] 21 53                                            | !S
02:37:55.220 ttyO1(127.0.0.1:10001) 0000115300 [->] 30 56 2C 31 33 34 32 33 31 36 32 30 5F 31 33 34  | 0V,134231620_134
02:37:55.220 ttyO1(127.0.0.1:10001) 0000115300 [->] 32 33 31 37 34 30 0A                             | 231740n
02:37:56.197 ttyO1(127.0.0.1:10001) 0000115301 [<-] 0A 23 4C 4D 4E 2C 38 0A                          | n#LMN,8n
02:37:59.818 ttyO1(127.0.0.1:10001) 0000115302 [->] 21 54 2C 32 32                                   | !T,22
02:37:59.823 ttyO1(127.0.0.1:10001) 0000115303 [->] 2E 31 0A                                         | .1n
02:37:59.919 ttyO1(127.0.0.1:10001) 0000115304 [->] 21 48 2C 35 34                                   | !H,54
02:37:59.923 ttyO1(127.0.0.1:10001) 0000115305 [->] 2E 37 0A                                         | .7n
02:38:00.019 ttyO1(127.0.0.1:10001) 0000115306 [->] 21 50 2C 31 30                                   | !P,10
...
```

You can find the line `02:37:56.197` that indicates `#LMN,8\n` is sent to SensorBoard.