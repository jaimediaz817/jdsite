# HU-028: Validación de tamaño de archivo en upload del editor

## Objetivo
Agregar validación de tamaño de archivo en el backend para devolver errores específicos al frontend cuando una imagen/video es rechazada por exceder el límite.

## Criterios de aceptación
- [x] Parámetro `MAX_UPLOAD_SIZE_MB` en `.env` y `settings.py`
- [x] `save_uploaded_file` retorna `{ success: false, error: "Archivo demasiado pesado (máximo: 10MB)" }`
- [x] Vista `upload_file_api` devuelve el error JSON con mensaje específico
- [x] Frontend muestra el mensaje de error en `image-selector.js` con toast profesional
- [x] Toast profesional en `dashboard_users.html` para acciones AJAX del superadmin

## Implementación completada

### Cambios realizados:
1. **backend/.env** - Agregado `MAX_UPLOAD_SIZE_MB=10`
2. **backend/jdsite/settings.py** - Agregado `MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))`
3. **backend/blog/services.py** - Función `save_uploaded_file` devuelve error detallado con el tamaño configurado
4. **backend/blog/views.py** - Vista `upload_file_api` maneja el error y lo pasa al frontend
5. **backend/blog/static/blog/js/blog_editor/image-selector.js** - Muestra el error específico en lugar de un mensaje genérico

### Comportamiento:
- Si el archivo excede 10MB, el backend devuelve `{"success": false, "error": "Archivo demasiado pesado (máximo: 10MB)"}`
- El frontend muestra un `alert` con el mensaje recibido
- El valor es configurable mediante variable de entorno `.env`

## Estado
- Estado: **✅ Implementado**