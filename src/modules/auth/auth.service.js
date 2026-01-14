const { pool } = require('../../shared/db')

const ADMIN_SECRET = 'admin 2026 *'

/**
 * Extracts phone number from WhatsApp ID
 * @param {string} remoteJid - WhatsApp JID (e.g., "573001234567@s.whatsapp.net")
 * @returns {string} - Phone number (last 10 digits)
 */
const extractPhone = (remoteJid) => {
  const fullNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '')
  return fullNumber.slice(-10)
}

/**
 * Checks if phone number exists in admins table
 * @param {string} phone - Phone number (10 digits)
 * @returns {Promise<boolean>}
 */
const isPhoneAdmin = async (phone) => {
  try {
    const result = await pool.query(
      'SELECT 1 FROM admins WHERE phone = $1 LIMIT 1',
      [phone]
    )
    return result.rows.length > 0
  } catch (error) {
    console.error('Error checking admin status:', error.message)
    return false
  }
}

/**
 * Checks if message is the admin secret
 * @param {string} message - User message
 * @returns {boolean}
 */
const isAdminSecret = (message) => {
  return message.trim().toLowerCase() === ADMIN_SECRET.toLowerCase()
}

/**
 * Determines if user is admin based on message or phone
 * @param {string} message - User message
 * @param {string} remoteJid - WhatsApp JID
 * @returns {Promise<{isAdmin: boolean, phone: string, method: string}>}
 */
const identifyUser = async (message, remoteJid) => {
  const phone = extractPhone(remoteJid)

  if (isAdminSecret(message)) {
    return { isAdmin: true, phone, method: 'secret' }
  }

  const adminByPhone = await isPhoneAdmin(phone)
  if (adminByPhone) {
    return { isAdmin: true, phone, method: 'database' }
  }

  return { isAdmin: false, phone, method: 'none' }
}

/**
 * Gets admin info from database
 * @param {string} phone - Phone number
 * @returns {Promise<Object|null>}
 */
const getAdminInfo = async (phone) => {
  try {
    const result = await pool.query(
      'SELECT phone, name, created_at FROM admins WHERE phone = $1',
      [phone]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting admin info:', error.message)
    return null
  }
}

/**
 * Gets or creates client in database
 * @param {string} phone - Phone number
 * @param {string} name - Client name (optional)
 * @returns {Promise<Object>}
 */
const getOrCreateClient = async (phone, name = null) => {
  try {
    const existing = await pool.query(
      'SELECT phone, name, description, created_at FROM clients WHERE phone = $1',
      [phone]
    )

    if (existing.rows.length > 0) {
      return existing.rows[0]
    }

    const result = await pool.query(
      'INSERT INTO clients (phone, name) VALUES ($1, $2) RETURNING *',
      [phone, name || 'Cliente']
    )
    return result.rows[0]
  } catch (error) {
    console.error('Error with client:', error.message)
    return { phone, name: name || 'Cliente' }
  }
}

module.exports = {
  extractPhone,
  isPhoneAdmin,
  isAdminSecret,
  identifyUser,
  getAdminInfo,
  getOrCreateClient,
  ADMIN_SECRET
}
