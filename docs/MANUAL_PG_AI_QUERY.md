# Manual de Implementación: pg_ai_query

## Descripción

**pg_ai_query** es una extensión de PostgreSQL que permite generar consultas SQL desde lenguaje natural usando modelos de IA (OpenAI, Anthropic, Google Gemini).

---

## Requisitos del Sistema

| Componente | Versión Mínima |
|------------|----------------|
| PostgreSQL | 14+ |
| CMake | 3.16+ |
| Compilador C++ | C++20 (GCC 10+, Clang 10+) |
| Sistema Operativo | Linux / macOS |
| API Key | OpenAI, Anthropic, o Gemini |

---

## Instalación Paso a Paso

### 1. Instalar PostgreSQL (si no existe)

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16 libpq-dev
sudo systemctl start postgresql
```

### 2. Instalar Herramientas de Compilación

**macOS:**
```bash
brew install cmake
xcode-select --install  # Para clang++
```

**Ubuntu/Debian:**
```bash
sudo apt install cmake build-essential g++
```

### 3. Clonar el Repositorio

```bash
git clone --recurse-submodules https://github.com/benodiwal/pg_ai_query.git
cd pg_ai_query
```

### 4. Compilar

```bash
mkdir build && cd build
cmake ..
make -j4
```

### 5. Instalar la Extensión

```bash
sudo make install
```

Esto copia los archivos a:
- `/usr/local/opt/postgresql@16/lib/postgresql/pg_ai_query.dylib`
- `/usr/local/opt/postgresql@16/share/postgresql@16/extension/pg_ai_query.control`
- `/usr/local/opt/postgresql@16/share/postgresql@16/extension/pg_ai_query--0.1.0.sql`

### 6. Crear Base de Datos

```bash
psql postgres -c "CREATE DATABASE medicalbot;"
```

### 7. Habilitar la Extensión

```bash
psql medicalbot -c "CREATE EXTENSION pg_ai_query;"
```

---

## Configuración

### Archivo de Configuración

Crear/editar `~/.pg_ai.config`:

```ini
[general]
log_level = info
log_to_file = false

[query]
row_limit = 1000

[response]
include_explanation = true
include_warnings = true

# Configurar al menos UN proveedor de IA:

[openai]
api_key = sk-xxx
model = gpt-4o

[anthropic]
api_key = sk-ant-xxx
model = claude-sonnet-4-5

[gemini]
api_key = AIzaXxx
model = gemini-2.5-flash
```

### Modelos Disponibles

| Proveedor | Modelos |
|-----------|---------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-5 |
| Anthropic | claude-sonnet-4-5, claude-4.5-opus, claude-3-haiku |
| Gemini | gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash |

---

## Funciones SQL Disponibles

### 1. generate_query(text)

Genera SQL desde lenguaje natural.

```sql
SELECT generate_query('lista todos los clientes que no han comprado en 90 días');
-- Retorna: SELECT * FROM clientes WHERE ultima_compra < NOW() - INTERVAL '90 days'
```

### 2. explain_query(text)

Analiza el rendimiento de una query.

```sql
SELECT explain_query('SELECT * FROM medicamentos WHERE precio > 50000');
-- Retorna: Análisis con sugerencias de optimización
```

### 3. get_database_tables()

Lista todas las tablas de la base de datos.

```sql
SELECT get_database_tables();
```

### 4. get_table_details(text)

Obtiene la estructura de una tabla específica.

```sql
SELECT get_table_details('medicamentos');
```

---

## Integración con Node.js

### 1. Instalar Dependencias

```bash
npm install pg dotenv
```

### 2. Configurar Variables de Entorno

Crear archivo `.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_USER=usuario
POSTGRES_PASSWORD=
POSTGRES_DB=medicalbot
POSTGRES_PORT=5432
```

### 3. Crear Servicio de PostgreSQL

```javascript
// src/services/postgres.service.js
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'usuario',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'medicalbot',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
})

/**
 * Genera SQL desde lenguaje natural
 */
const generarQueryConIA = async (preguntaNatural) => {
  const result = await pool.query(
    'SELECT generate_query($1) as sql',
    [preguntaNatural]
  )
  return result.rows[0]?.sql || null
}

/**
 * Analiza rendimiento de query
 */
const analizarQueryConIA = async (sqlQuery) => {
  const result = await pool.query(
    'SELECT explain_query($1) as analisis',
    [sqlQuery]
  )
  return result.rows[0]?.analisis || null
}

/**
 * Ejecuta query SQL
 */
const ejecutarQuery = async (sql, params = []) => {
  const result = await pool.query(sql, params)
  return result.rows
}

/**
 * Consulta completa: genera SQL y ejecuta
 */
