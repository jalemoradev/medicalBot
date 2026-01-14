const { pool } = require('../../shared/db')

/**
 * Upsert admins from Excel data
 * Expected columns: phone, name
 * @param {Array<Object>} data - Array of admin objects
 * @returns {Promise<{inserted: number, updated: number, errors: Array}>}
 */
const upsertAdmins = async (data) => {
  const results = { inserted: 0, updated: 0, errors: [] }

  for (const row of data) {
    try {
      const phone = String(row.phone || row.telefono || '').slice(-10)
      const name = row.name || row.nombre || 'Admin'

      if (!phone || phone.length !== 10) {
        results.errors.push({ row, error: 'Telefono invalido' })
        continue
      }

      const query = `
        INSERT INTO admins (phone, name)
        VALUES ($1, $2)
        ON CONFLICT (phone) DO UPDATE SET
          name = EXCLUDED.name
        RETURNING (xmax = 0) AS inserted
      `

      const result = await pool.query(query, [phone, name])

      if (result.rows[0]?.inserted) {
        results.inserted++
      } else {
        results.updated++
      }
    } catch (error) {
      results.errors.push({ row, error: error.message })
    }
  }

  return results
}

/**
 * Upsert clients from Excel data
 * Expected columns: phone, name, description (optional)
 * @param {Array<Object>} data - Array of client objects
 * @returns {Promise<{inserted: number, updated: number, errors: Array}>}
 */
const upsertClients = async (data) => {
  const results = { inserted: 0, updated: 0, errors: [] }

  for (const row of data) {
    try {
      const phone = String(row.phone || row.telefono || '').slice(-10)
      const name = row.name || row.nombre || 'Cliente'
      const description = row.description || row.descripcion || null

      if (!phone || phone.length !== 10) {
        results.errors.push({ row, error: 'Telefono invalido' })
        continue
      }

      const query = `
        INSERT INTO clients (phone, name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (phone) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description
        RETURNING (xmax = 0) AS inserted
      `

      const result = await pool.query(query, [phone, name, description])

      if (result.rows[0]?.inserted) {
        results.inserted++
      } else {
        results.updated++
      }
    } catch (error) {
      results.errors.push({ row, error: error.message })
    }
  }

  return results
}

/**
 * Upsert products from Excel data
 * Expected columns: code/codigo, name/nombre, price/precio
 * @param {Array<Object>} data - Array of product objects
 * @returns {Promise<{inserted: number, updated: number, errors: Array}>}
 */
const upsertProducts = async (data) => {
  const results = { inserted: 0, updated: 0, errors: [] }

  for (const row of data) {
    try {
      const code = String(row.code || row.codigo || '')
      const name = row.name || row.nombre || ''
      const price = parseFloat(row.price || row.precio || 0)

      if (!code) {
        results.errors.push({ row, error: 'Codigo invalido' })
        continue
      }

      const query = `
        INSERT INTO products (code, name, price)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price
        RETURNING (xmax = 0) AS inserted
      `

      const result = await pool.query(query, [code, name, price])

      if (result.rows[0]?.inserted) {
        results.inserted++
      } else {
        results.updated++
      }
    } catch (error) {
      results.errors.push({ row, error: error.message })
    }
  }

  return results
}

module.exports = {
  upsertAdmins,
  upsertClients,
  upsertProducts
}
