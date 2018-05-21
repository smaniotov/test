const AWS = require('aws-sdk')
AWS.config.update({
  region: 'us-west-2'
})
const TableName = 'mx-postalcode'
const endpoint = new AWS.Endpoint('http://localhost:8000')
const dynamo = new AWS.DynamoDB({
  endpoint
})

const params = {
  TableName,
  Item: {
    'code': {
      S: '123231'
    },
    data: {
      S: 'Endereço'
    }
  }
}

dynamo.putItem(params, (err, success) => {
  if (err) console.log(err)
  console.log(success)
})