const consultarConIA = async (preguntaNatural) => {
  const sql = await generarQueryConIA(preguntaNatural)
  const resultados = await ejecutarQuery(sql)
  return { sql, resultados }
}

module.exports = {
  pool,
  generarQueryConIA,
  analizarQueryConIA,
  ejecutarQuery,
  consultarConIA,
}
```

### 4. Usar en la Aplicación

```javascript
// app.js
require('dotenv').config()
const { consultarConIA } = require('./src/services/postgres.service')

// Ejemplo de uso
async function ejemplo() {
  const { sql, resultados } = await consultarConIA(
    'dame los 5 medicamentos más caros'
  )

  console.log('SQL generado:', sql)
  console.log('Resultados:', resultados)
}

ejemplo()
```

---

## Ejemplo de Uso en Bot de WhatsApp

```javascript
// src/flows/consulta.flow.js
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const { consultarConIA } = require('../services/postgres.service')

const flowConsulta = addKeyword(['consulta', 'buscar', 'query'])
  .addAnswer('📊 ¿Qué información necesitas? (escribe en lenguaje natural)')
  .addAction({ capture: true }, async (ctx, { flowDynamic }) => {
    try {
      const pregunta = ctx.body
      const { sql, resultados } = await consultarConIA(pregunta)

      await flowDynamic([
        `🔍 *Query generada:*\n\`\`\`${sql}\`\`\``,
        `📋 *Resultados:* ${resultados.length} registros encontrados`,
        resultados.slice(0, 5).map(r => JSON.stringify(r)).join('\n')
      ])
    } catch (error) {
      await flowDynamic('❌ Error: ' + error.message)
    }
  })

module.exports = { flowConsulta }
```

---

## Seguridad

### Protecciones Integradas

- ✅ No accede a `information_schema` ni `pg_catalog`
- ✅ Solo opera sobre tablas de usuario
- ✅ Límite de filas configurable (default: 1000)
- ✅ Queries parametrizadas (previene SQL injection)

### Recomendaciones

1. **No exponer directamente al usuario final** - Validar y sanitizar entrada
2. **Usar usuario PostgreSQL con permisos limitados**
3. **Revisar queries generadas antes de ejecutar** en producción
4. **Implementar rate limiting** para evitar abuso de API

---

## Troubleshooting

### Error: extension "pg_ai_query" is not available

```bash
# Verificar que la extensión está instalada
ls /usr/local/opt/postgresql@16/share/postgresql@16/extension/ | grep pg_ai

# Si no aparece, reinstalar:
cd /tmp/pg_ai_query/build
sudo make install
```

### Error: Could not connect to AI provider

```bash
# Verificar configuración
cat ~/.pg_ai.config

# Verificar API key válida
curl -H "Authorization: Bearer TU_API_KEY" https://api.openai.com/v1/models
```

### Error: Connection refused

```bash
# Verificar que PostgreSQL está corriendo
pg_isready

# Iniciar servicio si está detenido
brew services start postgresql@16  # macOS
sudo systemctl start postgresql    # Linux
```

---

## Desinstalación

```bash
# Eliminar extensión de la base de datos
psql medicalbot -c "DROP EXTENSION pg_ai_query;"

# Eliminar archivos (opcional)
sudo rm /usr/local/opt/postgresql@16/lib/postgresql/pg_ai_query.dylib
sudo rm /usr/local/opt/postgresql@16/share/postgresql@16/extension/pg_ai_query*

# Eliminar configuración
rm ~/.pg_ai.config

# Eliminar código fuente
rm -rf /tmp/pg_ai_query
```

---

## Referencias

- [Repositorio GitHub](https://github.com/benodiwal/pg_ai_query)
- [Documentación Oficial](https://benodiwal.github.io/pg_ai_query/)
- [Anuncio PostgreSQL](https://www.postgresql.org/about/news/pg_ai_query-ai-powered-sql-generation-query-analysis-for-postgresql-3175/)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Tu Aplicación                          │
│                      (Node.js Bot)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ pool.query()
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Server                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  pg_ai_query Extension                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │  │ generate_   │  │ explain_    │  │ get_table_   │   │  │
│  │  │ query()     │  │ query()     │  │ details()    │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────────┘   │  │
│  │         │                │                             │  │
│  │         └────────┬───────┘                             │  │
│  │                  ▼                                     │  │
│  │         ┌─────────────────┐                            │  │
│  │         │  AI Provider    │                            │  │
│  │         │  (Gemini/GPT/   │                            │  │
│  │         │   Claude)       │                            │  │
│  │         └─────────────────┘                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Tus Tablas de Datos                       │  │
│  │  medicamentos | clientes | ordenes | productos        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```
