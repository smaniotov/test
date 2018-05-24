const AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2', endpoint: 'http://localhost:8000'})
const dynamo = new AWS.DynamoDB()

const TableName = process.env.ZIPTABLE || 'mx-postalcode'

exports.get = (code) => {
  const params = {
    TableName,
    Key: {
      code: {S: code}
    }
  }

  return new Promise((resolve, reject) => {
    dynamo.getItem(params, (err, data) => {
      if (err) reject(err)
      try {
        resolve(JSON.parse(data.Item.data.S))
      } catch (e) {
        resolve(data)
      }
    })
  })
}
