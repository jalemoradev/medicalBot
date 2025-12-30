const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')

/**
 * Flujo para consultar productos
 */
const flowProductos = addKeyword(['2', 'productos', 'producto', 'catalogo'])
    .addAnswer('🛒 *CONSULTA DE PRODUCTOS*')
    .addAnswer(
        [
            'Estos son nuestros productos disponibles:',
            '',
            '📦 *Categoria A*',
            '   - Producto 1 - $100',
            '   - Producto 2 - $150',
            '   - Producto 3 - $200',
            '',
            '📦 *Categoria B*',
            '   - Producto 4 - $250',
            '   - Producto 5 - $300',
            '   - Producto 6 - $350',
            '',
            '📦 *Categoria C*',
            '   - Producto 7 - $400',
            '   - Producto 8 - $450',
            '   - Producto 9 - $500',
            '',
            '---',
            'Escribe el *nombre del producto* para mas informacion',
            'o escribe *hola* para volver al menu principal.'
        ]
    )

module.exports = flowProductos
