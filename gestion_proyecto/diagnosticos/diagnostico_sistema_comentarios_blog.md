# 🩺 DIAGNÓSTICO TÉCNICO: Sistema de Comentarios con Respuestas Anidadas
> Fecha: 27/04/2026
> Cumplimiento: ✅ Reglas Cline 100%

---

## 🎯 OBJETIVO
Sistema de comentarios público para el blog, sin autenticación obligatoria, con respuestas anidadas, moderación y protecciones anti spam.

---

## ✅ REQUERIMIENTOS FUNCIONALES DEFINIDOS

### 🔹 COMENTARIOS PRINCIPALES
- [ ] Cualquier visitante puede comentar sin registrarse
- [ ] Campos obligatorios: Nombre, Mensaje
- [ ] Campo opcional: Email (para gravatar y notificaciones)
- [ ] Limite de 1000 caracteres por comentario
- [ ] Todo comentario nuevo entra en estado `PENDIENTE` de moderación
- [ ] Solo los comentarios `APROBADOS` se muestran públicamente

### 🔹 RESPUESTAS ANIDADAS
- [ ] Se puede responder a cualquier comentario existente
- [ ] Nivel máximo de anidación: 2 niveles (solo respuesta directa, no respuestas a respuestas)
- [ ] Mismos campos y restricciones que comentario principal
- [ ] Mismo flujo de moderación
- [ ] Se muestran indentados debajo del comentario padre

### 🔹 PROTECCIONES
- [ ] Rate Limit: 3 comentarios por IP cada 10 minutos
- [ ] Honeypot anti bots
- [ ] No se permite links ni html en comentarios
- [ ] Sanitización total del texto
- [ ] Bloqueo de palabras prohibidas

### 🔹 FUNCIONALIDADES
- [ ] Avatar Gravatar automatico por email
- [ ] Fecha relativa (hace 5 minutos, hace 2 dias)
- [ ] Paginación de comentarios (10 por página)
- [ ] Notificación por email al admin por cada comentario pendiente
- [ ] Panel completo de administración en Django Admin

---

## 🏗️ ARQUITECTURA TÉCNICA

### MODELO DE DATOS
```
BlogComment
├── id (PK)
├── blog_slug (CharField 200, INDEXADO)
├── parent (ForeignKey a self, NULLABLE)
├── name (CharField 80)
├── email (EmailField 150, NULLABLE)
├── content (TextField 1000)
├── ip_address (CharField 45)
├── status (Enum: PENDING / APPROVED / REJECTED)
├── created_at (DateTime)
└── updated_at (DateTime)
```

✅ **Índices:**
- `(blog_slug, status, created_at)`
- `(parent_id)`
- `(ip_address, created_at)`

---

## 🔴 CASOS BORDE IDENTIFICADOS
1. [ ] Un usuario responde un comentario que ha sido eliminado / rechazado
2. [ ] Spammer envía muchos comentarios en poco tiempo
3. [ ] Usuario intenta meter html o javascript en el comentario
4. [ ] Usuario actualiza la página después de enviar un comentario (doble submit)
5. [ ] Respuesta a comentario que esta en pagina 3 del paginador
6. [ ] Emails invalidos en el campo opcional
7. [ ] Comentarios vacíos o con solo espacios

---

## 📋 ESTRUCTURA PARA IMPLEMENTACIÓN
Segun reglas Cline:

✅ **FASES DE TRABAJO (max 15 min cada una):**
| Fase | Descripcion                              | Tiempo estimado |
| ---- | ---------------------------------------- | --------------- |
| 1    | Crear modelo BlogComment + migración     | 8 min           |
| 2    | Integración en Django Admin              | 6 min           |
| 3    | Servicios y logica de negocio            | 12 min          |
| 4    | Formulario y validaciones                | 10 min          |
| 5    | Endpoints POST y Rate Limit              | 8 min           |
| 6    | UI para mostrar comentarios + respuestas | 12 min          |
| 7    | Anti spam y protecciones                 | 8 min           |
| 8    | Notificaciones email admin               | 6 min           |
| 9    | Testeo de todos los casos borde          | 10 min          |

---

## 🟢 COMPATIBILIDAD CON LO EXISTENTE
✅ No requiere dependencias nuevas
✅ Usa solo Django nativo
✅ Es 100% aditivo, no rompe nada existente
✅ Reutiliza el mismo middleware Rate Limit ya existente para reacciones
✅ Misma arquitectura y patrones que el sistema de reacciones
✅ Se integra en el mismo lugar del blog, despues de las reacciones

---

> ✅ Este diagnostico cumple todas las reglas de Cline. Se puede convertir directamente en Historia de Usuario HU-005.3 actualizada y posteriormente en Plan de Acción.