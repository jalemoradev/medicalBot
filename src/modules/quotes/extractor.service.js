const { GoogleGenerativeAI } = require('@google/generative-ai')
const { PDFDocument } = require('pdf-lib')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required in .env')
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

const EXTRACTION_PROMPT = `Actúa como un experto en extracción de datos farmacéuticos.

OBJETIVO: Extraer TODOS los medicamentos de esta página del documento.

REGLAS:
- Extrae CADA medicamento que veas en la página
- Si un dato no está presente, escribe "N/A"
- NO inventes datos
- Limpia el nombre: incluye concentración y presentación, ELIMINA nombre comercial entre paréntesis y laboratorio

CAMPOS A EXTRAER:
- nombre: Nombre genérico + Concentración + Forma Farmacéutica + Cantidad
- cum: Código de 8 a 12 dígitos (ej. 19935303-4)
- invima: Registro sanitario (ej. 2023M-0002317)
- lote: Identificador de fabricación
- valorUnitario: Precio por unidad antes de impuestos
- iva: Porcentaje o valor del impuesto (0 si no aparece)
- valorTotal: Precio final de la línea

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un array JSON válido:
[{"nombre":"string","cum":"string","invima":"string","lote":"string","valorUnitario":"string","iva":"string","valorTotal":"string"}]

Si no hay medicamentos en esta página, responde: []`

/**
 * Get total page count from PDF
 */
const getPdfPageCount = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath)
  const pdfDoc = await PDFDocument.load(fileBuffer)
  return pdfDoc.getPageCount()
}

/**
 * Extract a single page from PDF as a new PDF buffer
 */
const extractPdfPage = async (filePath, pageIndex) => {
  const fileBuffer = fs.readFileSync(filePath)
  const srcDoc = await PDFDocument.load(fileBuffer)

  const newDoc = await PDFDocument.create()
  const [copiedPage] = await newDoc.copyPages(srcDoc, [pageIndex])
  newDoc.addPage(copiedPage)

  return await newDoc.save()
}

/**
 * Extract medications from a single page using Gemini
 */
const extractFromSinglePage = async (pageBuffer, mimeType = 'application/pdf') => {
  const base64Data = Buffer.from(pageBuffer).toString('base64')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const maxRetries = 3
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64Data } },
        EXTRACTION_PROMPT
      ])
      return result.response.text()
    } catch (error) {
      lastError = error
      const status = error.status || error.code
      const isRetryable = status === 503 || status === 500 || status === 429

      if (isRetryable && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`Página - Intento ${attempt}/${maxRetries} falló. Reintentando en ${waitTime/1000}s...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else {
        break
      }
    }
  }

  throw lastError
}

/**
 * Extract medications from document (PDF page-by-page or image)
 * @param {string} filePath - Path to the file
 * @param {function} onProgress - Optional callback for progress updates (pageNum, totalPages)
 * @returns {Object} - { medicamentos: Array, totalPages: number }
 */
const extraerMedicamentos = async (filePath, onProgress = null) => {
  const ext = filePath.split('.').pop().toLowerCase()

  // For images, process directly (single "page")
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    let mimeType = 'image/jpeg'
    if (ext === 'png') mimeType = 'image/png'

    const fileBuffer = fs.readFileSync(filePath)
    if (onProgress) onProgress(1, 1)

    const result = await extractFromSinglePage(fileBuffer, mimeType)
    return {
      medicamentos: parseMedicamentos(result),
      totalPages: 1
    }
  }

  // For PDFs, process page by page
  const totalPages = await getPdfPageCount(filePath)
  console.log(`PDF tiene ${totalPages} páginas. Procesando secuencialmente...`)

  const allMedicamentos = []

  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    console.log(`Procesando página ${pageNum + 1}/${totalPages}...`)

    if (onProgress) {
      onProgress(pageNum + 1, totalPages)
    }

    try {
      const pageBuffer = await extractPdfPage(filePath, pageNum)
      const pageResult = await extractFromSinglePage(pageBuffer)
      const pageMeds = parseMedicamentos(pageResult)

      if (pageMeds.length > 0) {
        console.log(`  → ${pageMeds.length} medicamentos encontrados`)
        allMedicamentos.push(...pageMeds)
      } else {
        console.log(`  → Sin medicamentos en esta página`)
      }

      // Small delay between pages to avoid rate limiting
      if (pageNum < totalPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`Error en página ${pageNum + 1}:`, error.message)
      // Continue with next page instead of failing completely
    }
  }

  console.log(`Total medicamentos extraídos: ${allMedicamentos.length}`)

  return {
    medicamentos: allMedicamentos,
    totalPages
  }
}

/**
 * Parse medication text from Gemini response
 */
const parseMedicamentos = (medicamentosTexto) => {
  try {
    const jsonStr = medicamentosTexto
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('Error parseando JSON de Gemini:', e)
    return [{ nombre: medicamentosTexto }]
  }
}

/**
 * Generate Excel with medications and optional provider codes/prices
 * @param {string|Array} medicamentosData - JSON string or array of medications
 * @param {Array} providers - Optional array of provider names for code/price columns
 */
const generarExcelMedicamentos = async (medicamentosData, providers = []) => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Medicamentos')

  // Base columns
  const columns = [
    { header: 'Nombre', key: 'nombre', width: 50 },
    { header: 'CUM', key: 'cum', width: 15 },
    { header: 'Invima', key: 'invima', width: 20 },
    { header: 'Lote', key: 'lote', width: 15 },
    { header: 'Valor Unitario', key: 'valorUnitario', width: 15 },
    { header: 'IVA', key: 'iva', width: 10 },
    { header: 'Valor Total', key: 'valorTotal', width: 15 }
  ]

  // Add provider columns: Code + Price per provider
  providers.forEach(prov => {
    columns.push({ header: `Código ${prov}`, key: `codigo_${prov}`, width: 15 })
    columns.push({ header: `Precio ${prov}`, key: `precio_${prov}`, width: 18 })
  })

  sheet.columns = columns

  // Parse medications if string
  const medicamentos = typeof medicamentosData === 'string'
    ? parseMedicamentos(medicamentosData)
    : medicamentosData

  medicamentos.forEach(med => {
    const row = {
      nombre: med.nombre || 'N/A',
      cum: med.cum || 'N/A',
      invima: med.invima || 'N/A',
      lote: med.lote || 'N/A',
      valorUnitario: med.valorUnitario || 'N/A',
      iva: med.iva || 'N/A',
      valorTotal: med.valorTotal || 'N/A'
    }

    // Add provider codes and prices if available
    providers.forEach(prov => {
      row[`codigo_${prov}`] = med.codigos?.[prov] || 'N/A'
      row[`precio_${prov}`] = med.precios?.[prov] || 'No disponible'
    })

    sheet.addRow(row)
  })

  // Style header row
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Style provider columns with different color
  if (providers.length > 0) {
    const provStartCol = 8 // After base columns
    const totalProvCols = providers.length * 2 // Code + Price per provider
    for (let i = 0; i < totalProvCols; i++) {
      sheet.getColumn(provStartCol + i).eachCell((cell, rowNum) => {
        if (rowNum === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB8D4E8' } // Light blue for provider headers
          }
        }
      })
    }
  }

  const fileName = `medicamentos_${Date.now()}.xlsx`
  const outputPath = path.join(process.cwd(), 'uploads', fileName)
  await workbook.xlsx.writeFile(outputPath)

  return outputPath
}

module.exports = {
  extraerMedicamentos,
  generarExcelMedicamentos,
  parseMedicamentos,
  getPdfPageCount
}
