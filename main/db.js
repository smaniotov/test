const AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2', endpoint:'http://localhost:8000'})
const dynamo = new AWS.DynamoDB()

const Methods = {
  PUT: 'putItem',
  GET: 'getItem'
}

const fixModel = (TableName, params) => {
  return Object.keys(params).reduce((out, key) => {
    out.Item[key] = {'S': params[key]}
    return out
  }, {TableName, Item: {}})
}

const dynamoAction = (method) => (TableName, params) => new Promise((resolve, reject) => {
  dynamo[method](fixModel(TableName, params), (err, data) => {
    if(err) reject(err)
    resolve(data)
  })
})


exports.put = dynamoAction(Methods.PUT)
exports.get = dynamoAction(Methods.GET)