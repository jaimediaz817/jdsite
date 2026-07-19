# Diagnóstico: Comentario muestra "Anónimo" incorrectamente

## Problema Reportado
Cuando un usuario autenticado como superadmin hace un comentario, el nombre se muestra correctamente (ej: "jdiaz") pero el badge muestra "Anónimo" en lugar de "Registrado" o "Identificado".

## Causa Raíz
El campo `identification_level` NO se está enviando desde el formulario del template cuando el usuario está autenticado.

### Flujo Actual (Roto):
1. **Template** (`blog_detail.html` líneas 510-511): El campo `name` se envía como hidden, pero `identification_level` falta
2. **Vista** (`views.py` línea 1200): Obtiene `identification_level` del POST con valor por defecto `"anonymous"`
3. **Servicio** (`services.py` líneas 77-87): Solo detecta `is_admin` por dominio de email, pero `identification_level` ya queda seteado como "anonymous"

## Solución
### Archivo 1: `backend/blog/templates/blog/blog_detail.html`
- Agregar campos hidden `identification_level`, `provider` y `provider_uid` para usuarios autenticados
- Usar `user.socialaccount_set.first()` para detectar si el usuario tiene OAuth (Google/GitHub)

### Archivo 2: `backend/blog/services.py`
- Mejorar la detección automática de `identification_level` basado en los parámetros de entrada

## Estado
- [x] Diagnóstico completado
- [ ] Implementar arreglo en template
- [ ] Implementar arreglo en servicio (opcional, backup)
- [ ] Verificar funcionamiento