# HU-038: Desvinculación automática de QR al eliminar un artículo

## 📋 ID y Título
- **ID:** HU-038
- **Título:** Desvinculación automática de QR al eliminar un artículo del dashboard

## 🎯 Objetivo
Al eliminar un artículo permanentemente desde el dashboard de moderación, si el artículo tiene un QR asociado, se debe desvincular automáticamente (sin eliminar el QR) para que quede disponible y pueda ser reasignado a otro artículo posteriormente. Además, tras la eliminación, se ofrecen opciones para gestionar el QR liberado.

## ✅ Criterios de Aceptación

1. **Confirmación con advertencia:** Cuando el usuario haga clic en "Eliminar" en un artículo que tiene QR asociado, el modal de confirmación debe mostrar un mensaje de advertencia indicando que el QR será desvinculado.

2. **Desvinculación automática:** Al confirmar la eliminación, el sistema debe:
   - Eliminar el artículo de la base de datos
   - Desvincular el QR (poner `blog_post=NULL` y `is_active=True`)
   - NO eliminar el archivo de imagen del QR
   - Devolver un mensaje al frontend indicando tanto la eliminación como la desvinculación
   - Incluir en el JSON el `slug` y `name` del QR desvinculado (`qr_unlinked`)

3. **Actualización de estadísticas:** Los contadores del dashboard (Total, Publicados, etc.) deben actualizarse correctamente después de la operación.

4. **Mensaje informativo + Opciones de gestión:** El toast de éxito debe mostrar la eliminación del artículo y la desvinculación del QR. Inmediatamente después, si hay QR liberado, se debe mostrar un modal ofreciendo:
   - "Ir a gestionar QRs" (redirige a `/blog/dashboard/qr/`)
   - "Cerrar" (cierra el modal)

## 📝 Pasos de Implementación

### Fase1: Backend (Python)
- [x] Modificar `delete_blog_view` en `views.py` para desvincular QR antes de eliminar el artículo
- [x] Actualizar el mensaje de respuesta JSON para incluir información de la desvinculación
- [x] Actualizar los stats después de ambas operaciones
- [x] Retornar `qr_unlinked` (slug + name) en el JSON de éxito

### Fase2: Frontend - Advertencia (HTML/JS)
- [x] Modificar template `dashboard.html` para:
  - Agregar `data-qr-name` al botón de eliminar (con `{% with qr_code=post.qr_codes.first %}`)
  - Agregar div de advertencia en el modal de confirmación
- [x] Modificar `dashboard.js` función `confirmDelete()` para:
  - Leer `data-qr-name` del botón
  - Mostrar/ocultar la advertencia según corresponda

### Fase3: Frontend - Modal de opciones QR liberado
- [x] Template `dashboard.html`: agregar modal `qrOptionsModal` con enlace a `dashboard_qr` y botón cerrar (Bootstrap 4: clase `.close`, sin `data-bs-dismiss`)
- [x] `dashboard.js`: función `openQrOptionsModal(qrData)` que muestra el modal con el nombre del QR
- [x] `executeDelete()`: al recibir `d.qr_unlinked` con slug, llamar `openQrOptionsModal()`
- [x] Cierre manual del modal vía JS (backdrop y botón)

### Fase4: Documentación
- [x] Crear esta HU para documentar el cambio
- [x] Verificar que el código sigue las reglas del proyecto (sin dependencias nuevas, aditivo)

## 🔄 Flujo de Usuario

1. Usuario (superadmin) hace clic en botón de eliminar de un artículo
2. Si el artículo tiene QR asociado:
   - El modal muestra el mensaje de advertencia con el nombre del QR
3. Usuario confirma eliminación
4. Backend:
   - Desvincula el QR (blog_post=NULL, is_active=True)
   - Elimina el artículo permanentemente
   - Retorna JSON con mensaje completo + `qr_unlinked` (slug, name)
5. Frontend:
   - Muestra toast con mensaje de éxito incluyendo info del QR
   - Actualiza estadísticas del dashboard
   - Elimina la fila de la tabla
   - Muestra modal `qrOptionsModal` con opciones de gestión del QR liberado

## 🎨 Diseño UI/UX

### Modal de confirmación (cuando hay QR)
```
¿Eliminar permanentemente este artículo?
[Nombre del artículo]

⚠️ ADVERTENCIA (fondo amarillo):
QR asociado: Este artículo tiene un QR vinculado.
Al eliminar el artículo, el QR [NOMBRE] se desvinculará 
y quedará disponible para reasignarlo a otro artículo. 
El QR no se eliminará.
```

### Modal de opciones QR liberado (HU-038 ampliada)
```
🔳 QR liberado
El artículo fue eliminado y el QR [NOMBRE] quedó disponible.
Puedes asociarlo a otro artículo o gestionarlo desde el panel de QRs.

[ 🔳 Ir a gestionar QRs ]   <- enlace a /blog/dashboard/qr/
[ ✕ Cerrar ]               <- cierra el modal
```

### Botón Eliminar (atributos data-*)
```html
<button 
  data-post-id="123" 
  data-post-slug="mi-articulo" 
  data-post-title="Mi Artículo"
  data-qr-name="Calistenia - Cancha"
  onclick="confirmDelete(this)"
>
```

## 📊 Modelo de Datos Afectado

### QRCode (models.py)
- `blog_post`: Se setea a `NULL`
- `is_active`: Se setea a `True`
- No se elimina el registro ni la imagen

### BlogPost (models.py)
- Se elimina completamente (incluyendo carpetas físicas)

## 🧪 Pruebas

### Caso 1: Artículo SIN QR
1. Eliminar artículo sin QR asociado
2. Verificar que no se muestra advertencia
3. Verificar que el artículo se elimina correctamente
4. Verificar que el mensaje de éxito es el normal
5. Verificar que NO aparece el modal de opciones QR

### Caso 2: Artículo CON QR
1. Eliminar artículo con QR asociado
2. Verificar que se muestra la advertencia con el nombre del QR
3. Verificar que el artículo se elimina correctamente
4. Verificar que el QR queda con `blog_post=NULL` e `is_active=True`
5. Verificar que el mensaje de éxito menciona la desvinculación
6. Verificar que aparece el modal `qrOptionsModal` con el nombre del QR
7. Verificar que el enlace "Ir a gestionar QRs" funciona
8. Verificar que el QR puede ser reasignado desde el dashboard de QRs

### Caso 3: Múltiples QRs (edge case)
- Si un artículo tuviera múltiples QRs (no debería pasar por validaciones), se desvincula el primero encontrado

## 🚀 Beneficios
- Mejor UX: El usuario sabe exactamente qué pasará con el QR
- Reutilización: El QR generado no se pierde y puede usarse para otro artículo
- Eficiencia: No hay necesidad de regenerar QRs, solo reasignarlos
- Control inmediato: Tras eliminar, se ofrecen opciones para gestionar el QR liberado

## 📌 Notas Adicionales
- Esta funcionalidad está alineada con la filosofía del proyecto de no eliminar información valiosa
- El QR liberado aparecerá en la lista de QRs disponibles del dashboard QR
- No requiere migraciones de base de datos
- No introduce dependencias nuevas
- El modal de opciones usa Bootstrap 4 (clase `.close`, sin `data-bs-dismiss`) por compatibilidad con jQuery 3.2.1