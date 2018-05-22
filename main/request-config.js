const request = require('request')

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

const postOptions = (fields) => ({
  ...options,
  formData: {
    'rblTipo': 'txt',
    'cboEdo': '00',
    'btnDescarga.x': 73,
    'btnDescarga.y': 14,
    ...fields
  }
})

exports.options = options
exports.postOptions = postOptions