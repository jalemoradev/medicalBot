/**
 * Script to import provider Excel files into PostgreSQL
 * Usage: node scripts/import-providers.js
 */
require('dotenv').config()

const XLSX = require('xlsx')
const { Pool } = require('pg')
const path = require('path')

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'usuario',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'medicalbot',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
})

const PROVIDERS = [
  {
    file: 'src/providers/PROVEEDOR-GENERAL.xls',
    table: 'proveedor_general',
    name: 'Proveedor General'
  },
  {
    file: 'src/providers/PROVEEDOR-BOGOTA.xlsx',
    table: 'proveedor_bogota',
    name: 'Proveedor Bogotá'
  }
]

async function createTables() {
  const createTableSQL = (tableName) => `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      code VARCHAR(50) PRIMARY KEY,
      product VARCHAR(500) NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  for (const provider of PROVIDERS) {
    await pool.query(createTableSQL(provider.table))
    console.log(`✓ Tabla ${provider.table} verificada`)
  }
}

async function importProvider(provider) {
  console.log(`\nImportando ${provider.name}...`)

  const wb = XLSX.readFile(provider.file)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet)

  // Clear existing data
  await pool.query(`TRUNCATE TABLE ${provider.table}`)

  let inserted = 0
  let errors = 0

  for (const row of data) {
    const code = String(row.CODIGO || row.codigo || '').trim()
    const product = String(row.PRODUCTO || row.producto || '').trim()
    const price = parseFloat(row.PRECIO || row.precio || 0)

    if (!code || !product) {
      errors++
      continue
    }

    try {
      await pool.query(
        `INSERT INTO ${provider.table} (code, product, price)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET
           product = EXCLUDED.product,
           price = EXCLUDED.price,
           updated_at = CURRENT_TIMESTAMP`,
        [code, product, price]
      )
      inserted++
    } catch (err) {
      console.error(`Error insertando ${code}:`, err.message)
      errors++
    }
  }

  console.log(`  Insertados: ${inserted}`)
  console.log(`  Errores: ${errors}`)
}

async function main() {
  console.log('=== Importación de Proveedores ===\n')

  try {
    await createTables()

    for (const provider of PROVIDERS) {
      await importProvider(provider)
    }

    console.log('\n✓ Importación completada')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

main()
