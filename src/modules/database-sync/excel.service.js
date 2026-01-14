const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

/**
 * Reads Excel file and returns data as JSON array
 * @param {Buffer|string} input - File buffer or file path
 * @returns {Array<Object>} - Array of row objects
 */
const readExcel = (input) => {
  let workbook

  if (Buffer.isBuffer(input)) {
    workbook = XLSX.read(input)
  } else if (typeof input === 'string' && fs.existsSync(input)) {
    workbook = XLSX.readFile(input)
  } else {
    throw new Error('Invalid input: must be Buffer or valid file path')
  }

  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)

  return data
}

/**
 * Validates Excel data has required columns
 * @param {Array<Object>} data - Excel data
 * @param {Array<string>} requiredColumns - Required column names
 * @returns {{valid: boolean, missing: Array<string>}}
 */
const validateColumns = (data, requiredColumns) => {
  if (!data || data.length === 0) {
    return { valid: false, missing: requiredColumns }
  }

  const columns = Object.keys(data[0])
  const missing = requiredColumns.filter(col => !columns.includes(col))

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Downloads file from URL to temp directory
 * @param {string} url - File URL
 * @param {string} filename - Filename to save
 * @returns {Promise<string>} - Path to downloaded file
 */
const downloadFile = async (url, filename) => {
  const https = require('https')
  const http = require('http')
  const tempDir = path.join(process.cwd(), 'temp')

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const filePath = path.join(tempDir, filename)
  const protocol = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath)
    protocol.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(filePath)
      })
    }).on('error', (err) => {
      fs.unlink(filePath, () => {})
      reject(err)
    })
  })
}

/**
 * Cleans up temp file
 * @param {string} filePath - Path to file
 */
const cleanupFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

module.exports = {
  readExcel,
  validateColumns,
  downloadFile,
  cleanupFile
}
