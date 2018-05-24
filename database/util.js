const request = require('request')
const requestConfig = require('./request-config')
const cheerio = require('cheerio')
const separator = '|'

const normalizeModel = (code, prevData, currentData) => {
  const keys = Object.keys(prevData.data).concat(Object.keys(currentData.data))
  const normalizedData = uniqueArray(keys).reduce((out, key) => {
    const currentValue = currentData.data[key]
    const prevValue = prevData.data[key]

    if (currentValue !== prevValue) {
      out[key] = uniqueArray([].concat(currentValue, prevValue))
    } else {
      out[key] = currentValue
    }
    return out
  }, {})

  return {
    code,
    data: normalizedData
  }
}

const uniqueArray = (array) => (
  array.filter((item, index) => {
    return array.indexOf(item) === index && item
  })
)

const monthList = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

const dateParse = (string) => {
  try {
    const month = monthList.findIndex(item => {
      const currentlyMonth = new RegExp(item, 'i')
      return string.search(currentlyMonth) !== -1
    })
    const [day] = string.match(/\d{2}/)
    const [year] = string.match(/\d{4}/)

    return new Date(year, month, day).toISOString()
  } catch (e) {
    console.error('Fatal Error: Not been able to parse last update date.')
    throw e
  }
}

class WebpageUtils {
  constructor() {
    this.$
  }

  init() {
    return new Promise((resolve, reject) => {
      request.get(requestConfig.options, (err, response, body) => {
        if (err) reject(err)
        this.$ = cheerio.load(body)
        resolve()
      })
    })
  }

  getLastUpdatedDate() {
    const lastUpdateSpan = this.$('#lblfec').text()
    return dateParse(lastUpdateSpan)
  }

  getFieldAttrList(attr) {
    const $ = this.$
    return $('input').map(function (index, element) {
      if ($(this).attr('name').includes('__')) {
        return $(this).attr(attr)
      }
    }).get()
  }

  getRequestFields() {
    const fieldValues = this.getFieldAttrList('value')

    return this.getFieldAttrList('name').reduce((out, item, index) => {
      out[item] = fieldValues[index]
      return out
    }, {})
  }
}

exports.WebpageUtils = WebpageUtils

exports.normalizeAddress = (prevData, currentLine, header) => {
  const labels = header.slice(1)
  const [code, ...addressElem] = currentLine.split(separator)
  const data = addressElem.reduce((out, item, index) => {
    const label = labels[index]
    out[label] = item
    return out
  }, {})
  const currentData = {
    code,
    data
  }

  if (!prevData || prevData.code !== code) {
    return currentData
  }

  return normalizeModel(code, prevData, currentData)
}

exports.separator = '|'