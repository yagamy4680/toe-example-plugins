{lodash_merge} = global.get-bundled-modules!

const EVENT_NAMESPACE_DELIMITER = '::'

const DEFAULT_PREFERENCES =
  timer: {interval: -1s}
  ps:
    peripheral_state_updated: yes
    sensor_events: [
      # 'linux::7F000001::cpu::*',
      # 'sensorboard::*::humidity::*'
    ]
  web:
    frontend: no
    commands: [
      # * name: \change-ruleset, help: 'reconfigure rule engine to run new ruleset'
      # * name: \install-ruleset, help: 'download ruleset from a given url'
    ]
    channels: [
      # * namespace: \mobile
    ]
  blemo:
    channels: [
      # * prefix: \#
      # * prefix: \!
      # * prefix: 0x03
    ]

const PERIPHERAL_RELATIONSHIP_NONE = 0
const PERIPHERAL_RELATIONSHIP_CONFIGURED = 1
const PERIPHERAL_RELATIONSHIP_MANAGED = 2

#
# For any other reason, ToeAgent forcedly detachs the selected agent instance
# from runtime environment.
#
const AGENT_DETACHING_REASON_MISC = 0

#
# Because SWC (sensor-web-client) is disconnected from SensorWeb, all running
# agent instances are forcedly detached from runtime environment.
#
const AGENT_DETACHING_REASON_SWC_DISCONNECTED = 1

