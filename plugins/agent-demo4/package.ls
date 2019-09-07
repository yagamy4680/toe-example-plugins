#!/usr/bin/env lsc -cj
#

# Known issue:
#   when executing the `package.ls` directly, there is always error
#   "/usr/bin/env: lsc -cj: No such file or directory", that is because `env`
#   doesn't allow space.
#
#   More details are discussed on StackOverflow:
#     http://stackoverflow.com/questions/3306518/cannot-pass-an-argument-to-python-with-usr-bin-env-python
#
#   The alternative solution is to add `envns` script to /usr/bin directory
#   to solve the _no space_ issue.
#
#   Or, you can simply type `lsc -cj package.ls` to generate `package.json`
#   quickly.
#

# package.json
#
# package.json
#
name: \agent-demo4

author:
  name: 'Yagamy'
  email: 'yagamy@gmail.com'

description: 'A demo agent in ToeAgent plugin framework to listen sensor events from SensorWeb running inside Docker on x86 host environment'

version: \0.1.0

repository:
  type: \git
  url: ''

main: \lib/agent.js

engines:
  node: \12.x.x
  npm: \6.9.x

dependencies: {}

scripts:
  agent: """
  npm run build
  ES6=false ./run-sensorweb3-standalone
  """

devDependencies: {}

optionalDependencies: {}