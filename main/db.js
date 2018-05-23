const AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2', endpoint: 'http://localhost:8000'})
const dynamo = new AWS.DynamoDB()

const Methods = {
  PUT: 'putItem',
  GET: 'getItem'
}

const KeyNames = {
  Key: 'Key',
  Item: 'Item'
}

const normalizeModel = (TableName, initial, params) => {
  return Object.keys(params).reduce((out, key) => {
    out[initial][key] = {'S': params[key]}
    return out
  }, {[initial]: {}, TableName})
}

const dynamoAction = (method, keyName) => (TableName, params) => new Promise((resolve, reject) => {
  dynamo[method](normalizeModel(TableName, keyName, params), (err, data) => {
    if (err) reject(err)
    resolve(data)
  })
})

exports.put = dynamoAction(Methods.PUT, KeyNames.Item)
exports.get = dynamoAction(Methods.GET, KeyNames.Key)
