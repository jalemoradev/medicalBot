const flowPrincipal = require('./principal.flow')
const { flowCotizaciones, flowRecibirArchivo, flowRecibirImagen } = require('./cotizaciones.flow')
const flowProductos = require('./productos.flow')

module.exports = {
    flowPrincipal,
    flowCotizaciones,
    flowProductos,
    flowRecibirArchivo,
    flowRecibirImagen
}
