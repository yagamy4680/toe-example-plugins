/** Please Don't Modify These Lines Below   */
/** --------------------------------------- */
class SchemaBaseClass
  ->
    @sensor_identities = {}
    @sensor_actuator_actions = {}
    @annotation_stores = {}

  ##
  # `s_type`, the sensor type
  # `identities`, the list of possible s_id for the specific sensor type
  #
  declareSensorIdentities: (s_type, identities) ->
    @sensor_identities[s_type] = identities
    return @

  ##
  # `s_type`, the sensor type
  # `actions`, the list of actuator actions for the specific sensor type,
  #             that cannot be a simple writeable sensor field.
  #
  declareSensorActuatorActions: (s_type, actions) ->
    @sensor_actuator_actions[s_type] = actions
    return @

  ##
  # `p`, the data-path for annotations in the store; `null` means the annotations for the peripheral-type.
  # `a`, the annotations.
  #
  declareAnnotations: (p, annotations) ->
    p = '/' unless p?
    p = "/#{p}" unless p.startsWith '/'
    @annotation_stores[p] = annotations
    return @


SchemaBaseClass = SCHEMA_BASE_CLASS if SCHEMA_BASE_CLASS?
/** --------------------------------------- */
/** Please Don't Modify These Lines Above   */

MANIFEST =
  name: \demo4
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
    * field: \freeMemory, unit: \bytes  , value: [\int, [0, 4294967296]]
    * field: \uptime    , unit: \seconds, value: [\int, [0, 4294967296]]
    * field: \priority  , unit: '', writeable: yes, value: [\enum, <[low below_normal normal above_normal high highest]>]

  ->
    super!
    @
      ##
      # Declare the instances (with unique identities) of each sensor type
      #
      .declareSensorIdentities \cpu     , <[0]>
      .declareSensorIdentities \memory  , <[0]>
      .declareSensorIdentities \os      , <[current]>


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
