# Resemble AI Chatterbox - Análisis Completo

## Documento para: MedicalBot (Bot WhatsApp Farmacéutico)

---

## ¿Qué es Chatterbox?

**Chatterbox** es un sistema de Text-to-Speech (TTS) de código abierto desarrollado por Resemble AI que convierte texto en voz humana realista.

### Diferenciadores Clave

| Característica | Descripción |
|----------------|-------------|
| **Clonación de voz** | Replica cualquier voz con solo 5 segundos de muestra |
| **Control emocional** | Ajusta qué tan expresiva suena la voz |
| **Open Source** | Gratuito, licencia MIT, auto-hospedable |
| **Calidad** | Preferido 63.75% sobre ElevenLabs en pruebas ciegas |
| **Marca de agua** | Incluye watermark neural imperceptible |

---

## Variantes Disponibles

| Modelo | Idiomas | Uso Recomendado |
|--------|---------|-----------------|
| **Chatterbox** | Solo inglés | Máxima calidad en inglés |
| **Chatterbox Multilingual** | 23 idiomas (incluye español) | **Recomendado para MedicalBot** |
| **Chatterbox Turbo** | Solo inglés | Velocidad máxima |

### Idiomas Soportados en Multilingual

Español, inglés, francés, alemán, portugués, italiano, japonés, chino, árabe, ruso, coreano, hindi, holandés, polaco, sueco, noruego, finlandés, danés, griego, hebreo, turco, malayo, swahili.

---

## ¿Cómo Funciona?

### Proceso de Generación de Audio

```
ENTRADA                    PROCESO                     SALIDA
─────────────────────────────────────────────────────────────────
Texto en español    →    Modelo Chatterbox    →    Archivo de audio
      +                  (servidor Python)           (.wav/.mp3)
Voz de referencia
(opcional)
```

### Arquitectura para MedicalBot

```
┌──────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA COMPLETA                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   SERVIDOR 1: Bot WhatsApp (Node.js)                        │
│   ────────────────────────────────────                      │
│   • Recibe mensajes del usuario                             │
│   • Procesa la lógica del bot                               │
│   • Envía texto al servidor TTS                             │
│   • Recibe audio y lo envía al usuario                      │
│                                                              │
│                         ↕ HTTP                               │
│                                                              │
│   SERVIDOR 2: Chatterbox TTS (Python + GPU)                 │
│   ────────────────────────────────────────                  │
│   • Recibe texto vía API                                    │
│   • Genera audio con el modelo                              │
│   • Devuelve archivo de audio                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Importante:** Chatterbox es un modelo de Python que requiere GPU. Tu bot de Node.js se comunica con él mediante HTTP.

---

## Compatibilidad con @bot-whatsapp

### ¿Se Puede Responder con Audio en Español?

**SÍ.** La integración es completamente posible:

| Funcionalidad | ¿Soportado? | Cómo |
|---------------|-------------|------|
| Enviar notas de voz | ✅ Sí | El provider Baileys tiene método sendAudio |
| Recibir notas de voz | ✅ Sí | Evento VOICE_NOTE detecta cuando el usuario envía audio |
| Descargar audio del usuario | ✅ Sí | Función downloadMediaMessage de Baileys |
| Español | ✅ Sí | Chatterbox Multilingual soporta español nativo |

---

## Flujos de Audio

### Flujo 1: Responder al Usuario con Audio

```
Usuario escribe mensaje
        ↓
Bot genera respuesta de texto
        ↓
Bot envía texto al servidor Chatterbox
        ↓
Chatterbox genera archivo de audio
        ↓
Bot recibe el archivo
        ↓
Bot envía nota de voz al usuario (ptt: true)
        ↓
Usuario recibe y escucha la nota de voz
```

### Flujo 2: Recibir Nota de Voz del Usuario

```
Usuario envía nota de voz
        ↓
Bot detecta evento VOICE_NOTE
        ↓
Bot descarga el archivo de audio (.ogg)
        ↓
