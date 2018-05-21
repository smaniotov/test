const AWS = require('aws-sdk')
const unzip = require('unzip-stream')
const es = require('event-stream')
const request = require('request')
const cheerio = require('cheerio')
const dateParse = require('./date-parse')
const {
  StringDecoder
} = require('string_decoder');
const iconv = require("iconv-lite")
const {
  Writable
} = require('stream')
AWS.config.update({
  region: 'us-west-2'
})
const endpoint = new AWS.Endpoint('http://localhost:8000')
const dynamo = new AWS.DynamoDB({
  endpoint
})
const startTime = Date.now()

const TableName = process.env.TABLENAME || 'mx-postalcode'

const options = {
  url: 'http://www.correosdemexico.gob.mx/lservicios/servicios/CodigoPostal_Exportar.aspx',
  headers: {
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': 1,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0[.9,pt;q=0.8'
  }
}

const postOptions = {
  ...options,
  formData: {
    'rblTipo': 'txt',
    'cboEdo': '00',
    'btnDescarga.x': 73,
    'btnDescarga.y': 14
  }
}

class WritableBuffer extends Writable {
  constructor(options, isLatin) {
    function write(chunk, enc, callback) {
      this.chunks.push(chunk)
      callback()
    }

    super({ ...options,
      write
    })
    this.chunks = []
  }
}

const getWebPage = () => {
  const writable = new WritableBuffer()

  return new Promise((resolve, reject) => {
    request(options)
      .on('end', () => {
        resolve(Buffer.concat(writable.chunks).toString('utf8'))
      })
      .on('error', (error) => {
        console.error('Not been able to request mexico government website')
        reject(error)
      })
      .pipe(writable)
  })
}

const getRequestFields = (webpage) => {
  const $ = cheerio.load(webpage)
  const lastUpdateSpan = $('#lblfec').text()
  const lastUpdate = dateParse(lastUpdateSpan)
  
  console.log('Last updated: ' + lastUpdate.toISOString())

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

const fillDynamo = (data, header) => {
  const labels = header.slice(1)
  const [primaryValue, ...addressElem] = data.split('|')
  const address = addressElem.reduce((out, item, index) => {
    const label = labels[index]
    out[label] = item
    return out
  }, {})

  const params = {
    TableName,
    Item: {
      'code': {
        S: primaryValue
      },
      data: {
        S: JSON.stringify(address)
      }
    }
  }

  return new Promise((resolve, reject) => {
    dynamo.putItem(params, (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

const index = async () => {
  try {
    const webpage = await getWebPage()
    const requestFields = getRequestFields(webpage)

    const downloadOptions = {
      ...postOptions,
      formData: {
        ...postOptions.formData,
        ...requestFields
      }
    }

    request.post(downloadOptions)
      .pipe(unzip.Parse())
      .on('entry', function (entry) {
        const fileName = entry.path
        let header
        let isRow = false
        if (fileName === entry.path) {
          entry
            .pipe(iconv.decodeStream('latin1'))
            .pipe(es.split('\n'))
            .pipe(es.mapSync(async (line) => {
              if (line.includes('|')) {
                if (isRow) {
                  try {
                    return await fillDynamo(line, header)
                  } catch (e) {
                    throw e
                  }
                }
                header = line.split('|').map(label => label.replace(' ', '_').toLowerCase())
                isRow = true
              }
            }))
        }
      }).on('end', () => {
        console.log("Terminou em " + (Date.now() - startTime) / 1000 + " segundos!")
      })
  } catch (e) {
    console.error(e)
    console.error('Main Error')
  }
}

index()