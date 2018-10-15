## demo1

This app demonstrates how to implement [PeripheralService](../../docs/peripheral-service.ls) with regular sensor data updates with CPU usage of current nodejs process. This implementation shall:

- notify SensorWeb3 a sensor update event every 2 seconds, with `cpuUsage` data, under these tags
  - peripheral-type: `demo1`
  - peripheral-id: `process.pid`
  - sensor-type: `cpu`
  - sensor-id: `0`
- cpu usage data contains these fields
  - `user`
  - `system`
- notify SensorWeb3 about the peripheral managing state.

Here are sample data when the plugin is running inside SensorWeb3:

```text
$  telnet localhost 6021
Trying ::1...
telnet: connect to address ::1: Connection refused
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
2018-10-08T17:34:31.520Z	ps-sensor-updated	boot1://15751ms	demo1/9876/cpu/0	user=92614	system=24132
2018-10-08T17:34:33.521Z	ps-sensor-updated	boot1://17752ms	demo1/9876/cpu/0	user=135723	system=33937
2018-10-08T17:34:35.523Z	ps-sensor-updated	boot1://19754ms	demo1/9876/cpu/0	user=162397	system=39476
2018-10-08T17:34:37.524Z	ps-sensor-updated	boot1://21756ms	demo1/9876/cpu/0	user=163802	system=39952
2018-10-08T17:34:39.529Z	ps-sensor-updated	boot1://23760ms	demo1/9876/cpu/0	user=164258	system=40097
2018-10-08T17:34:41.533Z	ps-sensor-updated	boot1://25764ms	demo1/9876/cpu/0	user=164746	system=40192
2018-10-08T17:34:43.536Z	ps-sensor-updated	boot1://27767ms	demo1/9876/cpu/0	user=165968	system=40460
```

