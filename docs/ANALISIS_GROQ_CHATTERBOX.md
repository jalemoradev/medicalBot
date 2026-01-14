# Análisis Tecnológico: Groq AI y Resemble AI Chatterbox

## Documento para: MedicalBot (Bot WhatsApp Farmacéutico)

---

# Parte 1: Análisis del Proyecto Actual

## Resumen de MedicalBot

**Tipo:** Bot de WhatsApp para procesamiento de documentos farmacéuticos
**Stack:** Node.js + Baileys + Google Gemini AI + PostgreSQL

### Funcionalidades Actuales
1. **Extracción de datos farmacéuticos** - Procesa PDFs/imágenes con Gemini AI
2. **Generación de cotizaciones** - Crea archivos Excel con datos de medicamentos
3. **Catálogo de productos** - Muestra productos disponibles
4. **Consultas con IA** - pg_ai_query para consultas en lenguaje natural

### Integraciones de IA Actuales
| Servicio | Propósito | Estado |
|----------|-----------|--------|
| Google Gemini 2.5 Flash | Extracción OCR de medicamentos | ⚠️ API key bloqueada |
| pg_ai_query | SQL desde lenguaje natural | ✅ Instalado |

---

# Parte 2: Groq AI

## ¿Qué es Groq?

**Groq** es una empresa de infraestructura de IA que ofrece inferencia ultra-rápida mediante hardware especializado llamado **LPU (Language Processing Unit)**, diseñado específicamente para modelos de lenguaje.

### Diferenciador Clave
- **Velocidad:** Hasta 1,665 tokens/segundo (20x más rápido que otros proveedores)
- **Latencia:** Milisegundos vs segundos
- **Costo:** Hasta 89% más económico que alternativas

## Características Principales

### Hardware: LPU (Language Processing Unit)
- Chip diseñado específicamente para inferencia de IA (desde 2016)
- Ejecución determinística (latencia predecible)
- SRAM integrada (no caché) para máxima velocidad
- Enfriamiento por aire (menor costo operativo)

### Modelos Disponibles

| Modelo | Tipo | Contexto | Velocidad |
|--------|------|----------|-----------|
| llama-3.3-70b-versatile | Chat/Texto | 128k | 1,665 tok/s |
| llama-3.1-8b-instant | Chat rápido | 128k | Ultra-rápido |
| gemma2-9b-it | Chat | 8k | Rápido |
| whisper-large-v3 | Speech-to-Text | - | Tiempo real |
| whisper-large-v3-turbo | STT rápido | - | Ultra-rápido |
| playai-tts | Text-to-Speech | - | Tiempo real |

### API Compatible con OpenAI

```javascript
// Ejemplo de integración
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const completion = await groq.chat.completions.create({
  messages: [{ role: "user", content: "Extrae los medicamentos de este texto..." }],
  model: "llama-3.3-70b-versatile",
});
```

## Precios Groq (2025)

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) |
|--------|----------------------|------------------------|
| llama-3.3-70b-versatile | $0.59 | $0.79 |
| llama-3.3-70b-specdec | $0.59 | $0.99 |
| llama-3.1-8b-instant | $0.05 | $0.08 |
| whisper-large-v3 | $0.111/hora | - |

**Batch Processing:** 50% descuento para tareas no urgentes

### Comparación de Costos

| Proveedor | Costo promedio | Velocidad |
|-----------|----------------|-----------|
| OpenAI GPT-4 | $30/1M tokens | ~50 tok/s |
| Google Gemini | $3.50/1M tokens | ~100 tok/s |
| **Groq Llama 3.3** | **$0.59/1M tokens** | **1,665 tok/s** |

## Endpoints de API

```
Base URL: https://api.groq.com/openai/v1

POST /chat/completions     # Chat y texto
POST /audio/transcriptions # Speech-to-Text (Whisper)
POST /audio/translations   # Traducción de audio
POST /audio/speech         # Text-to-Speech
POST /embeddings           # Vectores semánticos
GET  /models               # Lista de modelos
```

## Ventajas para MedicalBot

1. **Velocidad:** Respuestas instantáneas al usuario de WhatsApp
2. **Costo:** 85% más económico que Gemini para procesamiento de texto
3. **Whisper integrado:** Transcripción de notas de voz
4. **TTS integrado:** Respuestas en audio
5. **API compatible:** Fácil migración desde OpenAI/Gemini

---

# Parte 3: Resemble AI Chatterbox

## ¿Qué es Chatterbox?

