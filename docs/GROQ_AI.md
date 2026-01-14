# Groq AI - Análisis Completo

## Documento para: MedicalBot (Bot WhatsApp Farmacéutico)

---

## ¿Qué es Groq?

**Groq** es una empresa de infraestructura de IA que ofrece inferencia ultra-rápida mediante hardware especializado llamado **LPU (Language Processing Unit)**, diseñado específicamente para modelos de lenguaje.

### Diferenciador Clave
- **Velocidad:** Hasta 1,665 tokens/segundo (20x más rápido que otros proveedores)
- **Latencia:** Milisegundos vs segundos
- **Costo:** Hasta 89% más económico que alternativas
- **Valuación:** $6.9 billones (2025)

---

## Hardware: LPU (Language Processing Unit)

### Arquitectura
- Chip diseñado específicamente para inferencia de IA (desde 2016)
- Ejecución determinística (latencia predecible)
- SRAM integrada (no caché) para máxima velocidad
- Enfriamiento por aire (menor costo operativo)

### Ventajas sobre GPU
| Aspecto | GPU (NVIDIA) | LPU (Groq) |
|---------|--------------|------------|
| Diseño | Propósito general | Específico para IA |
| Latencia | Variable | Determinística |
| Velocidad | ~100 tok/s | 1,665 tok/s |
| Enfriamiento | Líquido/Complejo | Aire |
| Costo operativo | Alto | Bajo |

---

## Modelos Disponibles

### Modelos de Texto (LLM)

| Modelo | Contexto | Velocidad | Uso |
|--------|----------|-----------|-----|
| llama-3.3-70b-versatile | 128k | 1,665 tok/s | Chat, razonamiento |
| llama-3.3-70b-specdec | 128k | 1,665 tok/s | Decodificación especulativa |
| llama-3.1-8b-instant | 128k | Ultra-rápido | Respuestas rápidas |
| gemma2-9b-it | 8k | Rápido | Tareas ligeras |

### Modelos de Audio

| Modelo | Tipo | Uso |
|--------|------|-----|
| whisper-large-v3 | Speech-to-Text | Transcripción alta calidad |
| whisper-large-v3-turbo | STT rápido | Transcripción tiempo real |
| playai-tts | Text-to-Speech | Generación de voz |
| playai-tts-arabic | TTS Árabe | Voz en árabe |

### Modelos de Visión

| Modelo | Capacidad |
|--------|-----------|
| llama-3.2-11b-vision | Análisis de imágenes |
| llama-3.2-90b-vision | Visión avanzada |

---

## Precios (2025)

### Modelos de Texto

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) |
|--------|----------------------|------------------------|
| llama-3.3-70b-versatile | $0.59 | $0.79 |
| llama-3.3-70b-specdec | $0.59 | $0.99 |
| llama-3.1-8b-instant | $0.05 | $0.08 |
| gemma2-9b-it | $0.20 | $0.20 |

### Modelos de Audio

| Modelo | Precio |
|--------|--------|
| whisper-large-v3 | $0.111/hora de audio |
| whisper-large-v3-turbo | $0.04/hora de audio |

### Descuentos

| Tipo | Descuento |
|------|-----------|
| Batch Processing | 50% |
| Volumen alto | Negociable |

### Comparación con Competidores

| Proveedor | Modelo | Costo/1M tokens | Velocidad |
|-----------|--------|-----------------|-----------|
| OpenAI | GPT-4 | $30.00 | ~50 tok/s |
| Google | Gemini 1.5 Pro | $3.50 | ~100 tok/s |
| Anthropic | Claude 3.5 | $15.00 | ~80 tok/s |
| **Groq** | **Llama 3.3 70B** | **$0.59** | **1,665 tok/s** |

**Ahorro vs Gemini:** 83%
**Ahorro vs OpenAI:** 98%

---

## API y Endpoints

### Base URL
```
https://api.groq.com/openai/v1
```

### Autenticación
```bash
export GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

### Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/chat/completions` | POST | Chat y generación de texto |
| `/audio/transcriptions` | POST | Speech-to-Text (Whisper) |
| `/audio/translations` | POST | Traducción de audio |
| `/audio/speech` | POST | Text-to-Speech |
| `/embeddings` | POST | Vectores semánticos |
| `/models` | GET | Lista de modelos |
| `/batches` | POST | Procesamiento por lotes |

### Compatibilidad OpenAI

La API de Groq es **100% compatible** con el formato de OpenAI, lo que permite migración directa:

```javascript
// OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Groq (mismo código, diferente cliente)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
```

---

## Ejemplos de Código

### Instalación

```bash
npm install groq-sdk
```

### Chat Completions (Texto)

```javascript
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function chat(mensaje) {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "Eres un asistente farmacéutico experto." },
      { role: "user", content: mensaje }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0].message.content;
}

// Uso
const respuesta = await chat("¿Cuáles son los efectos secundarios del ibuprofeno?");
```

### Speech-to-Text (Whisper)

```javascript
const fs = require('fs');

async function transcribir(audioPath) {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-large-v3-turbo",
    language: "es",
    response_format: "text"
  });

  return transcription.text;
}

// Uso
const texto = await transcribir("nota_voz.ogg");
console.log(texto); // "Necesito una cotización de 100 cajas de acetaminofén"
```

### Text-to-Speech

