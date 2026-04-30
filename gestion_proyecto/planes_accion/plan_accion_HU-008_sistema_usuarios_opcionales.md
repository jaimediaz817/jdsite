# 🚀 PLAN DE ACCIÓN: HU-008 Sistema de Usuarios Opcionales
> ✅ Generado automaticamente desde HU oficial
> Fecha: 30/04/2026
> Cumplimiento: ✅ Reglas Cline 100%

---

## 📋 PRINCIPIOS DE EJECUCIÓN
✅ Una fase a la vez
✅ Cada fase < 15 minutos de trabajo
✅ Se prueba y confirma cada fase antes de pasar a la siguiente
✅ NUNCA se rompe lo existente
✅ Todo es aditivo
✅ Cero dependencias nuevas sin aprobación (django-allauth ya aprobado)

---

## 📊 FASES DE IMPLEMENTACIÓN

| Fase      | Descripcion                                         | Tiempo estimado | Estado       |
| --------- | --------------------------------------------------- | --------------- | ------------ |
| 🔹 FASE 1  | Actualizar modelo BlogComment + campos nuevos       | 12 min          | ✅ Completado |
| 🔹 FASE 2  | Migraciones de base de datos                        | 5 min           | ✅ Completado |
| 🔹 FASE 3  | Instalar y configurar django-allauth                | 10 min          | ✅ Completado |
| 🔹 FASE 4  | Configurar settings.py OAuth (Google/GitHub)        | 8 min           | ✅ Completado |
| 🔹 FASE 5  | Configurar URLs allauth en jdsite/urls.py           | 5 min           | ✅ Completado |
| 🔹 FASE 6  | Obtener credenciales OAuth (Google Cloud + GitHub)  | 12 min          | ✅ Completado |
| 🔹 FASE 7  | Actualizar forms.py (selector identificación)       | 10 min          | ✅ Completado |
| 🔹 FASE 8  | Actualizar vistas (lógica identificación + edición) | 12 min          | ✅ Completado |
| 🔹 FASE 9  | Actualizar templates (UI + badges + botones OAuth)  | 12 min          | ✅ Completado |
| 🔹 FASE 10 | Lógica administradores automáticos (email dominio)  | 8 min           | ✅ Completado |
| 🔹 FASE 11 | Testeo y verificación final (casos borde)           | 15 min          | ⏳ Pendiente  |

---

## 🛠️ DETALLES DE CADA FASE

---

### 🔹 FASE 1: Actualizar Modelo BlogComment
**Objetivo:** Agregar campos para niveles de identificación
- Editar `backend/blog/models.py`
- Agregar campos a `BlogComment`: `identification_level`, `provider`, `provider_uid`, `is_admin`, `editable_until`
- No eliminar campos existentes
- Mantener retrocompatibilidad (valores por defecto)

---

### 🔹 FASE 2: Migraciones
**Objetivo:** Aplicar cambios a la base de datos
```bash
source .venv/Scripts/activate
cd backend
python manage.py makemigrations blog
python manage.py migrate
```
- Verificar que no se pierdan datos existentes
- Comprobar que los comentarios viejos tienen `identification_level='anonymous'`

---

### 🔹 FASE 3: Instalar y Configurar django-allauth
**Objetivo:** Preparar dependencia para OAuth
```bash
source .venv/Scripts/activate
cd backend
pip install django-allauth>=0.50.0
pip freeze > ../requirements.txt
```
- Verificar instalación: `pip show django-allauth`
- Agregar `'allauth'` y `'allauth.account'` a `INSTALLED_APPS` en settings.py
- Agregar `'allauth.socialaccount'` a `INSTALLED_APPS`

---

### 🔹 FASE 4: Configurar settings.py OAuth
**Objetivo:** Configuración de proveedores externos
- Agregar al FINAL de `backend/jdsite/settings.py`:
  - AUTHENTICATION_BACKENDS
  - SITE_ID
  - LOGIN_REDIRECT_URL / LOGOUT_REDIRECT_URL
  - SOCIALACCOUNT_PROVIDERS (google, github)
- Verificar sintaxis Python

---

### 🔹 FASE 5: Configurar URLs allauth
**Objetivo:** Integrar rutas de autenticación
- Editar `backend/jdsite/urls.py`
- Agregar: `path('accounts/', include('allauth.urls'))`
- Verificar que no rompe URLs existentes
- Probar acceso a `/accounts/login/`

---

### 🔹 FASE 6: Obtener Credenciales OAuth (Google/GitHub)
**Objetivo:** Configurar proveedores externos
1. **Google Cloud Console**: Crear proyecto, pantalla consentimiento, OAuth Client ID
2. **GitHub OAuth App**: Crear app, Homepage, Callback URL
3. **Agregar a `.env`**: GOOGLE_OAUTH_CLIENT_ID, etc.

---

### 🔹 FASE 7: Actualizar forms.py
**Objetivo:** Selector de nivel de identificación
- Editar `backend/blog/forms.py`
- Agregar campo `identification_choice`
- Validar email opcional
- Mantener compatibilidad con formulario existente

---

### 🔹 FASE 8: Actualizar Vistas
**Objetivo:** Lógica de identificación y edición
- Editar `backend/blog/views.py`
- Guardar `identification_level` según elección
- Si OAuth: guardar `provider` y `provider_uid`
- Verificar si email es admin
- Lógica de edición: 7 días para identificados, ilimitado para registrados

---

### 🔹 FASE 9: Actualizar Templates
**Objetivo:** UI con badges y botones OAuth
- Editar `backend/blog/templates/blog/blog_detail.html`
- Mostrar badges según `identification_level`
- Agregar botones "Entrar con Google/GitHub"
- Selector de identificación en formulario

---

### 🔹 FASE 10: Lógica Administradores Automáticos
**Objetivo:** Detectar admins por dominio
- En vista de creación: `if email.endswith('@jaimediaz817.com'): comment.is_admin = True`
- Otorgar permisos moderación

---

### 🔹 FASE 11: Testeo y Verificación Final
**Objetivo:** Todo funciona correctamente
- [ ] Probar comentario anónimo
- [ ] Probar identificado (email, edición 7 días)
- [ ] Probar login Google/GitHub
- [ ] Verificar badges visuales
- [ ] Verificar detección admin
- [ ] Probar retrocompatibilidad
- [ ] Confirmar rate limiting

---

## 📅 RELACIÓN CON CRONOGRAMA MASTER
- **Depende de:** HU-005.3 (Sistema Comentarios Blog) - ✅ Completado
- **Depende de:** HU-005.2 (Sistema Reacciones Blog) - ✅ Completado
- **Bloquea:** Ninguna historia nueva
- **Fase del proyecto:** Sprint 23 - Mejoras Blog

---

> ✅ Este plan cumple todas las reglas granulares de Cline. Cada fase es independiente, testeable y no sobrepasa el tiempo máximo permitido.