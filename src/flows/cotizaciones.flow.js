const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const path = require('path')
const { extraerMedicamentos, generarExcelMedicamentos } = require('../services/gemini.service')

const guardarArchivo = async (ctx, extension) => {
    const buffer = await downloadMediaMessage(ctx, 'buffer', {})
    const fileName = `${Date.now()}.${extension}`
    const filePath = path.join(process.cwd(), 'uploads', fileName)
    fs.writeFileSync(filePath, buffer)
    return filePath
}

const flowRecibirArchivo = addKeyword(EVENTS.DOCUMENT)
    .addAction(async (ctx, { flowDynamic, provider }) => {
        try {
            await flowDynamic('📤 Archivo recibido, procesando...')
            const filePath = await guardarArchivo(ctx, 'pdf')
            await flowDynamic('⏳ Extrayendo medicamentos...')

            const medicamentos = await extraerMedicamentos(filePath)
            const excelPath = await generarExcelMedicamentos(medicamentos)

            const sock = provider.vendor
            const jid = ctx.key.remoteJid
            await sock.sendMessage(jid, {
                document: fs.readFileSync(excelPath),
                fileName: 'medicamentos.xlsx',
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                caption: '✅ Aqui tienes el listado de medicamentos'
            })
        } catch (error) {
            console.error('Error:', error)
            await flowDynamic('❌ Error al procesar el archivo')
        }
    })

const flowRecibirImagen = addKeyword(EVENTS.MEDIA)
    .addAction(async (ctx, { flowDynamic, provider }) => {
        try {
            await flowDynamic('📤 Imagen recibida, procesando...')
            const filePath = await guardarArchivo(ctx, 'jpg')
            await flowDynamic('⏳ Extrayendo medicamentos...')

            const medicamentos = await extraerMedicamentos(filePath)
            const excelPath = await generarExcelMedicamentos(medicamentos)

            const sock = provider.vendor
            const jid = ctx.key.remoteJid
            await sock.sendMessage(jid, {
                document: fs.readFileSync(excelPath),
                fileName: 'medicamentos.xlsx',
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                caption: '✅ Aqui tienes el listado de medicamentos'
            })
        } catch (error) {
            console.error('Error:', error)
            await flowDynamic('❌ Error al procesar la imagen')
        }
    })

const flowCotizaciones = addKeyword(['1', 'cotizacion', 'cotizaciones', 'cotizar'])
    .addAnswer([
        '📋 *GENERAR COTIZACION*',
        '',
        '📎 Envia tu archivo (Excel, PDF o Imagen) con el listado de medicamentos'
    ])

module.exports = {
    flowCotizaciones,
    flowRecibirArchivo,
    flowRecibirImagen
}
