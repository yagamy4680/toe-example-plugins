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
name: \ps-demo1

author:
  name: ['Yagamy']
  email: 'yagamy@gmail.com'

description: 'A demo for peripheral-service in SensorWeb3 plugin framework'

version: \0.1.0

repository:
  type: \git
  url: ''

main: \lib/index.js

engines:
  node: \0.10.x
  npm: \1.4.x

dependencies:
  async: \*

scripts:
  build: """
  rm -vf lib/*.js
  echo "clean up lib directory ..."
  find ./lib -name '*.js' | xargs -I{} sh -c "rm -vf {}"
  echo "prepare index.js"
  cp -v ./resources/wrapper.js ./lib/index.js
  echo "producing lib/bundle.js (browserify on ./src/*.js)"
  ./node_modules/browserify/bin/cmd.js \\
      --node \\
      --standalone Service \\
      --outfile lib/bundle.js \\
      ./src/index.js
  echo "producing lib/bundle.pretty.js (browserify on ./src/*.js)"
  ./node_modules/uglify-es/bin/uglifyjs \\
      --beautify \\
      --timings \\
      --verbose \\
      --ecma 6 \\
      -o ./lib/bundle.pretty.js \\
      ./lib/bundle.js
  echo "producing lib/bundle.min.js (browserify on ./src/*.js)"
  ./node_modules/uglify-es/bin/uglifyjs \\
      --compress \\
      --mangle \\
      --timings \\
      --verbose \\
      --ecma 6 \\
      -o ./lib/bundle.min.js \\
      ./lib/bundle.js
  ls -alh lib/bundle*
  """
  deploy: """
  ES6=false ./run-sensorweb3-standalone
  """
  src: """
  ES6=true ./run-sensorweb3-standalone
  """

devDependencies:
  \browserify-livescript : \^0.2.3
  \uglify-es : \^3.3.9
  \browserify : \^16.2.2

optionalDependencies: {}
