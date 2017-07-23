```javascript
var readRandom = require('read-random')
var assert = require('assert')

readRandom(32, function (error, buffer) {
  assert.ifError(error)
  assert.equal(buffer.length, 32)
})

readRandom({
  bytes: 512,
  device: '/dev/random'
}, function (error, buffer) {
  assert.equal(error.message, 'could not read enough bytes')
  assert.equal(error.requested, 512)
  assert(error.read < 512)
})
```