OPCIÓN A: Enviar a Groq Whisper para transcribir a texto
OPCIÓN B: Guardar para clonación de voz
```

### Flujo 3: Clonar la Voz del Usuario

```
Usuario quiere clonar su voz
        ↓
Bot pide que envíe nota de voz (5-10 segundos)
        ↓
Usuario envía nota de voz
        ↓
Bot descarga y guarda el audio como referencia
        ↓
Ahora Chatterbox puede generar audio con ESA voz
```

---

## Clonación de Voz

### ¿Qué es?

La clonación de voz permite que Chatterbox genere audio que suene como una persona específica, usando solo una pequeña muestra de su voz.

### Requisitos del Audio de Referencia

| Requisito | Especificación |
|-----------|----------------|
| **Duración** | Mínimo 5 segundos, ideal 10-30 segundos |
| **Calidad** | Sin ruido de fondo, sin eco |
| **Contenido** | Voz clara hablando naturalmente |
| **Formato** | WAV, MP3 u OGG |
| **Restricciones** | Sin música, sin otras voces |

### ¿Cómo Implementarlo en MedicalBot?

1. **Crear carpeta voices/** en el proyecto para almacenar audios de referencia
2. **Para voz de la farmacia:** Grabar un audio de 10-30 segundos con el tono profesional deseado
3. **Para voz del usuario:** Capturar nota de voz cuando el usuario lo solicite mediante el evento VOICE_NOTE

### Proceso de Clonación

```
Audio de referencia (5-10 seg)
        ↓
Chatterbox analiza características:
  • Timbre
  • Tono
  • Ritmo
  • Acento
        ↓
Genera nuevo audio con CUALQUIER texto
usando esas características
```

---

## Requisitos de Hardware

### Para el Servidor Chatterbox (Python)

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **GPU** | NVIDIA con 4GB VRAM | NVIDIA con 8GB+ VRAM |
| **RAM** | 8GB | 16GB |
| **Python** | 3.10 | 3.11 |
| **CUDA** | 11.8+ | 12.0+ |
| **Sistema** | Linux | Debian 11+ |

**Sin GPU:** Funciona pero es aproximadamente 10 veces más lento.

### GPUs Compatibles (Ejemplos)

| GPU | VRAM | ¿Funciona? |
|-----|------|------------|
| GTX 1660 | 6GB | ✅ Sí (mínimo) |
| RTX 3060 | 12GB | ✅ Sí (bueno) |
| RTX 3080 | 10GB | ✅ Sí (recomendado) |
| RTX 4090 | 24GB | ✅ Sí (óptimo) |

---

## Opciones de Despliegue

### Opción 1: Servidor Propio con GPU

| Aspecto | Detalle |
|---------|---------|
| **Costo** | Solo electricidad |
| **Requisito** | Tener computador con GPU NVIDIA |
| **Ventaja** | Sin costos recurrentes, privacidad total |
| **Desventaja** | Requiere hardware específico |

### Opción 2: GPU en la Nube

| Proveedor | GPU | Precio/hora |
|-----------|-----|-------------|
| RunPod | RTX 3090 | ~$0.44 |
| Vast.ai | RTX 3080 | ~$0.30 |
| Lambda Labs | A10 | ~$0.60 |

**Ventaja:** No necesitas hardware propio
**Desventaja:** Costo por hora de uso

### Opción 3: Resemble AI Cloud (Sin GPU propia)

| Plan | Precio | Caracteres/mes |
|------|--------|----------------|
| Free | $0 | 100 |
| Creator | $29/mes | 100,000 |
| Pro | $99/mes | 500,000 |

**Ventaja:** No necesitas servidor ni GPU
**Desventaja:** Costo mensual, dependencia de terceros

---

## Comparación de Costos

### TTS Self-Hosted vs Cloud

| Servicio | Costo por 1000 caracteres | Clonación de voz | Open Source |
|----------|---------------------------|------------------|-------------|
| **Chatterbox (self-hosted)** | **$0** | ✅ Sí | ✅ Sí |
| ElevenLabs | $0.30 | ✅ Sí | ❌ No |
| Google TTS | $0.016 | ❌ No | ❌ No |
| Amazon Polly | $0.004 | ❌ No | ❌ No |

---

## Control de Expresividad

Chatterbox permite ajustar qué tan emocional o expresiva suena la voz:

| Nivel | Efecto | Uso Recomendado |
|-------|--------|-----------------|
| 0.25 | Monótono, robótico | Nunca |
| 0.35 | Profesional, neutral | Información formal |
| 0.50 | Natural, conversacional | **Uso general** |
| 0.65 | Expresivo, amigable | Saludos, buenas noticias |
| 0.75 | Dramático, enfático | Ocasiones especiales |

---

## Integración: Lo Que Se Necesita

### Componentes Requeridos

1. **Servidor Python con GPU** corriendo Chatterbox
2. **API HTTP** (FastAPI o similar) que exponga el servicio
3. **Carpeta voices/** para almacenar audios de referencia
4. **Variable de entorno** con la URL del servidor TTS

### Comunicación Bot ↔ Chatterbox

```
Bot Node.js                          Servidor Chatterbox
─────────────                        ──────────────────
                   POST /tts
     ─────────────────────────────→
     {
       text: "Hola, tu cotización...",
       language: "es",
       voice_path: "voices/farmacia.wav"
     }

                   Archivo .wav
     ←─────────────────────────────
