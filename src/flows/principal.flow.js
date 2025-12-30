const { addKeyword } = require('@bot-whatsapp/bot')
const { flowCotizaciones } = require('./cotizaciones.flow')
const flowProductos = require('./productos.flow')

const flowPrincipal = addKeyword(['hola', 'ole', 'alo', 'Hola', 'menu', 'inicio'])
    .addAnswer('👋 *Hola! Bienvenido a nuestro servicio*')
    .addAnswer(
        [
            'Por favor selecciona una opcion:',
            '',
            '*1.* 📋 Generar cotizaciones',
            '*2.* 🛒 Consultar productos',
            '',
            '_Escribe el numero de la opcion que deseas_'
        ],
        null,
        null,
        [flowCotizaciones, flowProductos]
    )

module.exports = flowPrincipal