##
# Agent base class for implementing any intelligent control logic in TOE device. Developer needs
# to subclass Agent in order to implement their-own control logic. Please note, in Loader of ToeAgent app,
# the maximum number of Agent instance of each Agent class is only one.
#
# Agent is loaded by the Loader of ToeAgent app, and attach to a runtime environment with given
# `jarvis` helper object to interact with Tac, Tic, and Physical world in different ways:
#
#   - Tac apps on Android/iOS phones through BLE/WiFi
#   - Tic apps on PaaS through WAN/Internet/3G/4G connections (via Wstty, in command/notification model)
#   - Physical world near Toe device via Actuators on Peripherals/Boards managed by SensorWeb3
#
#
# Here is the initiation process for an instance of Agent class:
#
# 1. constructor()
#     - create the instance of Agent class (or its subclass)
#     - initiate some required object fields: `name`, `class_name`
#
# 2. init(opts, done)
#     - initialize the Agent instance with the given options/settings loaded from system
#     - Loader shall try to find Agent's options/settings with its `name` field (or class name)
#       from local config repository, and then give the options/settings as `opts` argument
#       to this function.
#     - after initialization, the Agent shall give its runtime preferences to Loader to
#       prepare runtime environments. The runtime preferences shall be a json object
#       as 2nd argument of callback function `done`.
#     - prototype of callback function `done` shall be `done(err, preferences)`
#
# 3. attach(jarvis, done)
#     - attach the instance of Agent to ToeAgent app, and give `jarvis` helper
#       object to sense/manipulate environment.
#
#
# The runtime-preferences (`preferences`) as 2nd argument of init()'s callback function' are used
# by Loader to initiate the environment for Agent to run inside. Runtime preferences shall contain
# following options:
#
# `timer/interval`:
#     Runtime environment shall call Agent's `at-timer-expired()` function at specified
#     interval (in seconds), and continue calling `at-timer-expired()` until the Agent
#     is detached from runtime environment.
#
#     Please note, using this interval setting is better than directly call Nodejs'
#     `setInterval() method because runtime environment might be a sandbox environment
#     such as simulated by [vm](https://nodejs.org/docs/latest-v4.x/api/vm.html) or
#     [vm2](https://github.com/patriksimek/vm2) and forbid some Nodejs apis
#     (e.g. `setInterval`).
#
#
# `ps/sensor_events`:
#     `Namespace` is used to filter sensor data update events that are forwarded from Loader
#     to the Agent instance. The namespace is composed of 4 segment strings: p_type, p_id,
#     s_type, and s_id. For example:
#
#       ```json
#       ['sensorboard', 'ttyO1', 'humidity', 'inside']
#       ```
#
#     Above namespace is composed of these 4 segments:
#       - p_type: sensorboard
#       - p_id  : ttyO1
#       - s_type: humidity
#       - s_id  : inside
#
#     More examples about namespaces:
#
#       ```json
#       ['sensorboard', 'ttyO1', 'humidity', 'outside']
#       ['sensorboard', 'ttyO4', 'water_level', 'high_bound']
#       ['sensorboard', 'ttyO4', 'water_level', 'lower_bound']
#       ```
#
#     The format of namespace could be an array of segment string as above, or a string joined with
#     these segments and delimiter `::` (EVENT_NAMESPACE_DELIMITER). Here are some examples
#     for later format:
#
#       'sensorboard::ttyO1::humidity::outside'
#       'sensorboard::ttyO4::water_level::high_bound'
#       'sensorboard::ttyO4::water_level::lower_bound'
#       'sensorboard::ttyO4::fan::left'
#       'sensorboard::ttyO4::fan::right'
#
#     Wildcard is supported in the namespace. For example
#
#       'sensorboard::ttyO1::fan::*', listen to any FAN on FOOP box
#       '*::*::humidity::*'         , listen to any humidity/temperature sensor event on the box.
#
#     The field `sensor_events` shall be an array of namespaces. Each element in the array
#     should be a string composed of 4 segments and delimiter. Here is one example:
#
#       'ps': {
#           'sensor_events': [
#               'linux::7F000001::cpu::*',
#               'sensorboard::*::humidity::*'
#           ]
#       }
#
#     The identical example json data represented in an array of namespaces, each namespace
#     is composed of 4 segment strings:
#
#       sensor: {
#         namespaces: [
#           ['linux', '7F000001', 'cpu', '*'],
#           ['sensorboard', '*', 'humidity', '*']
#         ]
#       }
#
# `web/frontend`:
#     Serve static pages from the asset directory searched from Agent source directory.
#     By default, it's `false`. Please specify it as `true` to enable this feature.
#
# `web/commands`:
#     The array of supported web commands by this Agent. Each command contains 2 fields:
#       `name`: the name of command
#       `help`: the help messages of the command
#
#     For example:
#
#       ```json
#       [
#         {'name': 'change-ruleset' , 'help': 'reconfigure rule engine to run new ruleset'},
#         {'name': 'install-ruleset', 'help': 'download ruleset from a given url'}
#       ]
#       ```
#
# `web/channels`:
#     The array of socket.io channels managed by this Agent. Please note, the channel
#     equals to the `namespace` in socket.io. Each channel contains 2 fields:
#       `namespace`: the name of channel
#       `help`: the help messages of this channel
#
#     For example:
#
#       ```json
#       [
#         {'namespace': 'mobile', 'help': 'the communication channel with mobile apps'
#       ]
#       ```
#
# `blemo/channels`:
#     The array of command channels handled by this Agent. Each command contains 1 field:
#       `prefix`: the prefix byte.
#
#     For example:
#
#       ```json
#       [
#         {'prefix': '#'},
#         {'prefix': '!'},
#         {'prefix': '0x03'}
#       ]
#
#      For more detils, please refer to BLEMO service section.
#
#
# BLEMO
#   The blemo is a service that manages a BLE peripheral module (e.g. Nordic nRF51822)
#   via UART to establish an wireless connection with Tac on smartphone (Android or iOS)
#   for bi-direction communications.
#
#   1. Packet
#     the container of data less than (or equal to) 20 bytes, transmitted in between
#     Mobile phone and SensorWeb3/BLEMO service. The container must have 2 fields:
#       - prefix byte (0 ~ 1 byte)
#       - payload (1 ~ 20 bytes)
#
#   1.1. RawPacket
#     One type of packet, typically transmitted in Direct Channel, has following 2 field
#     definitions:
#       - prefix byte (`null`)
#       - payload (1 ~ 20 bytes)
#       - 1st byte of payload must be greater than 0x7F
#
#   1.2. CommandPacket
#     Another type of packet, transmitted in the channels other than Direct Channel, has
#     following 2 field definitions:
#       - prefix byte (1 byte, less than 0x7F)
#       - payload (1 ~ 19 bytes)
#
#   2. Channel
#     The bi-direction pipe transmitting packets between Mobile phone and SensorWeb3 via
#     Bluetooth LE (blemo) with one characteristic notification/write. Packets in
#     the same channel must have same prefix byte. Prefix byte is the 1st byte of
#     entire packet payload, which is used to distigunish the purposes of
#     different channels. The range of prefix byte is defined as below:
#
#       0x00 ~ 0x19 , reserved
#       0x20        , heartbeat (implemented by sensorweb3, sent to mobile phone when
#                     no available packet in any channel queue)
#       0x21 ~ 0x7F , used for Toe extensive control protocol with ToeAgent and SensorWeb3
#           - '#', command
#           - '!', informational status update
#       0x80 ~ 0xFF , reserved for transparent/direct transmission
#
#     Right now, the characteristic `F000FF0404514000B000000000001234` is selected
#     because of Nordic firmware 0.6.2.
#
#   2.1. Reserved Channel
#     - The channel with packets whose prefix byte is 0x00 ~ 0x19.
#     - Each channel has its own packet queue. All of these queues are not accessible
#       outside of SensorWeb3.
#     - All packets are `CommandPacket`
#
#   2.2. Heartbeat Channel
#     - The channel with packets whose prefix byte is always in 0x20.
#     - Each channel has its own packet queue, but the size of its queue is always 1
#     - All packets are `CommandPacket`
#
#   2.3. Control Channel
#     - The channel with packets whose prefix byte is always in 0x21 ~ 0x7F.
#     - Each channel has its own packet queue
#     - The payload of packets in control channel shall be less than (or equal to) 19 bytes
#     - All packets are `CommandPacket`
#
#   2.4. Direct Channel
#     - The channel with packets whose prefix byte is always in 0x80 ~ 0xFF
#     - All direct channels share same packet queue
#     - All packets are `RawPacket`
#
#   3. From TOE to TAC
#   3.1. Flow Control
#     - The transmitter consumes a packet from a _selected_ packet queue by dequeue,
#       send the packet to Blemo board via MCS4U protocol with proper _timing_ algorithm,
#       and Blemo board sends the packet to Tac via BluetoothLE characteristic notification
#     - With NordicBoard 0.6.2 firmware, the timing algorithm is simply implemented by
#       a timer with 300ms interval. In the future, it is possible to be improved by
#       using characteristic notification with indication flag to shorten the 300ms
#       interval.
#
#   3.2. QoS
#     - The transmitter selects packet queue based on its priority.
#     - Maybe starvation when the speed of producing packets in a channel queue with
#       high priority is more than packet consuming speed (3.33 packets per
#       seconds => 300ms as interval)
#     - Priorities by order:
#       1. Reserved Channel queues (0x00 > 0x01 > 0x02 > ... > 0x19)
#       2. Direct Channel queue
#       3. Control Channel queues (priority of each queue can be decided at runtime)
#       4. Heartbeat Channel queue
#
#   4. From TAC to TOE
#   4.1. Dispatch (from Tac to Toe via Blemo board)
#     - The received packet is distigunished by its prefix byte, and dispatch to
#       the corresponding channel handler to process.
#     - One channel is allowed to have zero or one packet handler to process the
#       incoming packets from Tac
#
class Agent
  @constants = {
    EVENT_NAMESPACE_DELIMITER, DEFAULT_PREFERENCES
    PERIPHERAL_RELATIONSHIP_NONE, PERIPHERAL_RELATIONSHIP_CONFIGURED, PERIPHERAL_RELATIONSHIP_MANAGED,
    AGENT_DETACHING_REASON_MISC, AGENT_DETACHING_REASON_SWC_DISCONNECTED
  }
  ##
  # Constructor of Agent class, without any argument.
  #
  (amodule) ->
    p = null
    p = amodule.filename if amodule? and not p?
    p = amodule.id if amodule? and not p?
    @preferences = lodash_merge {}, DEFAULT_PREFERENCES
    @module_path = p
    return


  ##
  # Indicate the Agent instance to initialize itself with given options/settings. After
  # initialization successfully, the Agent shall invoke the callback function `done`
  # with Agent's preferred runtime settings (`preferences`) as 2nd argument to Loader.
  #
  # @opts     the json data object as options/settings to initialize Agent.
  #
  # @done     the callback function to indicate initialization is successful or failed.
  #           When success, the 1st argument `err` shall be `null` and 2nd argument shall be
  #           a json data object as `preferences`.
  #           When fail, the 1st argument `err` shall contain the error object.
  #
  init: (@opts, done) ->
    return done null, @preferences


  ##
  # Indicate the Agent is attached to the runtime environment with given `jarvis` helper
  # object to interact with Tac, Tic, and Physical world:
  #
  #   - Tac apps on Android/iOS phones through BLE/WiFi
  #   - Tic apps on PaaS through WAN/Internet/3G/4G connections (via Wstty)
  #   - Physical world near Toe device via Actuators on Peripherals/Boards managed by SensorWeb3
  #
  # After attaching is done, Agent shall invoke the callback function `done` to
  # notify Loader that Agent is ready to execute its own control logics.
  #
  # @jarvis   the instance of Jarvis.
  #
  # @done     the callback function to indicate environment-attaching is done successfully or
  #           failure with error. When fail, the 1st argument `err` shall contain the error object.
  #           When success, the 1st argument `err` shall be `null`.
  #
  attach: (@jarvis, done) ->
    return done null, "please write your implementations here ..."


  ##
  # Indicate the Agent is detached from the runtime environment. Please note, the detach
  # process is synchronous so there is no `done` callback function in the function
  # prototype.
  #
  # @reason   the reason why the agent instance is forcedly detached from
  #           runtime environment. Its value might be one of AGENT_DETACHING_REASON_xxx
  #           constants.
  #             - AGENT_DETACHING_REASON_MISC
  #             - AGENT_DETACHING_REASON_SWC_DISCONNECTED
  #
  detach: (reason=AGENT_DETACHING_RATIONALE_MISC) ->
    return "please write your implementations here ..."


  ##
  # Notify the Agent instance with a sensor data update event that is registered at
  # Agent initiation phase by specify `ps/sensor_events` field in runtime preference
  # json object.
  #
  # @timestamp  the timestamp object indicates when the sensor data is measured. It can be
  #             null, that indicates the timestamp object shall be generated by the
  #             listener of sensor data update event. There are 3 fields in the timestamp
  #             object: epoch, uptime, and boots.
  #               - epoch , the epoch time on the local Linux system that produces the sensor data event
  #               - uptime, the system uptime of Linux system
  #               - boots , the number of booting up times for the Linux system.
  #
  # @p_type     the type of peripheral (board or machine) associated with the
  #             host/node that runs SensorWeb, e.g. sensorboard, mainboard, echonetlite,
  #             hvac, and so on... The association is either wired (e.g. UART, RS485,
  #             I2C, ...) or wireless (Bluetooth LE, 802.11a/b/g, LoRa, or ZigBee).
  #
  # @p_id       the unique id of the board (or machine) associated with the host/node.
  #             Sometimes, one host/node might associate more than one board with same
  #             type, e.g. A home gateway is associated with 3 BLE coffee machines
  #             in a coffee shop, and use the BLE mac address of each coffee machine
  #             as its unique identity.
  #
  # @s_type     the type of sensor on the board/peripheral (or machine) associated with
  #             the host/node, such as humidity sensor (e.g. st221), ambient light
  #             sensor (e.g. alspt315),dust sensor (e.g. dust), ultrasonic sensor,
  #             and so on.
  #
  # @s_id       the unique id of sensor on the board/peripheral (or machine) associated
  #             with the host/node. The unique identity is used to distigunish 2 sensors
  #             with same type but for different purposes. For example, in a plant box,
  #             there are 2 humidity sensors, one is used to measure humidity/temperature
  #             inside the box while another one is used to measurement same data
  #             outside the box.
  #
  # @data       the dictionary object with all measured data points in form of
  #             key-value pairs. For example, a humidity sensor (st221) can
  #             measure humidity/temperature data, that is represented as
  #             following json object:
  #
  #               ```json
  #               {
  #                 'humidity': 65,
  #                 'temperature': 27.3
  #               }
  #               ```
  #
  #             At SensorWeb3, each peripheral-service can emit a sensor data
  #             update event with data points, as an array of data points and
  #             each data point contains `data_type` and `value` fields. So,
  #             above data object measured by st221 is represented as following
  #             json object in SensorWeb3:
  #
  #               ```json
  #               [
  #                 {"data_type": "humidity"   , value: "65"},
  #                 {"data_type": "temperature", value: "27.3"}
  #               ]
  #               ```
  #
  at-sensor-updated: (timestamp, p_type, p_id, s_type, s_id, data) ->
    return "please write your implementations here ..."


  ##
  # Notify the Agent instance with a peripheral object state update event.
  #
  # @timestamp  the timestamp object indicates when the peripheral object is updated,
  #             and there are 3 fields in the timestamp object: epoch, uptime, and boots.
  #               - epoch , the epoch time on the local Linux system that produces the sensor data event
  #               - uptime, the system uptime of Linux system
  #               - boots , the number of booting up times for the Linux system.
  #
  # @p_type     the type of peripheral (board or machine) associated with the
  #             host/node that runs SensorWeb, e.g. sensorboard, mainboard, echonetlite,
  #             hvac, and so on... The association is either wired (e.g. UART, RS485,
  #             I2C, ...) or wireless (Bluetooth LE, 802.11a/b/g, LoRa, or ZigBee).
  #
  # @p_id       the unique id of the board (or machine) associated with the host/node.
  #             Sometimes, one host/node might associate more than one board with same
  #             type, e.g. A home gateway is associated with 3 BLE coffee machines
  #             in a coffee shop, and use the BLE mac address of each coffee machine
  #             as its unique identity.
  #
  # @relationship   the relationship between TOE and the peripheral object, that might be:
  #               - RELATIONSHIP_NONE (0)
  #               - RELATIONSHIP_CONFIGURED (1)
  #               - RELATIONSHIP_MANAGED (2)
  #
  # @metadata   the metadata associated with the peripheral object
  #
  at-peripheral-object-updated: (timestamp, p_type, p_id, relationship, metadata) ->
    return "please write your implementations here ..."


  ##
  # Get the agent's default settings that are initialized at constructor phase.
  #
  get-base-settings: ->
    {name} = self = @
    return {name}


  ##
  # Receive a command packet from Tac through BLE module (e.g. Nordic nRF51822).
  # For example, when a command packet '#ABC' is received from Tac, the callback
  # function is invoked with these values:
  #
  #     category: 'control'
  #     alias   : '#'
  #     byte    : 35
  #     payload : [65, 66, 67]
  #
  # Another example packet is \x01\x02\x03, then the values for callback are
  #
  #     category: 'reserved'
  #     alias   : '0x01'
  #     byte    : 1
  #     payload : [2, 3]
  #
  # For more details about channel, packet, and command, please refer
  # to BLEMO section in the documentations.
  #
  #
  # @category   the category of channel that receives this packet. possible
  #             values are:
  #               - reserved
  #               - control
  #               - heartbeat (rarely happened)
  #
  # @alias      the string representation of prefix byte, maybe a visible
  #             character (e.g. '#', '!'), or a hex string to represent
  #             invisible character (e.g. '0x03', '0x04')
  #
  # @byte       the code unit value of prefix byte (unsigned int8), in
  #             between 0 and 255.
  #
  # @payload    the buffer object for rest bytes after prefix byte.
  #
  at-blemo-cmd-packet: (category, alias, byte, payload) ->
    return "please write your implementations here ..."

  ##
  # Indicate the queue for one Command Channel is dequeued one packet
  # that is delivered to Tac through Blemo board (e.g. Nordic nRF51822)
  #
  # @category   the category of command channel whose queue is empty.
  #             possible values are:
  #               - reserved
  #               - control
  #               - heartbeat (rarely happened)
  #
  # @alias      the string representation of prefix byte of the
  #             command queue, maybe a visible character (e.g. '#', '!'),
  #             or a hex string to represent invisible character (e.g. '0x03',
  #             '0x04')
  #
  # @byte       the code unit value of prefix byte (unsigned int8) of
  #             the command channel, in between 0 and 255
  #
  # @remainings the number of remaining packets in this Command Channel
  #
  at-blemo-cmd-queue-dequeued: (category, alias, byte, remainings) ->
    return "please write your implementations here ..."

  ##
  # Receive a raw packet from Tac through BLE module. Note that
  # the 1st byte of the raw packet must be greater than 0x7F.
  # (0x80 ~ 0xFF).
  #
  # For more details about channel, packet, and command, please refer
  # to BLEMO section in the documentations.
  #
  # @payload    the buffer object for all bytes. (1 ~ 20 bytes).
  #
  at-blemo-raw-packet: (buffer) ->
    return "please write your implementations here ..."

  ##
  # Indicate the queue for Direct Channel is dequeued one packet
  # that is delivered to Tac through Blemo board (e.g. Nordic nRF51822)
  #
  # @remainings the number of remaining packets in the Direct Channel
  #
  at-blemo-raw-queue-dequeued: (remainings) ->
    return "please write your implementations here ..."

  ##
  # Indicate TAC is already connected to the BLE peripheral board managed
  # by TOE, and enable the notification of the designated characteristic
  # for bi-direction transmission, or TAC is disconnected from BLE peripheral
  # board.
  #
  # @opened     `true` indicates the bi-direction transmission among all
  #             channels through BLE is opened. Agent can start to send
  #             packets to Tac, or Agent can receive packets from Tac.
  #
  #             `false` indicates the bi-direction transmission among
  #             all channels through BLE is closed. It might be caused by
  #             Tac is disconnected from BLE peripheral board, or Tac
  #             disable the notification of the designated characteristic.
  #
  # @address    The mac address of mobile phone that running Tac to connect
  #             to the BLE peripheral board managed by SensorWeb3/BLEMO
  #             service.
  #
  at-blemo-transmission-state-updated: (opened, address) ->
    return "please write your implementations here ..."

  ##
  # Indicate that BLEMO service is ready to serve Agent. Please note, the
  # callback function shall be invoked only one time.
  #
  # In most cases, the `ready` is always `true` because SensorWeb3 already
  # manages Blemo board (e.g. Nordic nRF51822). However, when the UART
  # port or Tcp daemon (by socat) is reset, the pipe connection shall be
  # disconnected for a short period, and then `ready` is false in this
  # short period.
  #
  # @ready      ready or not.
  # @metadata   the metadata to describe the BLE peripheral board and the
  #             information about TAC that connects to BLE peripheral board.
  #             For example:
  #
  #             ```json
  #               {
  #                 "bluetooth": {
  #                   "local_address": "034FA65E63CC",
  #                   "device_name": "CNSCS_0.6.2_A65E63CC"
  #                 },
  #                 "system": {
  #                   "built_at": "20170308_0822_UTC",
  #                   "built_by": "yagamy",
  #                   "firmware_version": "0.6.2"
  #                 }
  #               }
  #             ```
  #
  at-blemo-ready: (ready, metadata) ->
    return "please write your implementations here ..."

  ##
  # Indicate the BluetoothModem receives a binary file from Tac
  # through the specific Command Channel.
  #
  # @prefix     the first byte of packet to specify Command
  #             Channel, e.g. `&`, `*`
  #
  # @filename   the name of file. Please note, it must be
  #             less than 8 bytes.
  #
  # @bytes      the buffer of bytes as file content
  #
  at-blemo-modem-file-received: (prefix, filename, bytes) ->
    return "please write your implementations here ..."

  ##
  # Process a command request from web interface, either HTTP REST (POST)
  # or Websocket.
  #
  # HTTP REST (POST):
  #     When ToeAgent receives request from `/api/v3/c/[agent-class-name]/[command]`,
  #     the HTTP request are packed as arguments to this callback function. For example,
  #     when you use httpie tool to perform following request:
  #
  #       http http://127.0.0.1:6040/api/v3/c/TestAgent/hello-world \
  #         user==root \
  #         date==$(date '+%Y%m%d') \
  #         message=great \
  #         value:=23 \
  #         verbose:=true
  #
  #     Then, the function shall receive following arguments:
  #
  #         remote    : {'type': 'unknown', 'ip': '127.0.0.1', 'port': 65291}
  #         command   : 'hello-world'
  #         parameters: {'user': 'root', 'date': '20171214'}
  #         context   : {'message': 'great', 'value': 23, 'verbose': true}
  #
  #
  # @remote     the information about remote client which issues this command
  #             request.
  #
  # @command    the name of command to be proceeded.
  #
  # @parameters the dictionary object of parameters for the command, composed from
  #             the query string of HTTP request. By default, it is `{}`.
  #
  # @context    the json object of the context for the command, derived from
  #             the POST body of HTTP request. By default, it is `{}`.
  #
  # @done       callback function to indicate ToeAgent when the command processing
  #             is finished. 1st argument as error, while 2nd argument as
  #             processing results to be sent back to remote client. 2nd argument
  #             shall be a JSON object, or a `null`.
  #
  process-web-command: (remote, command, parameters, context, done) ->
    return done null, "please write your implementations here ..."


  ##
  # With web/channels registered, the incoming socket.io connections are passed to
  # this callback function.
  #
  at-socketio-incoming-connection: (namespace, socket) ->
    return "please write your implementations here ..."