```javascript
async function generarAudio(texto) {
  const audio = await groq.audio.speech.create({
    model: "playai-tts",
    voice: "alloy",
    input: texto
  });

  const buffer = Buffer.from(await audio.arrayBuffer());
  fs.writeFileSync("respuesta.mp3", buffer);
  return "respuesta.mp3";
}

// Uso
const audioPath = await generarAudio("Tu cotización está lista");
```

### Análisis de Imágenes (Vision)

```javascript
async function analizarImagen(imagenBase64, mimeType) {
  const completion = await groq.chat.completions.create({
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Extrae los medicamentos de esta imagen" },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${imagenBase64}` }
        }
      ]
    }],
    model: "llama-3.2-90b-vision",
  });

  return completion.choices[0].message.content;
}
```

### Streaming

```javascript
async function chatStream(mensaje) {
  const stream = await groq.chat.completions.create({
    messages: [{ role: "user", content: mensaje }],
    model: "llama-3.3-70b-versatile",
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}
```

---

## Integración con MedicalBot

### Caso de Uso 1: Reemplazar Gemini

**Beneficios:**
- ✅ 83% más económico
- ✅ 16x más rápido
- ✅ API compatible
- ✅ Sin necesidad de cambiar lógica

**Implementación:**

```javascript
// src/services/groq.service.js
const Groq = require('groq-sdk');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROMPT_EXTRACCION = `Actúa como un experto en extracción de datos farmacéuticos.
Extrae la información de medicamentos del documento.
Devuelve SOLO un JSON array con los campos:
- nombre: Nombre del medicamento con concentración
- CUM: Código único de medicamento
- Invima: Registro sanitario
- Lote: Número de lote
- valorUnitario: Precio unitario
- IVA: Porcentaje de IVA
- valorTotal: Valor total`;

const extraerMedicamentos = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'application/pdf';
  if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';

  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  const completion = await groq.chat.completions.create({
    messages: [{
      role: "user",
      content: [
        { type: "text", text: PROMPT_EXTRACCION },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
      ]
    }],
    model: "llama-3.2-90b-vision",
    temperature: 0.1,
  });

  const respuesta = completion.choices[0].message.content;

  // Parsear JSON de la respuesta
  const jsonMatch = respuesta.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No se pudo extraer datos');
};

module.exports = { extraerMedicamentos };
```

### Caso de Uso 2: Notas de Voz

**Flujo:**
```
Usuario envía nota de voz → Whisper transcribe → Bot procesa → Responde
```

**Implementación:**

```javascript
// src/services/groq.service.js (añadir)

const transcribirNotaVoz = async (audioPath) => {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-large-v3-turbo",
    language: "es"
  });
  return transcription.text;
};

module.exports = { extraerMedicamentos, transcribirNotaVoz };
```

```javascript
// src/flows/voz.flow.js
const { addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const { transcribirNotaVoz } = require('../services/groq.service');

const flowVoz = addKeyword(EVENTS.VOICE_NOTE)
  .addAction(async (ctx, { flowDynamic, provider }) => {
    await flowDynamic('🎤 Procesando tu nota de voz...');

    // Descargar audio
    const audioPath = await descargarAudio(ctx, provider);

    // Transcribir con Whisper
    const texto = await transcribirNotaVoz(audioPath);

    await flowDynamic(`📝 Entendí: "${texto}"\n\nProcesando tu solicitud...`);

    // Procesar el texto como si fuera un mensaje normal
    // ...
  });

module.exports = { flowVoz };
```

### Caso de Uso 3: Respuestas de Audio

```javascript
// src/services/groq.service.js (añadir)

const generarRespuestaAudio = async (texto) => {
  const audio = await groq.audio.speech.create({
    model: "playai-tts",
    voice: "alloy",
    input: texto
  });

  const buffer = Buffer.from(await audio.arrayBuffer());
  const audioPath = path.join(__dirname, '../../uploads', `respuesta_${Date.now()}.mp3`);
  fs.writeFileSync(audioPath, buffer);
  return audioPath;
};

module.exports = { extraerMedicamentos, transcribirNotaVoz, generarRespuestaAudio };
```

---

## Configuración para MedicalBot

### 1. Variables de Entorno

```env
# .env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Instalar SDK

```bash
npm install groq-sdk
```

### 3. Obtener API Key

1. Ir a [console.groq.com](https://console.groq.com)
2. Crear cuenta
3. Ir a API Keys
4. Crear nueva key
5. Copiar a `.env`

---

## Rate Limits

| Tier | Requests/min | Tokens/min |
|------|--------------|------------|
| Free | 30 | 6,000 |
| Developer | 100 | 100,000 |
| Enterprise | Custom | Custom |

---

## Ventajas para MedicalBot

| Ventaja | Impacto |
|---------|---------|
| **Velocidad** | Respuestas instantáneas al usuario |
| **Costo** | 83% ahorro vs Gemini |
| **Whisper** | Notas de voz sin costo adicional |
| **TTS** | Respuestas de audio incluidas |
| **Vision** | Análisis de documentos/imágenes |
| **API Compatible** | Migración sin cambios de lógica |

---

## Fuentes

- [Groq Official](https://groq.com/)
- [Groq Pricing](https://groq.com/pricing)
- [GroqCloud Console](https://console.groq.com/docs)
- [Groq LPU Architecture](https://groq.com/lpu-architecture)
- [Groq Llama 3.3 Benchmark](https://groq.com/blog/new-ai-inference-speed-benchmark-for-llama-3-3-70b-powered-by-groq)
- [Groq GitHub](https://github.com/groq)
