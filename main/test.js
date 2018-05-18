const unzip = require('unzip')
const fs = require('fs')
const readline = require('readline')
const es = require("event-stream")
const request = require('request')
const cheerio = require('cheerio')
const {
  Writable
} = require('stream')
const iconv = require('iconv-lite')

const archivePath = './archive.html'

const options = {
  url: 'http://www.correosdemexico.gob.mx/lservicios/servicios/CodigoPostal_Exportar.aspx',
  headers: {
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': 1,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.9,pt;q=0.8',
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
  constructor(options) {
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
  const writable = new WritableBuffer().setDefaultEncoding('utf8')

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
        if (fileName === entry.path) {
          entry
          .pipe(es.split('\n'))
          .pipe(es.mapSync((line) => {
          }))
        }
      })
  } catch (e) {
    console.error(e)
    console.error('Main Error')
  }
}

index()