**Chatterbox** es una familia de modelos de Text-to-Speech (TTS) de código abierto desarrollados por Resemble AI, licenciados bajo MIT.

### Diferenciador Clave
- **Clonación de voz:** Con solo 5 segundos de audio de referencia
- **Control de emociones:** Ajusta intensidad expresiva
- **Open Source:** Uso gratuito, auto-hospedable
- **Watermarking:** Marca de agua neural imperceptible

## Variantes del Modelo

| Modelo | Parámetros | Características |
|--------|------------|-----------------|
| Chatterbox | 500M | Inglés, control de emociones, alta calidad |
| Chatterbox Multilingual | 500M | 23 idiomas, clonación zero-shot |
| Chatterbox Turbo | 350M | Ultra-rápido, tags paralingüísticos |

## Idiomas Soportados (Multilingual)

| Idioma | Código | Idioma | Código |
|--------|--------|--------|--------|
| Español | es | Inglés | en |
| Francés | fr | Alemán | de |
| Portugués | pt | Italiano | it |
| Japonés | ja | Chino | zh |
| Árabe | ar | Ruso | ru |
| Coreano | ko | Hindi | hi |

## Características Técnicas

### Control de Emociones
```python
# Rango de exaggeration: 0.25 (monótono) a 0.75 (muy expresivo)
wav = model.generate(text, exaggeration=0.6)
```

### Tags Paralingüísticos (Turbo)
```python
text = "Hola [laugh], ¿cómo estás? [cough] Perdona..."
wav = model.generate(text)
```
Tags disponibles: `[laugh]`, `[chuckle]`, `[cough]`, `[sigh]`, `[gasp]`

### Clonación de Voz
```python
# Solo necesita 5-10 segundos de audio de referencia
wav = model.generate(
    text="Tu texto aquí",
    audio_prompt_path="voz_referencia.wav"
)
```

## Instalación y Uso

### Python (Core)
```bash
pip install chatterbox-tts
```

```python
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

model = ChatterboxTTS.from_pretrained(device="cuda")
wav = model.generate("Hola, bienvenido a nuestra farmacia")
ta.save("saludo.wav", wav, model.sr)
```

### Node.js (via API Server)

**Opción 1: Resemble AI Cloud**
```bash
npm install @resemble/node
```

```javascript
const Resemble = require('@resemble/node');

Resemble.setApiKey(process.env.RESEMBLE_API_KEY);

const response = await Resemble.v2.clips.createSync({
  project_uuid: 'project-id',
  voice_uuid: 'voice-id',
  body: 'Hola, tu cotización está lista'
});
```

**Opción 2: Self-Hosted API**
```bash
# Servidor comunitario
git clone https://github.com/devnen/Chatterbox-TTS-Server
cd Chatterbox-TTS-Server
pip install -r requirements.txt
python server.py
```

```javascript
// Llamada desde Node.js
const response = await fetch('http://localhost:8000/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hola, tu cotización está lista',
    voice_path: 'voices/farmacia.wav'
  })
});
const audioBuffer = await response.arrayBuffer();
```

## Precios

| Opción | Costo |
|--------|-------|
| Self-hosted (Chatterbox) | **Gratis** (MIT License) |
| Resemble AI Cloud | Desde $0.006/segundo de audio |

## Requisitos de Hardware (Self-hosted)

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| GPU | 4GB VRAM | 8GB+ VRAM |
| RAM | 8GB | 16GB |
| Python | 3.11 | 3.11 |

---

# Parte 4: Integración con MedicalBot

## Caso de Uso 1: Groq como Reemplazo de Gemini

### Beneficios
- ✅ 85% más económico
- ✅ 10x más rápido
- ✅ API compatible con OpenAI
- ✅ Incluye Whisper para notas de voz

### Implementación Propuesta

```javascript
// src/services/groq.service.js
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const extraerMedicamentosConGroq = async (base64File, mimeType) => {
  const completion = await groq.chat.completions.create({
    messages: [{
      role: "user",
      content: [
        { type: "text", text: PROMPT_EXTRACCION_MEDICAMENTOS },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64File}` } }
      ]
    }],
    model: "llama-3.3-70b-versatile",
  });

  return JSON.parse(completion.choices[0].message.content);
};
```

### Archivos a Modificar
1. `src/services/groq.service.js` (nuevo)
2. `src/flows/cotizaciones.flow.js` (cambiar import)
3. `.env` (añadir GROQ_API_KEY)

## Caso de Uso 2: Notas de Voz con Whisper (Groq)

### Flujo Propuesto
```
Usuario envía nota de voz
    ↓
