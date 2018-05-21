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

module.exports = (string) => {
  try {
    const month = monthList.findIndex(item => {
      const currentlyMonth = new RegExp(item, 'i')
      return string.search(currentlyMonth) !== -1
    })
    const [day] = string.match(/\d{2}/)
    const [year] = string.match(/\d{4}/)
    
    return new Date(year, month, day)
  } catch (e) {
    console.log('Error in date detect')
    throw e
  }
}