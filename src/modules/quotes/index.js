const {
  extraerMedicamentos,
  generarExcelMedicamentos,
  parseMedicamentos,
  getPdfPageCount
} = require('./extractor.service')
const { compararPrecios, getProviders, isComparisonConfigured, PROVIDERS } = require('./comparison.service')

module.exports = {
  // Extractor
  extraerMedicamentos,
  generarExcelMedicamentos,
  parseMedicamentos,
  getPdfPageCount,
  // Comparison
  compararPrecios,
  getProviders,
  isComparisonConfigured,
  PROVIDERS
}
