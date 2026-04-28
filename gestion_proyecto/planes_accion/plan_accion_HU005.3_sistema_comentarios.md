# 🚀 PLAN DE ACCIÓN: HU-005.3 Sistema de Comentarios Blog
> ✅ Generado automaticamente desde HU oficial
> Fecha: 27/04/2026
> Cumplimiento: ✅ Reglas Cline 100%

---

## 📋 PRINCIPIOS DE EJECUCIÓN
✅ Una fase a la vez
✅ Cada fase < 15 minutos de trabajo
✅ Se prueba y confirma cada fase antes de pasar a la siguiente
✅ NUNCA se rompe lo existente
✅ Todo es aditivo
✅ Cero dependencias nuevas

---

## 🗓️ FASES DE IMPLEMENTACIÓN

| Fase     | Descripcion                                                         | Tiempo estimado | Estado      |
| -------- | ------------------------------------------------------------------- | --------------- | ----------- |
| 🔹 FASE 1 | Crear modelo BlogComment + migración con índices correctos          | 8 min           | ⏳ Pendiente |
| 🔹 FASE 2 | Integración completa en Django Admin con filtros y acciones masivas | 6 min           | ⏳ Pendiente |
| 🔹 FASE 3 | Servicio interno puro con logica de negocio, sin dependencias       | 12 min          | ⏳ Pendiente |
| 🔹 FASE 4 | Formulario Django nativo + validaciones + sanitización              | 10 min          | ⏳ Pendiente |
| 🔹 FASE 5 | Endpoints POST + integración con Rate Limit existente               | 8 min           | ⏳ Pendiente |
| 🔹 FASE 6 | UI: Mostrar comentarios + respuestas indentadas + formulario        | 12 min          | ⏳ Pendiente |
| 🔹 FASE 7 | Protecciones anti spam + honeypot + limite de caracteres            | 8 min           | ⏳ Pendiente |
| 🔹 FASE 8 | Notificaciones por email al administrador                           | 6 min           | ⏳ Pendiente |
| 🔹 FASE 9 | Testeo de todos los casos borde + verificación SEO                  | 10 min          | ⏳ Pendiente |

---

## 🛠️ DETALLES DE CADA FASE

---

### 🔹 FASE 1: Modelo y Migración
**Objetivo:** Estructura de datos correcta y optimizada
- Modelo `BlogComment` en app `blog`
- Campos:
  - `blog_slug` (CharField 200, db_index=True)
  - `parent` (ForeignKey 'self', null=True, blank=True, on_delete=models.CASCADE)
  - `name` (CharField 80)
  - `email` (EmailField 150, null=True, blank=True)
  - `content` (TextField max_length=1000)
  - `ip_address` (CharField 45)
  - `status` (CharField 20, choices: pending, approved, rejected, default='pending')
  - `created_at` (DateTimeField auto_now_add=True)
  - `updated_at` (DateTimeField auto_now=True)
- **Índices compuestos OBLIGATORIOS:**
  - `(blog_slug, status, created_at)`
  - `(parent_id)`
  - `(ip_address, created_at)`
- Migración autogenerada
- No modificar ningún otro modelo existente

---

### 🔹 FASE 2: Integración Django Admin
**Objetivo:** Panel de moderación completo
- Registrar modelo en admin.py
- Filtros: `status`, `created_at`, `blog_slug`
- Búsqueda: `name`, `email`, `content`
- Acciones masivas: Aprobar, Rechazar
- Campos de solo lectura: `ip_address`, `created_at`
- Ordenamiento por `created_at` descendente

---

### 🔹 FASE 3: Servicios y Lógica de Negocio
**Objetivo:** Todo el core en funciones puras sin dependencias
```python
create_comment(blog_slug, name, email, content, ip_address, parent_id=None)
get_approved_comments(blog_slug)
get_comment_count(blog_slug)
```
- Sanitización de todo el contenido
- Validación de limite de caracteres
- Control de Rate Limit
- 100% testeable unitariamente
- Sin side effects

---

### 🔹 FASE 4: Formulario y Validaciones
**Objetivo:** Formulario nativo Django
- Campos: `name`, `email`, `content`, `parent_id` (oculto)
- Validaciones:
  - name: requerido, min 2 caracteres, max 80
  - email: opcional, formato valido si se ingresa
  - content: requerido, min 10 caracteres, max 1000
- Sanitización automatica de todo input
- Proteccion CSRF

---

### 🔹 FASE 5: Endpoints y Rate Limit
**Objetivo:** Integración con sistema existente
- POST `/api/blog/<slug>/comments/`
- Reutilizar el mismo middleware Rate Limit existente
- Limite: 3 peticiones cada 10 minutos por IP
- Respuesta JSON simple
- No se requiere autenticación

---

### 🔹 FASE 6: Interfaz de Usuario
**Objetivo:** UI responsive y SEO Friendly
- Mostrar comentarios aprobados ordenados por fecha
- Respuestas indentadas
- Formulario en la parte superior
- Botón responder en cada comentario
- Todo renderizado en SERVIDOR para SEO
- Responsivo mobile
- Sin dependencias javascript
- Integracion despues de las reacciones en blog_detail.html

---

### 🔹 FASE 7: Protecciones Anti Spam
**Objetivo:** Minimizar bots y spam
- Honeypot field oculto
- Sanitizar y escapar TODO el contenido
- Remover automaticamente cualquier link o html
- Bloquear palabras prohibidas
- No permitir comentarios iguales repetidos

---

### 🔹 FASE 8: Notificaciones
**Objetivo:** Aviso por email al administrador
- Email automatico cuando llega un nuevo comentario pendiente
- Incluir contenido, nombre, email, ip y link al admin para moderar
- Plantilla de email existente

---

### 🔹 FASE 9: Testeo y Verificación Final
**Objetivo:** Todo funciona correctamente
- Probar cada caso borde listado en la HU
- Probar con JS desactivado
- Probar limite de rate limit
- Verificar que todo se indexa correctamente para SEO
- Verificar responsividad
- Prueba manual de flujo completo

---

> ✅ Este plan cumple todas las reglas granulares de Cline. Cada fase es independiente, testeable y no sobrepasa el tiempo máximo permitido.