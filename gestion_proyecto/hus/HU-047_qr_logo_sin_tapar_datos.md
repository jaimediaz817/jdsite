# HU-047: QR con logo integrado sin tapar datos escaneables

## Problema / Contexto
Los QR del dashboard se generan con un logo MTP pegado encima del centro, pero sin limpiar previamente esa zona. Esto puede degradar la legibilidad porque el logo tapa datos del QR sin estar integrado en el esquema de corrección de errores. Además, el borde exterior del círculo negro ocupa espacio visual considerable.

## Objetivo
Garantizar que los QR generados para artículos del blog mantengan legibilidad real incluso con el logo MTP embebido, evitando que el logo tape datos sin propósito de diseño.

## Criterios de aceptación
1. **Logo siempre centrado** en el QR, con proporción máxima del 18% del tamaño del QR.
2. **Zona central del QR es realmente vacía** antes de insertar el logo, no solo cubierta con negro opaco.
3. **QR escaneable** con al menos 3 lectores distintos (móvil iOS, móvil Android, desktop).
4. **Contraste suficiente** entre logo/fondo circular y QR para que el logo sea legible.
5. **No se modifica la API existente** (`generate_qr_with_logo`) ni los templates; el cambio es interno en `backend/blog/utils/qr_generator.py`.
6. **Tests visuales**: al menos 5 QR generados con longitudes de URL variadas (corta, media, larga) deben escanear correctamente.

## Pasos de implementación
1. Revisar `_add_logo()` actual y confirmar que pinta encima sin limpiar.
2. Cambiar la estrategia: generar el QR, luego limpiar una zona circular blanca en el centro, luego pegar el fondo circular oscuro y el logo.
3. Ajustar tamaños: `LOGO_SIZE_RATIO`, `LOGO_PADDING` y el diámetro del círculo blanco para que no sean agresivos pero sí efectivos.
4. Regenerar QR de prueba y validar escaneo manual.

## Estado
Completada
