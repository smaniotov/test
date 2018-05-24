const database = require('./db.js')
const http = require('http')
const express = require('express')
const app = express()
const port = 3000
const db = require('./db.js')

app.get('/zipcode/:code', async (req, res) => {
  try {
    console.log('New request from \'' + req.params.code + '\' zipcode!' )
    console.log('Fetching zipcode')
    
    const data = await handler(req.params.code)
    res.send(JSON.stringify(data))
    
    console.log('Zipcode successfuly sended')
  } catch (err) {
    console.log('Found an error: ' + err.message)
    res.send(err.message)
  }
})

app.listen(port)

console.log('Server running in port: ' + port)

const validate = (zipcode) => /^\d{5}$/.test(zipcode)

const handler = (zipcode) => new Promise(async(resolve, reject) => {
  try {
    if (validate(zipcode)) {
      const result = await db.get(zipcode)
      resolve(result)
    } else {
      throw new Error('Invalid zipcode format')
    }
  } catch (err) {
    reject(err)
  }
})
