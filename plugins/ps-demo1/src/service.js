var os = require('os');

/**
 * Get logger apis in SensorWeb3
 */
var { DBG, ERR, WARN, INFO } = global.getLogger(__filename);

/**
 * Get the PeripheralService class declaration from SensorWeb3
 */
var { PeripheralService, express, bodyParser } = global.getBundledModules();

/**
 * Get the declaration of constants.
 */
const { RELATIONSHIP_NONE, RELATIONSHIP_CONFIGURED, RELATIONSHIP_MANAGED } = PeripheralService.relationships;


const PERIPHERAL_TYPE = 'nodejs_process';


class Demo1 extends PeripheralService {

    constructor(opts, uptime, pmodule) {
        super(opts, uptime, pmodule);
        this.name = 'ps-demo1';
        this.types = [PERIPHERAL_TYPE];
        this.pid = process.pid.toString();
    }

    updatePeripheralState() {
        var metadata = {
            'ppid': process.ppid,
            'versions': process.versions,
            'os_uptime': os.uptime(),
            'os_platform': os.platform()
        };
        this.emitPeripheralState(PERIPHERAL_TYPE, this.pid, RELATIONSHIP_MANAGED, metadata);
    }

    updateCpuUsage() {
        /**
         * The cpuUsage() shall output an object:
         *
         *  { user: 76553, system: 26834 }
         */
        var usage = process.cpuUsage(this.startUsage);
        this.emitData(PERIPHERAL_TYPE, this.pid, 'cpu', '0', usage);
    }

    updateMemoryUsage() {
        /**
         * The memoryUsage() shall output an object:
         * 
         *  { rss: 32477184, heapTotal: 18169856, heapUsed: 8554328, external: 36657 }
         */
        var usage = process.memoryUsage();
        this.emitData(PERIPHERAL_TYPE, this.pid, 'memory', '0', usage);
    }

    /**
     * Initialize the peripheral-service instance.
     *
     * @param {function} done the callback function to indicate the initialization of this
     *                        peripheral-service is done.
     */
    init(done) {
        /*
         * All resources related to this peripheral-service shall be initialized here. For
         * example, the peripheral-service serves all BluetoothLE heartbeat rate sensors, then
         * the init() shall be responsible for initializing the Bluetooth LE protocol stack
         * on Linux (or establish connection with another process which is a dedicated Bluetooth
         * daemon).
         * 
         * Please don't perform sensor data or peripheral state updates within this function. 
         * Please perform sensor data updates and peripheral state updates after `atRegistered()` is 
         * called.
         */
        return done();
    }

    /**
     * Finalize the peripheral-service before SensorWeb3 fully shutdown.
     */
    fini(done) {
        var {peripheralTimer, cpuTimer, memoryTimer} = this;
        if (peripheralTimer) {
            INFO("stop peripheral timer");
            clearInterval(peripheralTimer);
        }
        if (cpuTimer) {
            INFO("stop cpu timer");
            clearInterval(cpuTimer);
        }
        if (memoryTimer) {
            INFO("stop memory timer");
            clearInterval(memoryTimer);
        }
        return done();
    }

    /**
     * After registration is successfully done, then start the service.
     */
    atRegistered() {
        INFO("the peripheral service is registered ...");
        this.startUsage = process.cpuUsage();
        var self = this;

        /**
         * Update peripheral1 every 60 seconds. Please note, typically the peripheral
         * state update is not so frequent. Here we just show how to update peripheral
         * state with metadata to SensorWeb3, so ToeAgent or other apps can process
         * the state with metadata.
         */
        this.updatePeripheralState();
        this.peripheralTimer = setInterval(() => {
            self.updatePeripheralState();
        }, 60000);

        /* Keep updating cpu usages as sensor data, every 2 seconds. */
        this.updateCpuUsage();
        this.cpuTimer = setInterval(() => {
            self.updateCpuUsage();
        }, 2000);

        /* Keep updating memory usages as sensor data, every 10 seconds. */
        this.updateMemoryUsage();
        this.memoryTimer = setInterval(() => {
            self.updateCpuUsage();
        }, 10000);
    }

    /**
     * Request to perform an action with the actuator on the peripheral (board or machine)
     * associated with the host/node running SensorWeb.
     *
     * @param {*} p_type    the type of peripheral (board or machine) associated with the host/node that
     *                      runs SensorWeb, e.g. sensorboard, mainboard, echonetlite, hvac,
     *                      and so on... The associate is either wired (e.g. UART, RS485,
     *                      I2C, ...) or wireless (Bluetooth LE, 802.11a/b/g, LoRa, or ZigBee).
     *
     * @param {*} p_id      the unique id of the board (or machine) associated with the host/node.
     *                      Sometimes, one host/node might associate more than one board with same
     *                      type, e.g. A home gateway is associated with 3 BLE coffee machines
     *                      in a coffee shop, and use the BLE mac address of each coffee machine
     *                      as its unique identity.
     *
     * @param {*} a_type    the type of actuator on the board (or machine) associated with the host/node,
     *                      such as fan, pump, led, led-matrix, and so on.
     *
     * @param {*} a_id      the unique id of actuator on the same board (or same machine), because one
     *                      board (or machine) might have more than one actuator with same type. For
     *                      example, an A/C might might have 2 FANs with different identity: 0000 and
     *                      0001.
     *
     * @param {*} action    the supported action of the actuator. Typically, the action `set` is the
     *                      most frequently supported. In some special types of actuators, there are
     *                      more supported actions. Taking led-matrix as example, here are the supported
     *                      actions:
     *                        - `show_number`     , to display 00 ~ 99 number on led matrix.
     *                        - `show_ascii`      , to display one visible ascii character on led matrix.
     *                        - `show_animation`  , to play built-in animation on led matrix.
     *
     * @param {*} arg1      the 1st argument value for the action to be performed.
     *
     * @param {*} arg2      the 2nd argument value for the action to be performed.
     *
     * @param {*} arg3      the 3rd argument value for the action to be performed.
     *
     * @param {*} done      the callback function to indicate the request is successful or not.
     *                      when failure, the 1st argument `err` shall be the error object.
     */
    performAction(p_type, p_id, a_type, a_id, action, arg1, arg2, arg3, done) {
        /**
         * If you run the plugin with SensorWeb3 locally, you can perform http post request to
         * perform actuator action as below:
         *
         *    http http://localhost:6020/api/v3/a/demo1/9876/cpu/0/set_clock arg1:=10
         *    http http://localhost:6020/api/v3/a/demo1/9876/xxx/555/set arg1:=45
         *
         * If you run the plugin with Conscious box (remotely), you can perform actuator request
         * as below (assuming the Conscious box uses the ip 10.90.0.108, and its id is C99900002)
         *
         *    http http://10.90.0.108:6020/api/v3/a/demo1/9876/cpu/0/set_clock arg1:=10
         *    http -a morioka:ub8gGj98SYeqT36U https://wstty.cestec.jp/api/v1/toe/C99900002/sensor-web/v3/a/demo1/9876/cpu/0/set_clock arg1:=10
         *
         * The 2nd example demonstrates how to use RDC (remote device control) feature in TIC to
         * perform http request to SensorWeb3 running on any Conscious box.
         */
        console.log(`got actuator-request: ${p_type}/${p_id}/${a_type}/${a_id}/${action} => ${arg1}, ${arg2}, ${arg3}`);
        return done();
    }

}

module.exports = exports = Demo1;