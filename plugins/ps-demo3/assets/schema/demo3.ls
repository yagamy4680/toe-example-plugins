/** Please Don't Modify These Lines Below   */
/** --------------------------------------- */
class SchemaBaseClass
  ->
    @annotations = {}
    @sensors = {}
    @actuators = {}

  declare-sensors: (types-and-identities) ->
    self = @
    for st, identities of types-and-identities
      self.sensors[st] = {}
      for id in identities
        self.sensors[st][id] = {}


SchemaBaseClass = SCHEMA_BASE_CLASS if SCHEMA_BASE_CLASS?
/** --------------------------------------- */
/** Please Don't Modify These Lines Above   */

MANIFEST =
  name: \demo3
  version: \0.0.1


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
    * field: \freeMemory, unit: \bytes  , value: [\int, [0, 4294967296]], $submodule: 'os', $method: 'freemem' # annotations for `nodejs_process/os/*/freeMemory`
    * field: \uptime    , unit: \seconds, value: [\int, [0, 4294967296]], $submodule: 'os', $method: 'uptime'  # annotations for `nodejs_process/os/*/uptime`

  ->
    super!
    ##
    # Declare the number of sensors and their count and types.
    #
    @.declare-sensors do
      cpu   : <[0]>
      memory: <[0]>
      os    : <[current]>
    
    @annotations =
      node-modules: <[os cpu memory]>

    #
    # Set annotation for the entire peripheral-type: NodejsProcess
    #
    @.set-annotations null, {node-modules: <[os cpu memory]>}

    #
    # Set annotations for all sensor instances with same sensor-type: `os`
    #
    @.set-annotations 'os', {type: 'composed'}

    #
    # Set annotations for all sensor instances with same sensor-type: `cpu`
    #
    @.set-annotations 'cpu', {type: 'single', submodule: 'process', method: 'cpuUsage'}

    #
    # Set annotations for all sensor instances with same sensor-type: `memory`
    #
    @.set-annotations 'memory' , {type: 'single', submodule: 'process', method: 'memoryUsage'}


##
# The root classes to be exported. Schema parser or SensorWeb shall read the list
# of root classes, and traverse all of their child classes recursively, and export
# root classes and all of their children.
#
# The root class must be derived from SchemaBaseClass class, so schema-compiler
# can recognize them.
#
# Please note, the variable name must be `roots` for schema-compiler to process.
#
roots = {
  NodejsProcess
}

/** Please Don't Modify These Lines Below   */
/** --------------------------------------- */
module.exports = roots