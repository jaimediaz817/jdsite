# 🚀 PLAN DE ACCIÓN: HU-005.4 Reacciones a Comentarios Blog
> Aprobado según Diagnóstico y HU oficial
> Fecha: 29/04/2026
> Cumplimiento: ✅ Reglas Cline 100%

---

## 📋 PRINCIPIOS DE EJECUCIÓN
✅ Una fase a la vez
✅ Cada fase < 15 minutos de trabajo
✅ Se prueba y confirma cada fase antes de pasar a la siguiente
✅ NUNCA se rompe lo existente
✅ Todo es aditivo
✅ No se modifica BlogReaction ni BlogComment existentes

---

## 🗓️ FASES DE IMPLEMENTACIÓN

| Fase     | Descripción                                                    | Tiempo estimado | Estado      |
| -------- | -------------------------------------------------------------- | --------------- | ----------- |
| 🔹 FASE 1 | Crear modelo `CommentReaction` + migración                     | 10 min          | ⏳ Pendiente |
| 🔹 FASE 2 | Crear lógica de negocio y servicio de reacciones a comentarios | 10 min          | ⏳ Pendiente |
| 🔹 FASE 3 | Crear endpoints API para reacciones a comentarios              | 8 min           | ⏳ Pendiente |
| 🔹 FASE 4 | Reutilizar middleware rate limit existente                     | 5 min           | ⏳ Pendiente |
| 🔹 FASE 5 | Implementar CSS reutilizando estilos de reacciones artículos   | 8 min           | ⏳ Pendiente |
| 🔹 FASE 6 | Implementar componente Vanilla JS reutilizable                 | 12 min          | ⏳ Pendiente |
| 🔹 FASE 7 | Integración en plantilla de comentarios                        | 10 min          | ⏳ Pendiente |
| 🔹 FASE 8 | Revisión final y validación                                    | 5 min           | ⏳ Pendiente |

---

## 🔹 FASE 1: Modelo y Migración
**Objetivo:** Crear estructura de datos para CommentReaction
- Nuevo modelo en `reactions/models.py` llamado `CommentReaction`
- Campos:
  - `comment_id` (BigInteger, FK a BlogComment.id - OJO: sin cascade)
  - `ip_address` (CharField 45)
  - `reaction_type` (CharField 20)
  - `created_at` (DateTimeField)
  - `last_modified` (DateTimeField)
- Índice único compuesto: `(comment_id, ip_address, reaction_type)`
- Índice por `comment_id` para consultas rápidas
- Migración autogenerada
- NO modificar BlogReaction existente

---

## 🔹 FASE 2: Lógica de Negocio
**Objetivo:** Servicio interno puro sin dependencias
- Función `toggle_comment_reaction(comment_id, ip, reaction_type)`
- Función `get_user_comment_reactions(comment_id, ip)`
- Función `get_comment_reaction_counts(comment_id)`
- Función `get_comment_with_reactions(comment_id)` - para Joint con BlogComment
- Reutilizar lógica similar a BlogReaction pero adaptada
- 100% testeable unitariamente

---

## 🔹 FASE 3: Endpoints API
**Objetivo:** Endpoints minimalistas para comentarios
- GET `/api/blog/comments/<comment_id>/reactions/` → contadores y estado
- POST `/api/blog/comments/<comment_id>/reactions/toggle/` → tipo de reacción
- Same patterns as reactions API
- CORS correcto, métodos correctos
- Se reutiliza la misma URL base si es posible

---

## 🔹 FASE 4: Middleware y Seguridad
**Objetivo:** Control de abuso (reutilizar existente)
- Rate limit: 10 peticiones por minuto por IP (YA EXISTE)
- Detección de User Agent de robots (YA EXISTE)
- Validación de comment_id existe
- Solo comentariosApproved pueden recibir reacciones (opcional)
- Sin exponer información interna

---

## 🔹 FASE 5: CSS y Animaciones
**Objetivo:** Reutilizar estilos existentes
- Reutilizar clases CSS de reacciones de artículos
- Solo adaptaciones menores para espacio de comentarios
- Zona de click 48x48px (YA DEFINIDO)
- Animaciones iguales: 150ms hover, 280ms activación
- Responsivo y funciona sin JS

---

## 🔹 FASE 6: Componente Javascript
**Objetivo:** Reutilizar componente existente
- Extender lógica JS de reacciones de artículos
- Parámetro adicional: comment_id en lugar de blog_slug
- Comportamiento idéntico (toggle, Optimistic UI)
- Tamaño adicional < 500 bytes
- Debounce 300ms

---

## 🔹 FASE 7: Integración
**Objetivo:** Añadir al template de comentarios
- Insertar componente de reacciones debajo de cada comentario
- Se muestra en comentarios principal y respuestas
- Requiere modificar template de comentarios (唯一 cambio)
- No se modifica BlogComment ni BlogReaction
- Carga asincrónica

---

## 🔹 FASE 8: Revisión Final
**Objetivo:** Cumplir todas las métricas
- Medir tiempo respuesta endpoint
- Medir tamaño JS y CSS adicionales
- Verificar que nada se rompió
- Confirmar cero nuevas dependencias
- Testing de todos los casos de prueba
- Commit y deploy

---

## 📊 MÉTRICAS OBJETIVO

| Métrica                      | Valor objetivo |
| ---------------------------- | -------------- |
| Tiempo de respuesta endpoint | < 80ms         |
| Tamaño JS adicional          | < 500 bytes    |
| Tamaño CSS adicional         | < 300 bytes    |
| Tasa de error                | < 0.1%         |
| Casos de prueba pasando      | 10/10          |

---

## 🔗 DEPENDENCIAS CON OTRAS HU

- **HU-005.2** (Reacciones artículos): YA COMPLETADO - Se reutiliza código
- **HU-005.3** (Sistema comentarios): COMPLETADO - BlogComment ya existe
- Esta HU-005.4 depende de que BlogComment exista (✅ cumplido)

---

> ✅ Este plan cumple todas las reglas granulares de Cline.
> ✅ Cada fase es independiente, testeable y no sobrepasa el tiempo máximo permitido.
> ✅ Se reutiliza código existente, no se reinventa la rueda.