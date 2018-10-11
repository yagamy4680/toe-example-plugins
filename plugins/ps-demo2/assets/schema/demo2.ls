/** Please Don't Modify These Lines Below   */
/** --------------------------------------- */
class SchemaBaseClass
  ->
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
  name: \demo2
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

  ->
    super!
    ##
    # Declare the number of sensors and their count and types.
    #
    @.declare-sensors do
      cpu   : <[0]>
      memory: <[0]>

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