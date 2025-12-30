const { GoogleGenerativeAI } = require('@google/generative-ai')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAECwNDqkun-vGZ6DpEXt0B_r1aQz_DeGA'
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

const extraerMedicamentos = async (filePath) => {
    const ext = filePath.split('.').pop().toLowerCase()
    let mimeType = 'application/pdf'
    if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
    if (ext === 'png') mimeType = 'image/png'

    const fileBuffer = fs.readFileSync(filePath)
    const base64Data = fileBuffer.toString('base64')

    const prompt = `Actúa como un experto en extracción de datos farmacéuticos y procesamiento de documentos contables.

OBJETIVO: Extraer de forma exhaustiva y precisa la información de medicamentos contenida en TODAS las páginas del documento adjunto (PDF, Imagen o Excel). Los datos se utilizarán para generar un archivo Excel posterior, por lo que la estructura debe ser impecable.

REGLAS DE PROCESAMIENTO GENERAL:

Análisis Multipágina: Procesa el documento desde la primera hasta la última página sin omitir ninguna fila de las tablas.

Identificación de Datos Mezclados: En formatos donde el Nombre, CUM, Invima y Lote están en la misma columna (como en Disfarma o Offimedicas), utiliza delimitadores lógicos para separarlos.

Campos Ausentes: Si un dato (como el CUM o el IVA) no está presente explícitamente, escribe "N/A". No inventes datos.

Limpieza del Nombre: Extrae el nombre del medicamento incluyendo concentración y presentación (ej. "Acetaminofén 500mg Tab x 100"). ELIMINA el nombre comercial entre paréntesis y el nombre del laboratorio.

DEFINICIÓN DE CAMPOS A EXTRAER:

Nombre: Nombre genérico + Concentración + Forma Farmacéutica + Cantidad de la presentación.

CUM: Código de 8 a 12 dígitos (ej. 19935303-4). Búscalo cerca de etiquetas como "CUM" o dentro de descripciones largas.

Invima: Registro sanitario. Búscalo como "Invima", "Reg. San." o códigos que empiecen por el año (ej. 2023M-0002317).

Lote: Identificador de fabricación (ej. Lote: 258332 o Lote: ILAJ525).

Valor Unitario: Precio por unidad/caja antes de impuestos.

IVA: Porcentaje o valor del impuesto. Si dice "0", "0.00%" o no aparece, marcar como 0.

Valor Total: Precio final de la línea (Cantidad x Valor Unitario).

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un array JSON válido. Cada medicamento debe ser un objeto con estas claves exactas:
[
  {
    "nombre": "string",
    "cum": "string",
    "invima": "string",
    "lote": "string",
    "valorUnitario": "string",
    "iva": "string",
    "valorTotal": "string"
  }
]
No incluyas texto adicional, solo el JSON.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Retry logic
    const maxRetries = 3
    let lastError = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent([
                { inlineData: { mimeType, data: base64Data } },
                prompt
            ])
            return result.response.text()
        } catch (error) {
            lastError = error
            const status = error.status || error.code
            const isRetryable = status === 503 || status === 500

            if (isRetryable && attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000
                console.log(`Intento ${attempt}/${maxRetries} falló. Reintentando en ${waitTime/1000}s...`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
            } else {
                break
            }
        }
    }

    throw lastError
}

const generarExcelMedicamentos = async (medicamentosTexto) => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Medicamentos')

    // 7 columnas
    sheet.columns = [
        { header: 'Nombre', key: 'nombre', width: 50 },
        { header: 'CUM', key: 'cum', width: 15 },
        { header: 'Invima', key: 'invima', width: 20 },
        { header: 'Lote', key: 'lote', width: 15 },
        { header: 'Valor Unitario', key: 'valorUnitario', width: 15 },
        { header: 'IVA', key: 'iva', width: 10 },
        { header: 'Valor Total', key: 'valorTotal', width: 15 }
    ]

    // Parsear JSON de Gemini
    let medicamentos = []
    try {
        // Limpiar respuesta (puede tener ```json ... ```)
        const jsonStr = medicamentosTexto
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()
        medicamentos = JSON.parse(jsonStr)
    } catch (e) {
        console.error('Error parseando JSON de Gemini:', e)
        // Fallback: una fila con el texto completo
        medicamentos = [{ nombre: medicamentosTexto }]
    }

    // Agregar filas
    medicamentos.forEach(med => {
        sheet.addRow({
            nombre: med.nombre || 'N/A',
            cum: med.cum || 'N/A',
            invima: med.invima || 'N/A',
            lote: med.lote || 'N/A',
            valorUnitario: med.valorUnitario || 'N/A',
            iva: med.iva || 'N/A',
            valorTotal: med.valorTotal || 'N/A'
        })
    })

    // Estilo header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    }

    const fileName = `medicamentos_${Date.now()}.xlsx`
    const outputPath = path.join(process.cwd(), 'uploads', fileName)
    await workbook.xlsx.writeFile(outputPath)

    return outputPath
}

module.exports = { extraerMedicamentos, generarExcelMedicamentos }
