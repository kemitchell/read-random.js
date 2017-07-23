/*
SPDX-License-Identifier: MIT

Copyright (c) 2017 Kyle E. Mitchell

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var fs = require('fs')

var DEFAULT_DEVICE = '/dev/urandom'

module.exports = function readRandom (
  options, // Number > 0 OR {bytes: Number > 0[, device: String]}
  callback // function (error, buffer)
) {
  // Argument Parsing
  var bytesToRead
  var device
  if (typeof options === 'number') {
    bytesToRead = options
    device = DEFAULT_DEVICE
  } else {
    if (typeof options.bytes !== 'number') {
      throw new Error('invalid byte count')
    }
    bytesToRead = options.bytes
    device = options.device || DEFAULT_DEVICE
  }
  if (bytesToRead < 1) {
    throw new Error('invalid byte count: ' + bytesToRead)
  }
  // Open the device.
  fs.open(device, 'r', function (openError, fileDescriptor) {
    if (openError) {
      callback(openError)
    } else {
      // Read from the device.
      fs.read(
        fileDescriptor, Buffer.alloc(bytesToRead), 0, bytesToRead, 0,
        function (readError, bytesRead, buffer) {
          // Succeed or fail, close the file descriptor.
          if (readError) {
            fs.close(fileDescriptor, function (closeError) {
              // Call back with the read error, even if we receive a
              // close error.
              callback(readError)
            })
          // /dev/random and similar may fail by returning fewer bytes
          // than requested.
          } else if (bytesRead !== bytesToRead) {
            fs.close(fileDescriptor, function (closeError) {
              var bytesError = new Error('could not read enough bytes')
              bytesError.requested = bytesToRead
              bytesError.read = bytesRead
              callback(bytesError)
            })
          } else {
            fs.close(fileDescriptor, function (closeError) {
              if (closeError) {
                callback(closeError)
              } else {
                callback(null, buffer)
              }
            })
          }
        }
      )
    }
  })
}
