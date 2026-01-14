const { pool } = require('../../shared/db')

/**
 * Provider configuration
 * Each entry: { name: display name, table: SQL table name }
 */
const PROVIDER_CONFIG = [
  { name: 'Proveedor General', table: 'proveedor_general' },
  { name: 'Proveedor Bogotá', table: 'proveedor_bogota' }
]

const PROVIDERS = PROVIDER_CONFIG.map(p => p.name)

// Minimum similarity threshold for fuzzy matching (0.0 - 1.0)
const SIMILARITY_THRESHOLD = 0.15

/**
 * Search for a medication in a specific provider table using fuzzy matching
 * @returns {Object|null} - { code, price, similarity } or null if not found
 */
const searchInProvider = async (productName, tableName) => {
  try {
    // Set similarity threshold for this query
    await pool.query(`SET pg_trgm.similarity_threshold = ${SIMILARITY_THRESHOLD}`)

    // Fuzzy search using pg_trgm - finds best match by similarity
    const query = `
      SELECT code, product, price,
             similarity(LOWER(product), LOWER($1)) as sim
      FROM ${tableName}
      WHERE LOWER(product) % LOWER($1)
      ORDER BY sim DESC
      LIMIT 1
    `
    const result = await pool.query(query, [productName])

    if (result.rows.length > 0) {
      return {
        code: result.rows[0].code,
        price: result.rows[0].price,
        similarity: result.rows[0].sim
      }
    }
    return null
  } catch (error) {
    console.error(`Error searching in ${tableName}:`, error.message)
    return null
  }
}

/**
 * Compare prices for medications across all providers
 * @param {Array} medicamentos - Array of medication objects with 'nombre' field
 * @returns {Array} - Medications with codes and prices from each provider
 */
const compararPrecios = async (medicamentos) => {
  const resultados = []

  for (const med of medicamentos) {
    const nombre = med.nombre || ''
    const precios = {}
    const codigos = {}

    // Search in each provider table
    for (const provider of PROVIDER_CONFIG) {
      const result = await searchInProvider(nombre, provider.table)
      if (result) {
        codigos[provider.name] = result.code
        precios[provider.name] = `$${Number(result.price).toLocaleString('es-CO')}`
      } else {
        codigos[provider.name] = 'N/A'
        precios[provider.name] = 'No disponible'
      }
    }

    resultados.push({
      ...med,
      codigos,
      precios
    })
  }

  return resultados
}

/**
 * Get list of configured providers
 */
const getProviders = () => PROVIDERS

/**
 * Check if comparison service is configured (tables exist)
 */
const isComparisonConfigured = async () => {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'proveedor_general'
      )
    `)
    return result.rows[0].exists
  } catch (error) {
    return false
  }
}

module.exports = {
  compararPrecios,
  getProviders,
  isComparisonConfigured,
  PROVIDERS,
  PROVIDER_CONFIG
}