##
# The assistant object to help Agent in the runtime environment to interact with Tac apps, Tic apps
# and physical world.
#
class Jarvis
  (@dummy) ->
    return

  ##
  # Get system information by specified category.
  #
  # @category       the category of system information to be retrieved. The values of `category`
  #                 and their possible responses are listed as below:
  #
  #                 `ttt`, the system information from `/tmp/ttt_system` file generated during
  #                 Linux init process. For example:
  #
  #                   {
  #                     "profile": "conscious",
  #                     "profile_version": "20171226c",
  #                     "id": "1725C3100002",
  #                     "sn": "1725C3100002",
  #                     "alias": "1725C3100002",
  #                     "base_version": "99991231z",
  #                     "profile_env": "production",
  #                     "wireless_ap_mac": "00:A0:DE:E5:E0:80",
  #                     "wireless_ip_addr": "192.168.11.73",
  #                     "wireless_mac_addr": "80:30:dc:2d:5e:fc",
  #                     "wireless_handshake_time": "1",
  #                     "wireless_ssid": ""
  #                   }
  #
  #                 `id`, the unique identity, e.g. `1725C3100002`
  #
  #                 `runtime`, the information about nodejs runtime for ToeAgent, e.g.
  #
  #                   {
  #                     "node_version": "v4.4.7",
  #                     "node_arch": "arm",
  #                     "node_platform": "linux"
  #                   }
  #
  sys-get-system-info: (category) ->
    return "unimplemented!!"

  ##
  # Perform an action with the actuator on the peripheral board.
  #
  # @p_type         the type of peripheral (board or machine) associated with the host/node that
  #                 runs SensorWeb, e.g. sensorboard, mainboard, echonetlite, hvac,
  #                 and so on... The associate is either wired (e.g. UART, RS485,
  #                 I2C, ...) or wireless (Bluetooth LE, 802.11a/b/g, LoRa, or ZigBee).
  #
  # @p_id           the unique id of the board (or machine) associated with the host/node.
  #                 Sometimes, one host/node might associate more than one board with same
  #                 type, e.g. A home gateway is associated with 3 BLE coffee machines
  #                 in a coffee shop, and use the BLE mac address of each coffee machine
  #                 as its unique identity.
  #
  # @a_type         the type of actuator on the board (or machine) associated with the host/node,
  #                 such as fan, pump, led, led-matrix, and so on.
  #
  # @a_id           the unique id of actuator on the same board (or same machine), because one
  #                 board (or machine) might have more than one actuator with same type. For
  #                 example, an A/C might might have 2 FANs with different identity: 0000 and
  #                 0001.
  #
  # @action         the supported action of the actuator. Typically, the action `set` is the
  #                 most frequently supported. In some special types of actuators, there are
  #                 more supported actions. Taking led-matrix as example, here are the supported
  #                 actions:
  #                   - show-number, to display 00 ~ 99 number on led matrix.
  #                   - show-ascii, to display one visible ascii character on led matrix.
  #                   - show-animation, to play built-in animation on led matrix.
  #
  # @arg1           the 1st argument of action value.
  # @arg2           the 2nd argument of action value.
  # @arg3           the 3rd argument of action value.
  #
  # @done           the callback function to indicate the action performing is done successfully
  #                 or with error. Only one argument `err` in the callback function prototype.
  #
  perform-actuator-action: (p_type, p_id, a_type, a_id, action, arg1, arg2, arg3, done) ->
    return done "unimplemented!!"

  ##
  # List all registered peripheral types (`p_type`). Equals to perform SensorWeb3
  # http query as below
  #
  #   http http://localhost:6020/api/v3/p format==keys
  #
  # @done           the callback function to indicate the request is done successfully
  #                 or with error. 1st argument of callback function is `err` while
  #                 2nd argument of callback function is `types` as array of strings.
  #
  list-peripheral-types: (done) ->
    return done "unimplemented!!"

  ##
  # List all registered peripheral types (`p_type`). Equals to perform SensorWeb3
  # http query as below
  #
  #   http http://localhost:6020/api/v3/p format==array
  #
  # @done           the callback function to indicate the request is done successfully
  #                 or with error. 1st argument of callback function is `err` while
  #                 2nd argument of callback function is `types` as array of strings.
  #
  list-peripheral-types-in-details: (done) ->
    return done "unimplemented!!"

  ##
  # List all peripheral ids (`p_id`) of same peripheral type (`p_type`). Equals to
  # perform SensorWeb3 http query as below
  #
  #   http http://localhost:6020/api/v3/p/[p_type]
  #
  # @p_type         the type of peripheral
  #
  # @done           the callback function to indicate the request is done successfully
  #                 or with error. 1st argument of callback function is `err` while
  #                 2nd argument of callback function is `ids` as array of strings.
  #
  list-peripheral-ids: (p_type, done) ->
    return done "unimplemented!!"

  ##
  # Get peripheral object information with specified `p_type` and `p_id`. Equals to
  # perform SensorWeb3 http query as below
  #
  #   http http://localhost:6020/api/v3/p/[p_type]/[p_id]
  #
  # @p_type         the type of peripheral
  #
  # @p_id           the id of peripheral
  #
  # @done           the callback function to indicate the request is done successfully
  #                 or with error. 1st argument of callback function is `err` while
  #                 2nd argument of callback function is json object of the peripheral
  #                 object.
  #
  #                 The json object shall contain following fields:
  #
  #                 - `id`, the peripheral id
  #                 - `type`, the peripheral type
  #                 - `metadata`, the metadata information for the peripheral object
  #                 - `path`, indicates the access path
  #                 - `service`, the peripheral service that manages the peripheral object
  #                 - `state`, indicates the peripheral object is managed/configured/none state
  #                 - `updated_at`, the last update time
  #
  get-peripheral-object-info: (p_type, p_id, done) ->
    return done "unimplemented!!"

  ##
  # Push a packet to the Command Channel.
  #
  # @prefix     the first byte of packet, is also used for agent
  #             manager to send command packet to the
  #             Command Channel that has same prefix byte.
  #             For example, `%`, `#`, `!`
  #
  # @payload    the buffer object for rest bytes after prefix byte.
  #             the total size of payload bytes shall be 1 ~ 19 bytes.
  #
  # @done       the callback function to indicate the packet is
  #             inserted into that queue of Command Channel in SensorWeb3
  #             successfully or not. The callback function shall
  #             only have one parameter `err`. When it is successful to
  #             insert the packet to queue, the `err` object is null.
  #
  #             Please note, the success of inserting command packet
  #             into the queue of Command Channel doesn't guarantee the
  #             packet is successfully delivered to Tac, because it depends
  #             on the FlowControl and QoS logics in SensorWeb3.
  #
  blemo-push-command-channel: (prefix, payload, done) ->
    return done "unimplemented!!"

  ##
  # Push a packet to the Direct Channel, whose prefix byte is always
  # greater than 0x7F.
  #
  # @buffer     the buffer object of entire packet.
  #             the total size of payload bytes shall be 1 ~ 20 bytes.
  #
  # @done       the callback function to indicate the packet is
  #             inserted into that queue of Direct Channel in SensorWeb3
  #             successfully or not. The callback function shall
  #             only have one parameter `err`. When it is successful to
  #             insert the packet to queue, the `err` object is null.
  #
  #             Please note, the success of inserting raw packet
  #             into the queue of Direct Channel doesn't guarantee the
  #             packet is successfully delivered to Tac, because it depends
  #             on the FlowControl and QoS logics in SensorWeb3.
  #
  blemo-push-direct-channel: (buffer, done) ->
    return done "unimplemented!!"

  ##
  # Transfer a binary file based on BleModem protocol through
  # a specified Command Channel.
  #
  # @prefix     the first byte of packet to specify Command
  #             Channel, e.g. `&`, `*`
  #
  # @filename   the name of file. Please note, it must be
  #             less than 8 bytes.
  #
  # @bytes      the buffer of bytes as file content
  #
  # @done       the callback function to indicate the file
  #             transfer is done successfully, or with
  #             some failures.
  #
  blemo-modem-transfer-file: (prefix, filename, bytes, done) ->
    return done "unimplemented!!"


  ##
  # Reset BleModem protocol that is running on a specified
  # Command Channel.
  #
  # @prefix     the first byte of packet to specify Command
  #             Channel, e.g. `&`, `*`
  #
  # @done       the callback function to indicate the file
  #             transfer is done successfully, or with
  #             some failures.
  #
  blemo-modem-reset: (prefix, done) ->
    return done "unimplemented!!"


  ##
  # Get the list of peripheral types from sensor data tree
  # in snapshot storage. Euqls to `http :6020/api/v3/s`
  #
  sensortree-list-peripheral-types: (done) ->
    return done "unimplemented!!"

  ##
  # Get the list of peripheral ids of specified peripheral
  # type from sensor data tree in snapshot storage. Euqlas
  # to `http :6020/api/v3/s/[p_type]`
  #
  sensortree-list-peripheral-ids: (p_type, done) ->
    return done "unimplemented!!"

  ##
  # Get the list of sensor types of specified peripheral
  # type and peripheral id from sensor data tree in snapshot
  # storage. Equals to `http :6020/api/v3/s/[p_type]/[p_id]
  #
  sensortree-list-sensor-types: (p_type, p_id, done) ->
    return done "unimplemented!!"

  ##
  # Get the list of sensor ids of specified peripheral
  # type, peripheral id, and sensor type from sensor data tree
  # in snapshot storage. Equals to `http :6020/api/v3/s/[p_type]/[p_id]/[s_type]
  #
  sensortree-list-sensor-ids: (p_type, p_id, s_type, done) ->
    return done "unimplemented!!"

  ##
  # Get the sensor data with specified peripheral
  # type, peripheral id, sensor type and sensor id from sensor
  # data tree in snapshot storage. Equals to
  # `http :6020/api/v3/s/[p_type]/[p_id]/[s_type]/[s_id]`
  #
  sensortree-get-sensor-data: (p_type, p_id, s_type, s_id, done) ->
    return done "unimplemented!!"

  ##
  # Get the tree data of entire snapshot storage.
  #
  # @format     either 'array' or 'tree'. By default, it is 'tree'.
  #
  sensortree-get-snapshot: (format, done) ->
    return done "unimplemented!!"


module.exports = exports = global.add-bundled-module {Agent, Jarvis}
