# Parche de Soporte LID para @bot-whatsapp

## Problema

WhatsApp implemento en 2024 un nuevo sistema de identificadores llamado **LID (Local Identifier)** para proteger la privacidad de los usuarios. Esto causa que los mensajes lleguen con un identificador como `36816560328782@lid` en lugar del numero de telefono real como `573224685663@s.whatsapp.net`.

El provider de `@bot-whatsapp` no esta preparado para manejar LIDs, lo que causa:
- El bot no responde a los mensajes
- Los mensajes se envian a numeros incorrectos
- Errores de promesas no manejadas

## Solucion

Este parche modifica la funcion `baileyCleanNumber` en el provider de Baileys para:

1. **Detectar LIDs**: Identifica si un numero es un LID basandose en:
   - Si tiene el sufijo `@lid`
   - Si tiene 14 o mas digitos (los numeros de telefono normales tienen 10-13)

2. **Formatear correctamente**: Usa `@lid` en lugar de `@s.whatsapp.net` cuando es necesario

3. **Preservar remoteJid original**: Guarda el identificador original para el envio de mensajes

## Como aplicar el parche

### Opcion 1: Script automatico (recomendado)

```bash
node patches/apply-lid-fix.js
```

### Opcion 2: Manual

Si el script no funciona, puedes editar manualmente el archivo:

```
node_modules/@bot-whatsapp/provider/lib/baileys/index.cjs
```

Busca la funcion `baileyCleanNumber$1` y reemplazala con:

```javascript
const baileyCleanNumber$1 = (number, full = false) => {
    // Check if it's a LID format (either explicit @lid or by length)
    const hasLidSuffix = number.includes('@lid');
    const cleanNum = number.replace('@s.whatsapp.net', '').replace('@lid', '');

    // LIDs typically have 14+ digits, phone numbers have 10-13
    const isLid = hasLidSuffix || cleanNum.length >= 14;

    if (isLid) {
        // For LIDs, use @lid suffix
        number = !full ? `${cleanNum}@lid` : `${cleanNum}`;
    } else {
        // Original behavior for regular phone numbers
        number = !full ? `${cleanNum}@s.whatsapp.net` : `${cleanNum}`;
    }
    return number
};
```

## Cuando reaplicar el parche

Debes ejecutar el parche nuevamente despues de:

- Ejecutar `npm install`
- Ejecutar `npm update`
- Eliminar y reinstalar `node_modules`

### Automatizar con postinstall (opcional)

Agrega esto a tu `package.json`:

```json
{
  "scripts": {
    "postinstall": "node patches/apply-lid-fix.js"
  }
}
```

Esto aplicara el parche automaticamente despues de cada `npm install`.

## Verificar que el parche esta aplicado

Ejecuta:

```bash
grep -c "LIDs typically have 14+" node_modules/@bot-whatsapp/provider/lib/baileys/index.cjs
```

Si devuelve `1`, el parche esta aplicado. Si devuelve `0`, necesitas aplicarlo.

## Problemas conocidos

- **Numeros de telefono largos**: Si tienes usuarios con numeros de telefono de 14+ digitos (muy raro), podrian ser tratados como LIDs incorrectamente.

- **Versiones futuras**: Si `@bot-whatsapp` actualiza su provider con soporte nativo de LID, este parche podria causar conflictos. Verifica las notas de la version antes de actualizar.

## Referencias

- [Issue #1718 - Baileys LID Problem](https://github.com/WhiskeySockets/Baileys/issues/1718)
- [Baileys v7 Migration Guide](https://baileys.wiki/docs/migration/to-v7.0.0/)
- [WhatsApp LID Documentation](https://developers.facebook.com/docs/whatsapp/)