Baileys descarga audio
    ↓
Groq Whisper transcribe
    ↓
Bot procesa texto
    ↓
Responde con cotización
```

### Implementación

```javascript
// src/services/groq.service.js
const transcribirAudio = async (audioPath) => {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-large-v3-turbo",
    language: "es"
  });
  return transcription.text;
};
```

## Caso de Uso 3: Respuestas de Voz con Chatterbox

### Flujo Propuesto
```
Bot genera respuesta de texto
    ↓
Chatterbox convierte a audio
    ↓
Bot envía nota de voz al usuario
```

### Implementación

**Opción A: API Server Local**
```javascript
// src/services/tts.service.js
const generarAudio = async (texto) => {
  const response = await fetch('http://localhost:8000/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: texto,
      language: 'es',
      exaggeration: 0.5
    })
  });

  const audioBuffer = await response.arrayBuffer();
  const audioPath = `/tmp/respuesta_${Date.now()}.wav`;
  fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
  return audioPath;
};
```

**Opción B: Groq TTS (playai-tts)**
```javascript
const generarAudioGroq = async (texto) => {
  const audio = await groq.audio.speech.create({
    model: "playai-tts",
    voice: "alloy",
    input: texto
  });

  const buffer = Buffer.from(await audio.arrayBuffer());
  const audioPath = `/tmp/respuesta_${Date.now()}.mp3`;
  fs.writeFileSync(audioPath, buffer);
  return audioPath;
};
```

## Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                      MedicalBot v2                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WhatsApp (Baileys)                                         │
│       │                                                     │
│       ├─→ Texto ──────────→ Groq Llama 3.3                 │
│       │                         │                           │
│       │                         ↓                           │
│       │                    Procesar consulta                │
│       │                         │                           │
│       ├─→ Documento ─────→ Groq Vision ────→ Excel         │
│       │                                                     │
│       ├─→ Nota de Voz ───→ Groq Whisper ───→ Texto        │
│       │                                                     │
│       └─→ Respuesta ←────── Chatterbox TTS ←── Texto      │
│                                                             │
│  PostgreSQL + pg_ai_query                                   │
│       └─→ Consultas en lenguaje natural                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Comparación de Costos (Estimado Mensual)

| Servicio | Actual (Gemini) | Propuesto (Groq) | Ahorro |
|----------|-----------------|------------------|--------|
| Procesamiento texto | ~$50 | ~$7.50 | 85% |
| Transcripción audio | N/A | ~$5 | Nuevo |
| TTS | N/A | Gratis (self-hosted) | - |
| **Total** | **~$50** | **~$12.50** | **75%** |

---

# Parte 5: Plan de Implementación

## Fase 1: Integrar Groq (Prioridad Alta)
1. Crear cuenta en console.groq.com
2. Obtener API key
3. Crear `src/services/groq.service.js`
4. Migrar extracción de medicamentos de Gemini a Groq
5. Probar y validar

## Fase 2: Añadir Notas de Voz (Prioridad Media)
1. Añadir flow para EVENTS.VOICE
2. Integrar Groq Whisper para transcripción
3. Procesar texto transcrito con flujos existentes

## Fase 3: Respuestas de Audio (Prioridad Baja)
1. Desplegar Chatterbox TTS Server (Docker)
2. Crear servicio de generación de audio
3. Clonar voz personalizada para la farmacia
4. Integrar en respuestas del bot

---

# Fuentes

## Groq
- [Groq Official](https://groq.com/)
- [Groq Pricing](https://groq.com/pricing)
- [GroqCloud Console](https://console.groq.com/docs)
- [Groq LPU Architecture](https://groq.com/lpu-architecture)
- [Groq Llama 3.3 Benchmark](https://groq.com/blog/new-ai-inference-speed-benchmark-for-llama-3-3-70b-powered-by-groq)

## Resemble AI Chatterbox
- [Chatterbox Official](https://www.resemble.ai/chatterbox/)
- [GitHub - Chatterbox](https://github.com/resemble-ai/chatterbox)
- [GitHub - Node SDK](https://github.com/resemble-ai/resemble-node)
- [Hugging Face - Chatterbox](https://huggingface.co/ResembleAI/chatterbox)
- [Chatterbox TTS Server](https://github.com/devnen/Chatterbox-TTS-Server)
- [Chatterbox Turbo](https://www.resemble.ai/chatterbox-turbo/)
