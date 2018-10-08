EE = require \events

const EVENT_DATA_UPDATED = \data-updated
const EVENT_PERIPHERAL_UPDATED = \peripheral-updated
const EVENT_PIPE_UPDATED = \pipe-updated    # only applicable for PIPE working mode of PeripheralService
const EVENT_LIST = [EVENT_DATA_UPDATED, EVENT_PERIPHERAL_UPDATED, EVENT_PIPE_UPDATED]
const EVENTS = {EVENT_DATA_UPDATED, EVENT_PERIPHERAL_UPDATED, EVENT_PIPE_UPDATED}

const RELATIONSHIP_NONE = 0
const RELATIONSHIP_CONFIGURED = 1
const RELATIONSHIP_MANAGED = 2
const RELATIONSHIPS = {RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, RELATIONSHIP_MANAGED}

const MODE_STANDALONE = 0      # settings: {}
const MODE_PIPE = 1            # settings: {pipes: [{name, byline}, {name, byline}]} => `name`, the tcp-proxy's bridge name to hook, `byline`: true/false to indicate binary streaming or line-based streaming
const MODE_META = 2            # settings: {types: [...]}
const MODES = {MODE_STANDALONE, MODE_PIPE, MODE_META}


class PeripheralService
  @events = EVENTS
  @relationships = RELATIONSHIPS
  @modes = MODES

  (@opts, @uptime=null, @pmodule=null) ->
    @mode = MODE_STANDALONE
    @mode_settings = {}
    @name = \unknown
    @description = \unknown
    @types = []
    @spec = null
    @ee = new EE!
    @pm = global.get-bundled-modules! .create_module_helper pmodule

  ##
  # Initialize the PeripheralService. After initialization, all data/peripheral
  # update events can be broadcasted.
  #
  init: (done) ->
    return done!

  ##
  # Discover all available peripherals under the wired/wireless protocols
  # supported by the service.
  #
  discover: ->
    return

  ##
  # Get the name of this service.
  #
  get-name: ->
    return @name

  ##
  # Get all supported types of peripherals.
  #
  get-supported-types: ->
    return @types

  ##
  # Get the description of the peripheral service.
  #
  get-description: ->
    return @description

  ##
  # Get all information for the peripheral service, in json object format.
  #
  to-json: ->
    {name, types, description, mode, mode_settings, spec} = @
    peripheral_types = types
    return {name, peripheral_types, description, mode, mode_settings, spec}

  ##
  # Get the unit-length of the specific data measured by the sensor (`sensor_type`) on
  # the peripheral board (`p_type`).
  #
  # @p_type         the type of peripheral (board or machine) associated with the host/node that
  #                 runs SensorWeb, e.g. sensorboard, mainboard, echonetlite, hvac,
  #                 and so on... The associate is either wired (e.g. UART, RS485,
  #                 I2C, ...) or wireless (Bluetooth LE, 802.11a/b/g, LoRa, or ZigBee).
  #
  # @sensor_type    the sensor/controller/component on the peripheral/board that measures physical
  #                 world (or software system) to generate data points from time to time.
  #                 e.g. rht30, ti-tmp006, sensirion-sht21, cpu, ...
  #
  # @data_type      the type of data measured by the specified sensor. Please note, one sensor might
  #                 be able to measure multiple types of data, such as SHT21 sensor can capture
  #                 humidity and temperature data.
  #                 e.g. humidity, temperature, co2, dust, uptime, used
  #
  # get-unit-length: (p_type, sensor_type, data_type) ->
  #   return ""

  ##
  # Request to perform an action with the actuator on the peripheral (board or machine)
  # associated with the host/node running SensorWeb.
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
  # @arg1           the 1st argument value for the action to be performed.
  # @arg2           the 2nd argument value for the action to be performed.
  # @arg3           the 3rd argument value for the action to be performed.
  #
  # @done           the callback function to indicate the request is successful or not.
  #                 when failure, the 1st argument `err` shall be the error object.
  #
  perform-action: (p_type, p_id, a_type, a_id, action, arg1, arg2, arg3, done) ->
    return done "unimplemented!!"

  ##
  # Register listeners to sensor data change event and peripheral object state change event.
  #
  # `data-updated`, (p_type, p_id, s_type, s_id, points)
  #     sensor data event,
  #       @p_type       the type of peripheral
  #       @p_id         the unique identity of peripheral in same category `p_type`
  #       @s_type       the type of sensor
  #       @s_id         the unique idtntity of sensor in same category `s_type`
  #       @points       the array of data elements, each element contains 2 fields: `data_type` and `value`.
  #
  #
  # `peripheral-updated`, (p_type, p_id, relationship, metadata)
  #     peripheral object state change event
  #       @p_type       the type of peripheral
  #       @p_id         the unique identity of peripheral in same category `p_type`
  #       @relationship the relationship, either RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, or RELATIONSHIP_MANAGED
  #       @metadata     the key-value pairs as metadata of the peripheral object with `p_type` and `p_id`.
  #
  # `pipe-updated`, (line_or_buffer)
  #     pipe data emitted event, only applicable for MODE_PIPE
  #
  on: (event, listener) ->
    throw new Error "unsupported event #{event}" unless event in EVENT_LIST
    return @ee.on event, listener

  ##
  # Remove the registered listener
  #
  remove-listener: (event, listener) ->
    throw new Error "unsupported event #{event}" unless event in EVENT_LIST
    return @ee.removeListener event, listener

  ##
  # Broadcast sensor data update event.
  #
  # @p_type         the type of peripheral (board or machine) associated with the host/node that
  #                 runs SensorWeb, e.g. sensorboard, mainboard, echonetlite, hvac,
  #                 and so on... The association is either wired (e.g. UART, RS485,
  #                 I2C, ...) or wireless (Bluetooth LE, 802.11a/b/g, LoRa, or ZigBee).
  #
  # @p_id           the unique id of the board (or machine) associated with the host/node.
  #                 Sometimes, one host/node might associate more than one board with same
  #                 type, e.g. A home gateway is associated with 3 BLE coffee machines
  #                 in a coffee shop, and use the BLE mac address of each coffee machine
  #                 as its unique identity.
  #
  # @s_type         the type of sensor on the board/peripheral (or machine) associated with the host/node,
  #                 such as humidity sensor (e.g. st221), ambient light sensor (e.g. alspt315),
  #                 dust sensor (e.g. dust), ultrasonic sensor, and so on.
  #
  # @s_id           the unique id of sensor on the board/peripheral (or machine) associated with
  #                 the host/node. The unique identity is used to distigunish 2 sensors with
  #                 same type but for different purposes. For example, in a plant box, there are
  #                 2 humidity sensors, one is used to measure humidity/temperature inside the box
  #                 while another one is used to measurement same data outside the box.
  #
  # @points         the collection of data points measured by the specified sensor. Each data point
  #                 shall contain 2 fields: `data_type` and `value`. For example, a humidity sensor (st221)
  #                 shall measure humidity/temperature data, represented as below (in json format):
  #
  #                   [
  #                     {"data_type": "humidity"   , value: 65},
  #                     {"data_type": "temperature", value: 27.3}
  #                   ]
  #
  #                Since SensorWeb 3.5.7, all the measured data points can be packed as a javascript
  #                object with key-value pairs. For example:
  #
  #                   {
  #                     'humidity': 65,
  #                     'temperature': 27.3
  #                   }
  #
  # @timestamp     the timestamp object indicates when the sensor data is measured. It can be
  #                null, that indicates the timestamp object shall be generated by the
  #                listener of sensor data update event. There are 3 fields in the timestamp
  #                object: epoch, uptime, and boots.
  #                 - epoch , the epoch time on the local Linux system that produces the sensor data event
  #                 - uptime, the system uptime of Linux system
  #                 - boots , the number of booting up times for the Linux system.
  #
  #                In most case, it is listener's responsibility to produce timestamp object in order to
  #                ensure information source is unique. However, for some special cases, multiple measurements
  #                are produced at the exactly-same timestamp, such as `linux_process/*/node/* cpu=xxx,memory=xxx`,
  #                but that cannot be emitted by single function call of `emit-data`. Then, it is better for
  #                event source to produce timestamp object to guarantee multiple measurements share same timestamp.
  #
  #                 linux_process/sensor_web/node/_ cpu=50,memory=22
  #                 linux_process/bt_web/node/_ cpu=23,memory=15
  #                 linux_process/tcp_proxy/node/_ cpu=37 memory=18
  #
  #               Please note, the timestamp argument can be null, then PeripheralService base class shall
  #               use the internal SystemUptime object to generate current timestamp object when SystemUptime
  #               exists. More information about SystemUptime, please refer to
  #               https://github.com/yagamy4680/yapps/blob/master/lib/system-uptime.ls
  #
  emit-data: (p_type, p_id, s_type, s_id, points, timestamp=null) ->
    ### DEVELOPER: please don't change this code, just call this function.
    return @ee.emit EVENT_DATA_UPDATED, p_type, p_id, s_type, s_id, points, timestamp if timestamp?
    return @ee.emit EVENT_DATA_UPDATED, p_type, p_id, s_type, s_id, points, @.now!

  ##
  # Broadcast `peripheral-updated` event.
  #
  emit-peripheral-state: (p_type, p_id, relationship, metadata) ->
    ### DEVELOPER: please don't change this code, just call this function.
    return @ee.emit EVENT_PERIPHERAL_UPDATED, p_type, p_id, relationship, metadata

  ##
  # Broadcast `pipe-updated` event in order to send data to peer via communicator's
  # connection.
  #
  # @name           the name of tcp-proxy's bridge, to send the data to the communicator
  #                 connection that is associated with the tcp-proxy bridge. E.g. `sb0`, `bm0`
  #
  # @data           the data to be sent to communicator's connection. Might be string or buffer
  #                 object.
  #
  emit-pipe-data: (name, data) ->
    ### DEVELOPER: please don't change this code, just call this function.
    return @ee.emit EVENT_PIPE_UPDATED, name, data

  ##
  # Process the data from pipe, either LINE or BUFFER.
  #
  # @name           the name of tcp-proxy's bridge, whose communicator's connection
  #                 receives these data, and forward to PeripheralService to
  #                 process. E.g. `sb0`, `bm0`...
  #
  # @data           the data to be sent to communicator's connection. Might be string or buffer
  #                 object.
  #
  # @byline         `false` indicates the `data` parameter is an Buffer object with binary data,
  #                 `true` indicates the `data` parameter is a String with text data.
  #
  at-pipe-data: (name, data, byline=yes) ->
    ### DEVELOPER[TODO]: please implement your codes here: `at-pipe-data`
    ...

  ##
  # Indicates the PIPE with TcpProxy bridge is established. After this callback,
  # the implementation of PeripheralService might receive data from PIPE, or
  # can send data to PIPE.
  #
  at-pipe-established: (name, metadata) ->
    return

  # Get the current timestamp with internal SystemUptime object when exists. If internal SystemUptime
  # object is null, the function also returns `null`.
  #
  # Timestamp object shall contain 3 fields: epoch, uptime, and boots
  #   - epoch , the epoch time on the local Linux system that produces the sensor data event
  #   - uptime, the system uptime of Linux system
  #   - boots , the number of booting up times for the Linux system.
  now: ->
    ### DEVELOPER: please don't change this code, just call this function.
    return @uptime.now! if @uptime?
    return null

  ##
  # Process a command request from web interface, either HTTP REST (POST)
  # or Websocket.
  #
  # HTTP REST (POST):
  #     When SensorWeb3 receives request from `/api/v3/ps/[service-name]/request/[command]`,
  #     the HTTP request are packed as arguments to this callback function. For example,
  #     when you use httpie tool to perform following request:
  #
  #       http http://127.0.0.1:6020/api/v3/ps/[service-name]/request/[command] \
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
  # Websocket:
  #     ...
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
    ### DEVELOPER[TODO]: please implement your codes here: `process-web-command`
    return done null, "please write your implementations here ..."


module.exports = exports = PeripheralService
global.add-bundled-module {PeripheralService}
