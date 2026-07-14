# HU-042: Manejo de error 413 en upload de imágenes

## Objetivo
Manejar adecuadamente el error 413 (Request Entity Too Large) al subir imágenes grandes, mostrando un mensaje amigable al usuario y ajustando la configuración de la VPS para aceptar archivos de mayor tamaño.

## Problema Actual
- Al subir imágenes pesadas desde móvil/web, nginx devuelve error 413
- No hay manejo de este error en el frontend
- El usuario ve una página HTML cruda de nginx

## Criterios de Aceptación
1. Configurar nginx para aceptar imágenes de hasta 10MB
2. Configurar Django para aceptar archivos de hasta 10MB
3. Capturar el error 413 en el frontend y mostrar toast personalizado
4. El mensaje debe ser amigable e indicar el límite de tamaño

## Pasos de Implementación
1. Ajustar configuración de nginx (client_max_body_size)
2. Ajustar configuración de Django (DATA_UPLOAD_MAX_MEMORY_SIZE)
3. Modificar el manejo de errores en blog_editor/index.js (FilePond)
4. Mostrar toast personalizado usando toast-utils.js
5. Probar con imagen de 5-10MB
6. Verificar logs de nginx para diagnosticar

## Estado
✅ Completado

## Cambios Realizados

### Fase 1: Backend (settings.py)
- Aumentado `MAX_UPLOAD_SIZE_MB` de 10 a **20MB**
- Aumentado `DATA_UPLOAD_MAX_MEMORY_SIZE` de 10MB a **20MB**

### Fase 2: Backend (views.py - upload_file_api)
- Agregada validación de tamaño ANTES de procesar el archivo
- Si el archivo supera 20MB → responde con status **413** y mensaje JSON claro
- Mensaje informa el tamaño actual y el límite

### Fase 3: Frontend (index.js - FilePond)
- Agregado `maxFileSize: '20MB'` en la creación de FilePond (pre-validación cliente)
- Agregado `maxTotalFileSize: '20MB'`
- Listener `FilePond:error` que captura statusCode 413 y muestra toast con `showBlogToast()`
- Toast con título 📸 Imagen demasiado grande y mensaje en español

### Fase 4: Infraestructura (nginx)
- Aumentado `client_max_body_size` de 10m a **20m** en ambos bloques server (HTTP + HTTPS)

### Fase 5: Scripts VPS
- Actualizado `aplicar_fix_413.sh` para forzar `20m` en vez de `10m`
- `diagnostico_error_413.sh` listo para ejecutar en VPS

### Flujo completo del fix:
1. FilePond rechaza archivos >20MB antes de enviar (pre-validación)
2. Si pasa, nginx acepta hasta 20MB (config)
3. Django valúa tamaño y responde 413 si excede
4. FilePond captura el 413 y llama a `showBlogToast()` → toast amigable al usuario
5. El usuario ve un toast con el mensaje y sabe que debe comprimir la imagen
