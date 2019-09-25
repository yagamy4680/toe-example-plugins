
## 0.2.2
### Added
- Inform sensor-web the peripheral object is out of manage when receiving `at-pipe-disconnected` event
- Skip sending data to pipe when the pipe is disconnected

## 0.2.1
### Added
- Support `at-pipe-disconnected` event

## 0.2.0
### Added
- Support actuator action to set process priority

## 0.1.0
### Added
- Add `peripheral-updated` event to DATA packet in tcp-daemon

### Changed
- Use metadata of DATA packet with `peripheral-updated` event to update peripheral object
- Keep pid for senor updates

## 0.0.3
### Changed
- improve documentation and verbose messages in the shortcut script for running SensorWeb

## 0.0.2
### Changed
- Change schema name from `demo2` to `demo4`

## 0.0.1
### Added
- Initial version (derived from 0.0.1 of `ps-demo2`)