```

---

## Casos de Uso en MedicalBot

### 1. Confirmación de Cotización (Audio)

El bot genera la cotización y además de enviar el Excel, envía una nota de voz diciendo:
*"Hola María, tu cotización está lista. El total es de 250.000 pesos."*

### 2. Información de Medicamentos (Audio)

Cuando el usuario pregunta por un medicamento, el bot puede responder con audio:
*"El Ibuprofeno de 400 miligramos tiene un precio de 18.500 pesos. Tenemos 80 unidades disponibles."*

### 3. Voz Personalizada de la Farmacia

Grabar 10-30 segundos de la voz del dueño o empleado de la farmacia, y usar esa voz para TODAS las respuestas del bot.

### 4. Accesibilidad

Usuarios que prefieren escuchar en lugar de leer pueden recibir respuestas en audio.

---

## Limitaciones

| Limitación | Detalle |
|------------|---------|
| **Requiere GPU** | No funciona bien sin tarjeta gráfica NVIDIA |
| **Servidor separado** | Chatterbox es Python, el bot es Node.js |
| **Latencia** | Generar audio toma 1-3 segundos |
| **Modelo Turbo** | Solo soporta inglés (para español usar Multilingual) |

---

## Resumen Ejecutivo

### ¿Es viable para MedicalBot?

**SÍ**, si se cumple UNA de estas condiciones:
- Tienes un servidor con GPU NVIDIA (4GB+ VRAM)
- Puedes pagar GPU en la nube (~$0.30-0.60/hora)
- Puedes pagar Resemble AI Cloud (~$29-99/mes)

### ¿Qué se necesita implementar?

1. Desplegar servidor Chatterbox (Python + GPU)
2. Crear servicio en el bot que llame al servidor
3. Usar sendAudio de Baileys para enviar notas de voz
4. Opcionalmente, implementar clonación de voz

### Beneficios

- Voz personalizada de la farmacia
- Español nativo bien pronunciado
- Sin costo recurrente (self-hosted)
- Mejor experiencia de usuario

---

## Fuentes

- [Chatterbox Official](https://www.resemble.ai/chatterbox/)
- [GitHub - Chatterbox](https://github.com/resemble-ai/chatterbox)
- [Hugging Face - Multilingual](https://huggingface.co/ResembleAI/chatterbox-multilingual)
- [Chatterbox Demo](https://huggingface.co/spaces/ResembleAI/Chatterbox)
- [Resemble AI Docs](https://docs.resemble.ai/)
