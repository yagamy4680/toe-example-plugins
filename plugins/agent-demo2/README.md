# demo2

The app demonstrates how to implement [Agent](../../docs/agent.ls) to support `hello-world` and `show-emoji-number` web commands:

- Receive command request `hello-world` from ToeAgent's REST API, and print `parameters` and `context` on the console.
- Receive command request `show-emoji-number` from ToeAgent's REST API, and forward it to `Jarvis::perform-actuator-action` to change emoji number.


## Execution with Remote Box

### Prerequisites

First, you need to find a box installed with TOE 3.0+ software.

Second, please add your SSH public key to the **root** user on that box, or create your own user account on that box with your public key installed. This step is quite important because the launch script [run-toeagent-with-remote-box](run-toeagent-with-remote-box) heavily depends on SSH to retrieve necessary information from that box, and setup a similar environment on your PC workstation.

Third, please install following softwares on your Mac OS X or Ubuntu/Linux workstation:

- [Docker](https://docs.docker.com/install/)
- [jq](https://stedolan.github.io/jq/)
- [js-yaml](http://nodeca.github.io/js-yaml/) (e.g. `npm install -g js-yaml`)

Forth, shutdown ToeAgent process running on that box, with following command. The existing ToeAgent process might be conflicted with this agent that tries to control the box remotely.

  ```
echo shutdown | socat - unix-connect:/var/run/yapps/toe-agent.sock
  ```

### Run

Please execute the launch script `run-toeagent-with-remote-box` with the ip address of remote box as 1st argument. For example:

```text
$  ./run-toeagent-with-remote-box 10.42.0.89
SCRIPT_CURRENT_NAME = run-toeagent-with-remote-box
SCRIPT_BASE_NAME = run-toeagent
SCRIPT_SUBCOMMAND = with-remote-box
FUNC = run_with_remote_box
10.42.0.89 is alive
10.42.0.89 port 22 is ready
10.42.0.89 with user root to login SSH service
scp root@10.42.0.89:/tmp/cloud.bashrc /tmp/viXMfV
10.42.0.89:/tmp/cloud.bashrc is downloaded =>
  CLOUD_ARCHIVE_URL=https://archives.t2t.io
  CLOUD_FILE_FC=https://fc.t2t.io
  CLOUD_FILE_PSWD=****
  CLOUD_FILE_SITE=files.t2t.io
  CLOUD_FILE_USER=device
  CLOUD_RELEASE_PASS=****
  CLOUD_RELEASE_URL=https://releases.t2t.io
  CLOUD_RELEASE_USER=agent
10.42.0.89:/tmp/ttt_system is downloaded =>
```

In the beginning, the launch script checks remote box, and tries to use SSH with **root** user to login that box.

```
10.42.0.89/profile => conscious
10.42.0.89/mnt => /mnt/app/profiles/conscious
10.42.0.89/env => production
10.42.0.89/entry => 20190204d
10.42.0.89/toe-agent => 0.9.5
10.42.0.89/toe-agent/config/production.json =>

...

launch script:

#!/bin/bash
#
docker run \
  -it \
  --init \
  --rm \
  --name toe-agent-test-0215-030504 \
  -p 6040:6040  \
  -v /tmp/toe-agent.conf.json:/yapps/config/default.json \
  -v /Users/yagamy/Works/workspaces/t2t/yapps-tt/externals/third_parties/toe-example-plugins/plugins/agent-demo2:/opt/plugins/agent-demo2 \
  -e CLOUD_ARCHIVE_URL="https://archives.t2t.io" \
  -e CLOUD_FILE_FC="https://fc.t2t.io" \
  -e CLOUD_FILE_PSWD="****" \
  -e CLOUD_FILE_SITE="files.t2t.io" \
  -e CLOUD_FILE_USER="device" \
  -e CLOUD_RELEASE_PASS="****" \
  -e CLOUD_RELEASE_URL="https://releases.t2t.io" \
  -e CLOUD_RELEASE_USER="agent"  \
  -e YAPPS_DUMP_LOADED_CONFIG=false \
  -e YAPPS_EXTRA_AGENTS=/opt/plugins/agent-demo2 \
   \
   \
  tictactoe/yapps.toe-agent:0.9.5 \
    node \
      --expose-gc \
      index.js \
         \
        -b 'tic-client.uploaders.dg-ts.enabled=false' \
        -b 'tic-client.uploaders.dg-ss.enabled=false' \
        -b 'tic-client.uploaders.dm-po.enabled=false' \
        -s system-info.remote=10.42.0.89 \
        -s communicator.connections.ps_s_data.url=tcp://10.42.0.89:6022 \
        -s communicator.connections.ps_p_data.url=tcp://10.42.0.89:6023 \
        -s sensorweb3-client.wss.server=http://10.42.0.89:6020 \
        -s sensorweb3-client.wss.token=ABCD

```


### Tests

This agent supports 2 apis:

```text
POST :6040/api/v3/c/Demo2/hello-world
POST :6040/api/v3/c/Demo2/show-emoji-number value:=[number]
```

First api responses a JSON body with `timestamp`, `parameters`, and `context`. For example:

```text
$ http -v :6040/api/v3/c/Demo2/hello-world aa:=true bb=okay cc==10 dd==zz

POST /api/v3/c/Demo2/hello-world?cc=10&dd=zz HTTP/1.1
Accept: application/json, */*
Accept-Encoding: gzip, deflate
Connection: keep-alive
Content-Length: 26
Content-Type: application/json
Host: localhost:6040
User-Agent: HTTPie/0.9.9

{
    "aa": true,
    "bb": "okay"
}

HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 203
Content-Type: application/json; charset=utf-8
Date: Fri, 15 Feb 2019 06:43:26 GMT
ETag: W/"cb-jvengx+IRJmLTGAX8i16Wg"
X-Powered-By: Express

{
    "code": 0,
    "data": {
        "context": {
            "aa": true,
            "bb": "okay"
        },
        "parameters": {
            "cc": "10",
            "dd": "zz"
        },
        "timestamp": "2019-02-15T06:43:26.813Z"
    },
    "error": null,
    "message": null,
    "url": "/api/v3/c/Demo2/hello-world?cc=10&dd=zz"
}
```


Second api is used to show a number between 0 and 99 on the Emoji display. For example:

```text
$  http -v :6040/api/v3/c/Demo2/show-emoji-number value:=45

POST /api/v3/c/Demo2/show-emoji-number HTTP/1.1
Accept: application/json, */*
Accept-Encoding: gzip, deflate
Connection: keep-alive
Content-Length: 13
Content-Type: application/json
Host: localhost:6040
User-Agent: HTTPie/0.9.9

{
    "value": 45
}

HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 90
Content-Type: application/json; charset=utf-8
Date: Fri, 15 Feb 2019 06:58:09 GMT
ETag: W/"5a-k21Hk4vEZbhmMp4+JnV6yw"
X-Powered-By: Express

{
    "code": 0,
    "data": {},
    "error": null,
    "message": null,
    "url": "/api/v3/c/Demo2/show-emoji-number"
}
```