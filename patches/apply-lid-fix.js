/**
 * Parche para soporte de LID (Local Identifier) en @bot-whatsapp/provider
 *
 * Este script modifica el provider de Baileys para soportar el nuevo formato
 * de identificadores LID que WhatsApp implementó en 2024.
 *
 * Ejecutar: node patches/apply-lid-fix.js
 */

const fs = require('fs');
const path = require('path');

const PROVIDER_PATH = path.join(
    __dirname,
    '..',
    'node_modules',
    '@bot-whatsapp',
    'provider',
    'lib',
    'baileys',
    'index.cjs'
);

// Función original a reemplazar
const OLD_CLEAN_NUMBER = `const baileyCleanNumber$1 = (number, full = false) => {
    number = number.replace('@s.whatsapp.net', '');
    number = !full ? \`\${number}@s.whatsapp.net\` : \`\${number}\`;
    return number
};`;

// Nueva función con soporte LID
const NEW_CLEAN_NUMBER = `const baileyCleanNumber$1 = (number, full = false) => {
    // Check if it's a LID format (either explicit @lid or by length)
    const hasLidSuffix = number.includes('@lid');
    const cleanNum = number.replace('@s.whatsapp.net', '').replace('@lid', '');

    // LIDs typically have 14+ digits, phone numbers have 10-13
    const isLid = hasLidSuffix || cleanNum.length >= 14;

    if (isLid) {
        // For LIDs, use @lid suffix
        number = !full ? \`\${cleanNum}@lid\` : \`\${cleanNum}\`;
    } else {
        // Original behavior for regular phone numbers
        number = !full ? \`\${cleanNum}@s.whatsapp.net\` : \`\${cleanNum}\`;
    }
    return number
};`;

// Preservar originalRemoteJid - buscar el patrón
const OLD_EMIT_PATTERN = `                payload.from = baileyCleanNumber(payload.from, true);
                this.emit('message', payload);`;

const NEW_EMIT_PATTERN = `                // Preserve original remoteJid for sending (handles @lid format)
                payload.originalRemoteJid = payload.from;
                payload.from = baileyCleanNumber(payload.from, true);
                this.emit('message', payload);`;

function applyPatch() {
    console.log('Aplicando parche de soporte LID...\n');

    // Verificar que el archivo existe
    if (!fs.existsSync(PROVIDER_PATH)) {
        console.error('ERROR: No se encontró el archivo del provider.');
        console.error('Asegúrate de haber ejecutado "npm install" primero.');
        console.error(`Ruta esperada: ${PROVIDER_PATH}`);
        process.exit(1);
    }

    // Leer el archivo
    let content = fs.readFileSync(PROVIDER_PATH, 'utf8');

    // Verificar si ya está parcheado
    if (content.includes('// LIDs typically have 14+ digits')) {
        console.log('El parche ya está aplicado.');
        return;
    }

    // Aplicar parche 1: baileyCleanNumber
    if (content.includes(OLD_CLEAN_NUMBER)) {
        content = content.replace(OLD_CLEAN_NUMBER, NEW_CLEAN_NUMBER);
        console.log('✓ Parche 1 aplicado: baileyCleanNumber con soporte LID');
    } else {
        console.warn('⚠ No se encontró la función baileyCleanNumber original');
        console.warn('  El provider puede tener una versión diferente');
    }

    // Aplicar parche 2: preservar originalRemoteJid
    if (content.includes(OLD_EMIT_PATTERN)) {
        content = content.replace(OLD_EMIT_PATTERN, NEW_EMIT_PATTERN);
        console.log('✓ Parche 2 aplicado: preservar originalRemoteJid');
    } else if (!content.includes('payload.originalRemoteJid')) {
        console.warn('⚠ No se encontró el patrón para originalRemoteJid');
    }

    // Guardar el archivo
    fs.writeFileSync(PROVIDER_PATH, content, 'utf8');

    console.log('\n✅ Parche aplicado exitosamente!');
    console.log('Reinicia el bot para que los cambios tomen efecto.');
}

// Ejecutar
applyPatch();
