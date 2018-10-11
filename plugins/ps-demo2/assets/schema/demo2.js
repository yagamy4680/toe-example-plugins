(function(){
  // Generated by LiveScript 1.6.0
  /** Please Don't Modify These Lines Below   */
  /** --------------------------------------- */
  var SchemaBaseClass, MANIFEST, NodejsProcess, roots;
  SchemaBaseClass = (function(){
    SchemaBaseClass.displayName = 'SchemaBaseClass';
    var prototype = SchemaBaseClass.prototype, constructor = SchemaBaseClass;
    function SchemaBaseClass(){
      this.sensors = {};
      this.actuators = {};
    }
    SchemaBaseClass.prototype.declareSensors = function(typesAndIdentities){
      var self, st, identities, lresult$, i$, len$, id, results$ = [];
      self = this;
      for (st in typesAndIdentities) {
        identities = typesAndIdentities[st];
        lresult$ = [];
        self.sensors[st] = {};
        for (i$ = 0, len$ = identities.length; i$ < len$; ++i$) {
          id = identities[i$];
          lresult$.push(self.sensors[st][id] = {});
        }
        results$.push(lresult$);
      }
      return results$;
    };
    return SchemaBaseClass;
  }());
  if (typeof SCHEMA_BASE_CLASS != 'undefined' && SCHEMA_BASE_CLASS !== null) {
    SchemaBaseClass = SCHEMA_BASE_CLASS;
  }
  /** --------------------------------------- */
  /** Please Don't Modify These Lines Above   */
  MANIFEST = {
    name: 'demo2',
    version: '0.0.1'
  };
  NodejsProcess = (function(superclass){
    var prototype = extend$((import$(NodejsProcess, superclass).displayName = 'NodejsProcess', NodejsProcess), superclass).prototype, constructor = NodejsProcess;
    NodejsProcess.prototype.cpu = [
      {
        field: 'user',
        unit: 'bytes',
        value: ['int', [0, 4294967296]]
      }, {
        field: 'system',
        unit: 'bytes',
        value: ['int', [0, 4294967296]]
      }
    ];
    NodejsProcess.prototype.memory = [
      {
        field: 'rss',
        unit: 'bytes',
        value: ['int', [0, 4294967296]]
      }, {
        field: 'heapTotal',
        unit: 'bytes',
        value: ['int', [0, 4294967296]]
      }, {
        field: 'heapUsed',
        unit: 'bytes',
        value: ['int', [0, 4294967296]]
      }, {
        field: 'external',
        unit: 'bytes',
        value: ['int', [0, 4294967296]]
      }
    ];
    function NodejsProcess(){
      NodejsProcess.superclass.call(this);
      this.declareSensors({
        cpu: ['0'],
        memory: ['0']
      });
    }
    return NodejsProcess;
  }(SchemaBaseClass));
  roots = {
    NodejsProcess: NodejsProcess
  };
  /** Please Don't Modify These Lines Below   */
  /** --------------------------------------- */
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  var classes = {MANIFEST: MANIFEST, NodejsProcess: NodejsProcess};
  module.exports = {roots: roots, classes: classes, manifest: MANIFEST};
}).call(this);