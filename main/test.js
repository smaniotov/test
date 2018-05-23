const unzip = require('unzip-stream')
const es = require('event-stream')
const cheerio = require('cheerio')
const requestConfig = require('./request-config')
const request = require('request')
const db = require('./db.js')
const dateParse = require('./date-parse')
const iconv = require('iconv-lite')
const util = require('util');
const startTime = Date.now()

//  Table names

const zipTable = process.env.ZIPTABLE || 'mx-postalcode'
const historyTable = process.env.HISTORYTABLE || 'mx-zip-lastupdate'

//  Code

const index = async () => {
  try {
    const webpage = await getWebPage()
    const $ = cheerio.load(webpage)
    const lastUpdateSpan = $('#lblfec').text()
    const updatedAt = dateParse(lastUpdateSpan)
    
    try {
      const isUpdated = await db.get(historyTable, {updatedAt})
      console.log(isUpdated)
      if (Object.keys(isUpdated).length === 0) throw new Error('Code out of date')
      console.log('Database is already updated')
    } catch (e) {
      console.log(e)
      console.log('Last updated: ' + updatedAt)

      const requestFields = getRequestFields($, webpage)
      await fillDatabase(requestFields)
      db.put(historyTable, {updatedAt})
    }
  } catch (e) {
    console.error(e)
  }
}

const fillDatabase = (requestFields) => {
  request.post(requestConfig.postOptions(requestFields))
      .pipe(unzip.Parse())
      .on('error', (err) => {
        throw err
      })
      .on('entry', (entry) => {
        let header
        let isRow = false
        entry
          .pipe(iconv.decodeStream('latin1'))
          .pipe(es.split('\n'))
          .pipe(es.mapSync(async (line) => {
            const ps = es.pause()
            console.log(util.inspect(process.memoryUsage()))
            if (line.includes('|')) {
              if (isRow) {
                try {
                  await fillDynamo(line, header)
                  ps.resume()
                  return {}
                } catch (e) {
                  throw e
                }
              }
              header = line.split('|').map(label => label.replace(' ', '_').toLowerCase())
              isRow = true
              ps.resume()
            }
          }))
      }).on('end', () => {
        console.log("Finished in " + (Date.now() - startTime) / 1000 + " segundos!")
        db.put({})
      })
}

const getWebPage = () => new Promise((resolve, reject) => {
  request.get(requestConfig.options, (err, response, body) => {
    if (err) reject(err)
    resolve(body)
  })
})

const getRequestFields = ($, webpage) => {
  function getFieldAttrList(attr) {
    return $('input').map(function (index, element) {
      if ($(this).attr('name').includes('__')) {
        return $(this).attr(attr)
      }
    }).get()
  }
  const fieldValues = getFieldAttrList('value')

  return getFieldAttrList('name').reduce((out, item, index) => {
    out[item] = fieldValues[index]
    return out
  }, {})
}

const fillDynamo = (line, header) => {
  const labels = header.slice(1)
  const [code, ...addressElem] = line.split('|')
  const data = addressElem.reduce((out, item, index) => {
    const label = labels[index]
    out[label] = item
    return out
  }, {})

  return db.put(zipTable, {code, data: JSON.stringify(data)})
}

index()