const iconv = require('iconv-lite')
const fs = require('fs')
const readLine = require('readline')

const readStream = readLine.createInterface({
  input: fs.createReadStream(process.argv[2])
})

readStream.on('line', (line) => {
  console.log(iconv.decode(line, 'latin1'))
})