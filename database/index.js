const unzip = require('unzip-stream')
const es = require('event-stream')
const cheerio = require('cheerio')
const requestConfig = require('./request-config')
const request = require('request')
const db = require('./db.js')
const {dateParse, separator, normalizeAddress, getRequestFields, WebpageUtils} = require('./util')
const iconv = require('iconv-lite')

const startTime = Date.now()
const zipTable = process.env.ZIPTABLE
const historyTable = process.env.HISTORYTABLE

const index = async () => {
  try {
    const webpageUtils = new WebpageUtils()
    await webpageUtils.init()
    const updatedAt = webpageUtils.getLastUpdatedDate()
    const updatedAtDate = await db.get(historyTable, {updatedAt})

    if (Object.keys(updatedAtDate).length === 0) {
      const requestFields = webpageUtils.getRequestFields()
      console.info('New version: ' + updatedAt)
      await populateDynamoDB(requestFields)
      await db.put(historyTable, {updatedAt})
    } else {
      console.info('Database is already updated')
    }
  } catch (e) {
    console.error('Internal server error: ' + e)
  }
}

const putItem = async (line) => {
  try {
    line.data = JSON.stringify(line.data)
    Promise.resolve(await db.put(zipTable, line))
  } catch (err) {
    Promise.reject(err)
  }
}

const populateDynamoDB = async (requestFields) => new Promise((resolve, reject) => {
  request.post(requestConfig.postOptions(requestFields))
    .pipe(unzip.Parse())
    .on('error', reject)
    .on('entry', async (entry) => {
      let header
      let prevLine
      let isRow = false

      entry
        .pipe(iconv.decodeStream('latin1'))
        .pipe(es.split('\n'))
        .pipe(es.mapSync((line) => {
          if (line.includes(separator)) {
            if (isRow) {
              const normalizedData = normalizeAddress(prevLine, line, header)
              const pivotData = prevLine
              prevLine = normalizedData
              return pivotData && pivotData.code !== normalizedData.code
                ? pivotData
                : null
            }
            header = line.split(separator)
            isRow = true
          }
        }))
        .pipe(es.mapSync(async (line) => {
          if (line) {
            await putItem(line)
          }
        })).on('end', async () => {
          await putItem(prevLine)
        })
    }).on('end', async () => {
      console.info('Finished in ' + (Date.now() - startTime) / 1000 + ' seconds!')
      resolve('Done.')
    })
})

index()
