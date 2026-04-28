# 🚀 PLAN DE ACCIÓN: HU-005.2 Sistema de Reacciones Blog
> Aprobado según Diagnóstico y HU oficial
> Fecha: 27/04/2026
> Cumplimiento: ✅ Reglas Cline 100%

---

## 📋 PRINCIPIOS DE EJECUCIÓN
✅ Una fase a la vez
✅ Cada fase < 15 minutos de trabajo
✅ Se prueba y confirma cada fase antes de pasar a la siguiente
✅ NUNCA se rompe lo existente
✅ Todo es aditivo

---

## 🗓️ FASES DE IMPLEMENTACIÓN

| Fase     | Descripción                                                         | Tiempo estimado | Estado       |
| -------- | ------------------------------------------------------------------- | --------------- | ------------ |
| 🔹 FASE 1 | Crear modelo `BlogReaction` + migración                             | 8 min           | ✅ Completado |
| 🔹 FASE 2 | Crear lógica de negocio y servicio de reacciones                    | 10 min          | ✅ Completado |
| 🔹 FASE 3 | Crear endpoints API minimalistas                                    | 7 min           | ✅ Completado |
| 🔹 FASE 4 | Añadir middleware rate limit y detección de robots                  | 6 min           | ✅ Completado |
| 🔹 FASE 5 | Implementar CSS animaciones exactas según especificaciones          | 12 min          | ✅ Completado |
| 🔹 FASE 6 | Implementar componente Vanilla JS con Optimistic UI                 | 12 min          | ⏳ Pendiente  |
| 🔹 FASE 7 | Integración en plantilla blog detail sin modificar código existente | 5 min           | ⏳ Pendiente  |
| 🔹 FASE 8 | Revisión final y medición métricas                                  | 5 min           | ⏳ Pendiente  |

---

## 🔹 FASE 1: Modelo y Migración
**Objetivo:** Crear estructura de datos
- Nuevo modelo en `blog/models.py`
- Campos: `blog_slug (char 200)`, `ip_address (char 45)`, `reaction_type (char 20)`, `created_at`
- Índice único compuesto `(blog_slug, ip_address, reaction_type)`
- Índice por `blog_slug` para consultas rápidas
- Migración autogenerada
- No modificar ningún otro modelo

## 🔹 FASE 2: Lógica de Negocio
**Objetivo:** Servicio interno puro sin dependencias
- Función `toggle_reaction(blog_slug, ip, reaction_type)`
- Función `get_user_reactions(blog_slug, ip)`
- Función `get_reaction_counts(blog_slug)`
- Toda la lógica atómica aquí
- 100% testeable unitariamente
- Sin side effects

## 🔹 FASE 3: Endpoints API
**Objetivo:** Endpoints minimalistas
- GET `/api/blog/<slug>/reactions/` → devuelve contadores y estado del usuario
- POST `/api/blog/<slug>/reactions/toggle/` → recibe tipo de reacción
- Respuestas JSON simple sin decorados
- CORS correcto
- Métodos permitidos correctos

## 🔹 FASE 4: Middleware y Seguridad
**Objetivo:** Control de abuso
- Rate limit: 10 peticiones por minuto por IP
- Detección de User Agent de robots
- Bloqueo completo de crawlers
- Validación de entrada
- Sin exponer ninguna información interna

## 🔹 FASE 5: CSS y Animaciones
**Objetivo:** Cumplir 100% las especificaciones de usabilidad
- Zona de click 48x48px
- Todas las curvas de animación exactas
- Tiempos exactos: 150ms hover, 80ms active, 280ms activación
- Sin dependencias
- Responsivo
- Funciona sin JS

## 🔹 FASE 6: Componente Javascript
**Objetivo:** Implementar Optimistic UI correctamente
- Vanilla JS 100% sin librerías
- Debounce 300ms
- Feedback inmediato visual
- Manejo de errores silencioso
- Revertir estado si falla el servidor
- Tamaño final < 1kb

## 🔹 FASE 7: Integración
**Objetivo:** Añadir al blog sin tocar código existente
- Wrapper parcial
- No se modifica nada del template actual
- Se inserta el componente al final del artículo
- Carga asincrónica

## 🔹 FASE 8: Revisión Final
**Objetivo:** Cumplir todas las métricas
- Medir tiempo respuesta endpoint
- Medir tamaño JS y CSS
- Verificar que nada se rompió
- Confirmar cero nuevas dependencias
- Commit y deploy

---

> ✅ Este plan cumple todas las reglas granulares de Cline. Cada fase es independiente, testeable y no sobrepasa el tiempo máximo permitido.