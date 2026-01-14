const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const {
  extraerMedicamentos,
  generarExcelMedicamentos,
  getPdfPageCount,
  compararPrecios,
  getProviders
} = require('../quotes')

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Temporary storage for extracted medications (per user)
const userMedicamentos = new Map()

/**
 * Main welcome flow - shows quote menu
 */
const flowWelcome = addKeyword(EVENTS.WELCOME)
  .addAnswer([
    '*Generador de Cotizaciones*',
    '',
    'Envia un archivo (PDF o imagen) con la lista de medicamentos.',
    '',
    'Formatos soportados:',
    '- PDF',
    '- Imagen (JPG, PNG)',
    '',
    '_Esperando archivo..._'
  ].join('\n'))

/**
 * Process file and ask about comparison
 */
const processFileAndAsk = async (ctx, { flowDynamic, provider, gotoFlow }, filePath, fileType) => {
  try {
    const userId = ctx.key.remoteJid
    const ext = filePath.split('.').pop().toLowerCase()

    await flowDynamic(`Procesando ${fileType}...`)

    // For PDFs, show page count first
    if (ext === 'pdf') {
      const totalPages = await getPdfPageCount(filePath)
      await flowDynamic(`Documento tiene *${totalPages}* página(s). Extrayendo página por página...`)

      // Progress callback to update user
      let lastProgressMsg = 0
      const onProgress = async (currentPage, total) => {
        // Send progress every 2 pages or on first/last page
        if (currentPage === 1 || currentPage === total || currentPage - lastProgressMsg >= 2) {
          await flowDynamic(`Procesando página ${currentPage} de ${total}...`)
          lastProgressMsg = currentPage
        }
      }

      const { medicamentos, totalPages: pages } = await extraerMedicamentos(filePath, onProgress)

      userMedicamentos.set(userId, medicamentos)
      await flowDynamic(`Extracción completada. Se encontraron *${medicamentos.length}* medicamentos en ${pages} página(s).`)

    } else {
      // For images, process directly
      await flowDynamic('Extrayendo medicamentos con IA...')
      const { medicamentos } = await extraerMedicamentos(filePath)

      userMedicamentos.set(userId, medicamentos)
      await flowDynamic(`Se encontraron *${medicamentos.length}* medicamentos.`)
    }

    // Cleanup temp file
    fs.unlinkSync(filePath)

    // Go to comparison question flow
    return gotoFlow(flowAskComparison)
  } catch (error) {
    console.error('Error processing file:', error)
    await flowDynamic('Error al procesar el archivo: ' + error.message)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
}

/**
 * Handle PDF documents
 */
const flowDocument = addKeyword(EVENTS.DOCUMENT)
  .addAction(async (ctx, helpers) => {
    const buffer = await downloadMediaMessage(ctx, 'buffer', {})
    const fileName = `doc_${Date.now()}.pdf`
    const filePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(filePath, buffer)

    return processFileAndAsk(ctx, helpers, filePath, 'documento')
  })

/**
 * Handle images (JPG, PNG)
 */
const flowImage = addKeyword(EVENTS.MEDIA)
  .addAction(async (ctx, helpers) => {
    const mimeType = ctx.message?.imageMessage?.mimetype || ''
    if (!mimeType.includes('image')) {
      return
    }

    const buffer = await downloadMediaMessage(ctx, 'buffer', {})
    const ext = mimeType.includes('png') ? 'png' : 'jpg'
    const fileName = `img_${Date.now()}.${ext}`
    const filePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(filePath, buffer)

    return processFileAndAsk(ctx, helpers, filePath, 'imagen')
  })

/**
 * Ask if user wants price comparison
 */
const flowAskComparison = addKeyword(EVENTS.ACTION)
  .addAnswer([
    '¿Deseas comparar precios entre proveedores?',
    '',
    '*1.* Sí, comparar precios',
    '*2.* No, solo generar Excel de extracción',
    '',
    '_Escribe 1 o 2_'
  ].join('\n'), { capture: true }, async (ctx, { flowDynamic, provider, gotoFlow }) => {
    const option = ctx.body.trim()
    const userId = ctx.key.remoteJid
    const medicamentos = userMedicamentos.get(userId)

    if (!medicamentos || medicamentos.length === 0) {
      await flowDynamic('No hay medicamentos para procesar. Envía un archivo primero.')
      return gotoFlow(flowWelcome)
    }

    if (option === '1') {
      // Compare prices
      await flowDynamic('Comparando precios con proveedores...')

      const providers = getProviders()
      const medicamentosConPrecios = await compararPrecios(medicamentos)
      const excelPath = await generarExcelMedicamentos(medicamentosConPrecios, providers)

      await provider.sendFile(ctx.key.remoteJid, excelPath)
      await flowDynamic([
        'Listo. Excel generado con comparación de precios.',
        '',
        'Envía otro archivo para continuar.'
      ].join('\n'))

      // Cleanup
      userMedicamentos.delete(userId)
      fs.unlinkSync(excelPath)

    } else if (option === '2') {
      // Just extraction
      const excelPath = await generarExcelMedicamentos(medicamentos)

      await provider.sendFile(ctx.key.remoteJid, excelPath)
      await flowDynamic('Listo. Envía otro archivo para continuar.')

      // Cleanup
      userMedicamentos.delete(userId)
      fs.unlinkSync(excelPath)

    } else {
      await flowDynamic('Opción no válida. Escribe 1 o 2.')
    }
  })

module.exports = {
  flowWelcome,
  flowDocument,
  flowImage,
  flowAskComparison
}
