# HU-034: Competencias Calistenia con QR

## Objetivo
Crear un sistema especializado para competencias de calistenia con QR únicos por ubicación, permitiendo a atletas subir videos como evidencia y registrar récords.

## Criterios de aceptación
- ✅ Cada ubicación (cancha/barril) tiene su artículo con URL única
- ✅ El QR apunta directamente al artículo de la competencia
- ✅ Los atletas deben estar registrados e iniciar sesión para subir videos como evidencia
- ✅ Se registra el récord actual por tipo de prueba (peso, repeticiones, tiempo)
- ✅ Los organizadores pueden aprobar/borrar evidencias desde el dashboard
- ✅ NUEVO: Los récords rechazados siguen siendo visibles para el organizador
- ✅ Logo del centro en QR: fondo negro circular para logos blancos con transparencia
- ✅ Icono QR en blog_list: indica artículos con QR asociado activo
- ✅ Vista previa QR en detalle: modal con QR de 250px al hacer click en icono
- ✅ Permisos QR: authors normales no pueden modificar, solo superadmin sí

## Pasos de implementación

### Fase 1: Extensión del modelo BlogPost
- Agregar campo `location` (CharField, max_length=200) - nombre de la cancha/barril
- Agregar campo `latitude` (DecimalField, null=True, blank=True) - coordenadas GPS
- Agregar campo `longitude` (DecimalField, null=True, blank=True) - coordenadas GPS
- Agregar campo `competition_record` (JSONField, null=True, blank=True) - récord actual
- Agregar campo `competition_type` (CharField con choices) - tipo de prueba:
  - `pull_up` - dominadas
  - `dip` - fondos
  - `muscle_up` - muscle up
  - `handstand` - handstand
  - `planche` - planche
  - `custom` - personalizado

### Fase 2: Template especializado
- Crear `blog/templates/blog/competition_detail.html`
- Mostrar mapa (openstreetmap embebido) si hay coordenadas GPS
- Mostrar récord actual destacado
- Galería de videos subidos como evidencia
- Formulario para subir evidencia (requiere login previo)
- Botón/icono QR visible a usuarios autenticados (250px en modal)

### Fase 3: Editor de competencias
- Nueva pestaña en el editor: "Competencia"
- Campos: Ubicación, coordenadas, tipo de prueba, récord actual
- Instrucciones para generar QR (enlace al artículo)
- **Permisos**: Solo superadmin ve/puede modificar QR (no authors normales)

### Fase 4: API y lógica de negocio
- Endpoint para subir evidencia (requiere autenticación)
- Validación de récord (debe superar récord actual para aprobarse)
- Endpoint para listar competencias por ubicación
- Badge visual en blog_list para competencias (diferenciar de artículos normales)

### Fase 5: QR integrado
- El sistema HU-029 (QR) funciona con competencias
- QR apunta a `/blog/<slug>/` como cualquier artículo
- El template se encarga de mostrar la UI de competencia
- **Icono QR en blog_list.html**: muestra `fa-qrcode` en card si tiene QR asociado
- Al hacer click en el icono → modal con QR preview (250px)

## Flujo de usuario
1. Organizador crea artículo "Competencia Calistenia - Cancha Cruz Roja Calarcá"
2. Define ubicación: "Cancha Cruz Roja, Calarcá"
3. Define tipo: "Dominadas" y récord inicial (ej: 20 repeticiones)
4. Publica el artículo → se genera QR automáticamente
5. Pega el QR en la cancha
6. Atleta escanea QR → ve el artículo de competencia
7. Atleta inicia sesión y sube video → se guarda como evidencia pendiente
8. Organizador aprueba desde dashboard → actualiza récord automáticamente
9. Atleta ve su récord publicado si superó el récord actual

## Notas técnicas
- Usar el mismo sistema de archivos multimedia existente
- Las evidencias guardan la relación con el usuario autenticado que subió el video
- El feed RSS puede filtrarse por categoría "competencias"
- Los récords aprobados envían notificación por email (si está configurado)
- **Logo centro QR**: Detectar si es blanco con transparencia → agregar círculo negro de fondo (15% padding)
- **Icono en blog_list**: `<i class="fas fa-qrcode"></i>` posicionado en card, solo visible si `post.has_active_qr`

## Integración con HU-029 (Sistema QR existente)
- Reusar lógica `qr_generator.py` existente
- El logo `logo_mark_to_post_dark_single.png` se procesa con filtro de detección de color
- Si el logo tiene fondo blanco/transparente: agregar círculo negro (#1a1a1a) como fondo
- Tamaño QR estándar: 250px en detalle, 300px en descarga
- Endpoint público `/qr/<slug>/` redirige al artículo de competencia
- Permisos: solo `is_superuser` puede crear/editar QR, no `is_staff` ni authors

## Permisos y Roles
| Acción                    | Superadmin       | Author | Usuario Anónimo       |
| ------------------------- | ---------------- | ------ | --------------------- |
| Ver icono QR en blog_list | ✅                | ✅      | ❌                     |
| Ver QR preview (250px)    | ✅                | ✅      | ❌                     |
| Descargar QR              | ✅                | ❌      | ❌                     |
| Crear QR                  | ✅                | ❌      | ❌                     |
| Editar QR                 | ✅                | ❌      | ❌                     |
| Eliminar QR               | ✅                | ❌      | ❌                     |
| Subir video evidencia     | ✅                | ✅      | ❌ (requiere registro) |
| Aprobar evidencias        | Solo organizador | ❌      | ❌                     |