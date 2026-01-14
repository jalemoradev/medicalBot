#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function detectOS() {
  const platform = os.platform();

  if (platform === 'darwin') {
    return { name: 'macOS', platform };
  } else if (platform === 'win32') {
    return { name: 'Windows', platform };
  } else if (platform === 'linux') {
    return { name: 'Linux', platform };
  }

  return { name: 'Unknown', platform };
}

function checkPostgreSQL(osInfo) {
  const commands = {
    darwin: 'which psql && psql --version',
    win32: 'where psql && psql --version',
    linux: 'which psql && psql --version'
  };

  const command = commands[osInfo.platform] || commands.linux;

  try {
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const versionMatch = output.match(/psql \(PostgreSQL\) ([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : 'desconocida';

    return { installed: true, version };
  } catch {
    return { installed: false, version: null };
  }
}

function checkDatabase(dbName) {
  try {
    const result = execSync(
      `psql -lqt | cut -d \\| -f 1 | grep -w ${dbName}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim().includes(dbName);
  } catch {
    return false;
  }
}

function createDatabase(dbName) {
  try {
    execSync(`createdb ${dbName}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getConnectionParams(dbName) {
  const user = os.userInfo().username;
  return {
    host: 'localhost',
    port: 5432,
    database: dbName,
    user: user,
    connectionString: `postgresql://${user}@localhost:5432/${dbName}`
  };
}

function checkTable(dbName, tableName) {
  try {
    const result = execSync(
      `psql -d ${dbName} -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim() === 't';
  } catch {
    return false;
  }
}

function createAdminsTable(dbName) {
  const sql = `
    CREATE TABLE admins (
      phone VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    execSync(
      `psql -d ${dbName} -c "${sql.replace(/\n/g, ' ')}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function createClientsTable(dbName) {
  const sql = `
    CREATE TABLE clients (
      phone VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    execSync(
      `psql -d ${dbName} -c "${sql.replace(/\n/g, ' ')}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getTableStructure(dbName, tableName) {
  try {
    const result = execSync(
      `psql -d ${dbName} -c "\\d ${tableName}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result;
  } catch {
    return null;
  }
}

function main() {
  console.log('\n' + '='.repeat(50));
  log('  VALIDACION DE DEPENDENCIAS - MedicalBot', 'bold');
  console.log('='.repeat(50) + '\n');

  // Detect OS
  const osInfo = detectOS();
  log(`Sistema Operativo: ${osInfo.name}`, 'cyan');
  console.log(`  Platform: ${osInfo.platform}`);
  console.log(`  Arquitectura: ${os.arch()}`);
  console.log('');

  // Check PostgreSQL
  console.log('-'.repeat(50));
  log('PostgreSQL:', 'bold');

  const postgres = checkPostgreSQL(osInfo);

  if (postgres.installed) {
    log(`  ✓ Instalado (v${postgres.version})`, 'green');
  } else {
    log('  ✗ No instalado', 'red');
    log(`  → Instalar: ${osInfo.platform === 'darwin' ? 'brew install postgresql' : 'Descargar desde postgresql.org'}`, 'yellow');
    console.log('\n' + '='.repeat(50) + '\n');
    return;
  }

  // Check Database
  console.log('');
  console.log('-'.repeat(50));
  log('Base de Datos:', 'bold');

  const dbName = 'medicalbot';
  const dbExists = checkDatabase(dbName);

  if (dbExists) {
    log(`  ✓ Base de datos '${dbName}' existe`, 'green');
  } else {
    log(`  ✗ Base de datos '${dbName}' no existe`, 'yellow');
    log('  → Creando base de datos...', 'cyan');

    const createResult = createDatabase(dbName);

    if (createResult.success) {
      log(`  ✓ Base de datos '${dbName}' creada exitosamente`, 'green');
    } else {
      log(`  ✗ Error al crear base de datos: ${createResult.error}`, 'red');
      console.log('\n' + '='.repeat(50) + '\n');
      return;
    }
  }

  // Check Tables
  console.log('');
  console.log('-'.repeat(50));
  log('Tablas:', 'bold');

  // Check admins table
  const adminsExists = checkTable(dbName, 'admins');

  if (adminsExists) {
    log(`  ✓ Tabla 'admins' existe`, 'green');
  } else {
    log(`  ✗ Tabla 'admins' no existe`, 'yellow');
    log('  → Creando tabla admins...', 'cyan');

    const createResult = createAdminsTable(dbName);

    if (createResult.success) {
      log(`  ✓ Tabla 'admins' creada exitosamente`, 'green');
    } else {
      log(`  ✗ Error al crear tabla: ${createResult.error}`, 'red');
    }
  }

  // Check clients table
  const clientsExists = checkTable(dbName, 'clients');

  if (clientsExists) {
    log(`  ✓ Tabla 'clients' existe`, 'green');
  } else {
    log(`  ✗ Tabla 'clients' no existe`, 'yellow');
    log('  → Creando tabla clients...', 'cyan');

    const createResult = createClientsTable(dbName);

    if (createResult.success) {
      log(`  ✓ Tabla 'clients' creada exitosamente`, 'green');
    } else {
      log(`  ✗ Error al crear tabla: ${createResult.error}`, 'red');
    }
  }

  // Show table structures
  console.log('');
  log('  Estructura tabla admins:', 'cyan');
  console.log('    - phone: VARCHAR(10) [PK]');
  console.log('    - name: VARCHAR(100)');
  console.log('    - created_at: TIMESTAMP');

  console.log('');
  log('  Estructura tabla clients:', 'cyan');
  console.log('    - phone: VARCHAR(10) [PK]');
  console.log('    - name: VARCHAR(100)');
  console.log('    - description: TEXT');
  console.log('    - created_at: TIMESTAMP');

  // Show connection params
  console.log('');
  console.log('-'.repeat(50));
  log('Parametros de Conexion:', 'bold');

  const params = getConnectionParams(dbName);
  console.log(`  Host:     ${params.host}`);
  console.log(`  Puerto:   ${params.port}`);
  console.log(`  Database: ${params.database}`);
  console.log(`  Usuario:  ${params.user}`);
  console.log('');
  log('  Connection String:', 'cyan');
  console.log(`  ${params.connectionString}`);

  console.log('\n' + '='.repeat(50) + '\n');
}

main();
