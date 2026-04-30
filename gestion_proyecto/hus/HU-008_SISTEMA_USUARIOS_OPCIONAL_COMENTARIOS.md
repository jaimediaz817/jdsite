# HU-008: Sistema de Usuarios Opcionales para Comentarios

## ✅ Historia de Usuario
Como visitante del blog, quiero poder elegir mi nivel de identificación al comentar (anónimo, identificado por email o registrado con proveedores externos) sin jamais ser obligado a crear una contraseña, para que pueda equilibrar mi privacidad con las funcionalidades adicionales según mis preferencias y nivel de involucramiento.

## 🎯 Criterios de Aceptación

### 1. Comentario Anónimo (Estado Actual Preservado)
- [x] Los usuarios pueden comentar proporcionando solo un nombre (el email es opcional)
- [x] No se requiere email ni ningún otro dato personal para comentar de forma anónima
- [x] Los comentarios anónimos se asocian a la IP del usuario
- [x] Los usuarios anónimos pueden reaccionar a los comentarios (1 vez por IP cada 24h, según sistema existente)
- [x] Los usuarios anónimos NO pueden editar sus comentarios después de publicarlos
- [x] El comportamiento para usuarios anónimos es idéntico al actual del sistema

### 2. Identificación por Email Opcional (Sin Contraseña)
- [x] Los usuarios pueden elegir proporcionar su email además de su nombre al comentar
- [x] Al proporcionar email, el usuario pasa a estado "Identificado"
- [x] Los usuarios identificados pueden:
  - Comentar normalmente
  - Reaccionar a comentarios (mismas reglas que anónimos)
  - Editar sus propios comentarios durante 7 días después de la publicación
  - Ver una indicación visual de su estado identificado (ej: badge o icono)
- [x] NO se solicita ni se almacena ninguna contraseña para usuarios identificados por email
- [x] El sistema NO verifica la propiedad del email (se acepta tal cual se proporciona)
- [x] Los usuarios identificados por email siguen estando limitados por las reglas de reacción por IP

### 3. Registro con Proveedores Externos (OAuth)
- [x] Los usuarios pueden optar por iniciar sesión con Google o GitHub
- [x] Al autenticarse con proveedor externo, el usuario pasa a estado "Registrado"
- [x] Los usuarios registrados pueden:
  - Comentar normalmente
  - Reaccionar a comentarios (mismas reglas)
  - Editar sus propios comentarios sin límite de tiempo (mientras la sesión esté activa)
  - Ver su historial de comentarios en el blog
  - Recibir notificaciones por respuestas a sus comentarios (opcional, configurable)
  - Cerrar sesión cuando lo deseen
- [x] El sistema NUNCA almacena credenciales (contraseñas) de los proveedores externos
- [x] La autenticación se delega completamente a Google/GitHub (OAuth 2.0)
- [x] Se muestra claramente que el login es mediante servicios externos

### 4. Identificación Automática de Administradores
- [x] Los usuarios con emails asociados al dominio del blog (ej: @jaimediaz817.com) son identificados automáticamente como administradores al comentar
- [x] Los administradores tienen acceso a funciones de moderación (eliminar comentarios, marcar como spam, etc.)
- [x] La identificación de administradores ocurre transparentemente sin requerir acción explícita del admin al comentar
- [x] Los administradores pueden elegir comentar como anónimos, identificados o registrados si lo prefieren

### 5. Seguridad y Privacidad
- [x] NUNCA se obliga a proporcionar email para comentar
- [x] NUNCA se obliga a registrarse o iniciar sesión para comentar
- [x] NUNCA se implementa un sistema de contraseñas propio
- [x] NUNCA se solicitan datos personales innecesarios (teléfono, dirección, etc.)
- [x] Las reacciones siguen limitadas por IP + Cookie + User Agent (sistema existente)
- [x] El sistema cumple con principios de minimización de datos: solo se almacena lo estrictamente necesario

### 6. Retrocompatibilidad
- [x] Todos los comentarios existentes continúan funcionando exactamente igual
- [x] No se pierde ningún dato histórico al implementar este sistema
- [x] Los flujos de trabajo actuales para usuarios anónimos permanecen sin cambios
- [x] La implementación es aditiva: no se elimina ni modifica funcionalidad existente

### 7. Experiencia de Usuario
- [x] La interfaz claramente muestra las tres opciones de komentado: Anónimo, Identificado, Registrado
- [x] Transición suave entre estados: un usuario puede comenzar anónimo y luego identificarse sin perder su historial de comentarios de esa sesión
- [x] Indicadores visuales claros muestran el estado de identificación del usuario en cada comentario
- [x] El proceso de identificación por email es inmediato: no requiere verificación ni espera
- [x] Los botones de login con Google/GitHub son claramente visibles y reconocibles

---

## 📋 Notas de Implementación y Plan de Modelos

### 1. Actualización del Modelo `BlogComment`
Se deben agregar los siguientes campos a `backend/blog/models.py` en la clase `BlogComment`:

```python
from django.db import models

class BlogComment(models.Model):
    # ... campos existentes ...

    # Nivel de identificación
    IDENTIFICATION_LEVELS = [
        ('anonymous', 'Anónimo'),
        ('identified', 'Identificado por email'),
        ('registered', 'Registrado (OAuth)'),
    ]
    identification_level = models.CharField(
        max_length=20, 
        choices=IDENTIFICATION_LEVELS, 
        default='anonymous'
    )

    # Para usuarios registrados con OAuth (Google/GitHub)
    provider = models.CharField(
        max_length=20, 
        choices=[('google', 'Google'), ('github', 'GitHub')],
        null=True, blank=True
    )
    provider_uid = models.CharField(max_length=255, null=True, blank=True)

    # Para identificar administradores automáticamente
    is_admin = models.BooleanField(default=False)

    # Para permitir edición (fecha límite)
    editable_until = models.DateTimeField(null=True, blank=True)
```

**Consideraciones:**
- Los comentarios existentes tendrán `identification_level='anonymous'` por defecto (retrocompatibilidad).
- `editable_until` se calculará automáticamente (7 días para identificados, ilimitado para registrados con sesión activa).

### 2. Migraciones
Una vez actualizado el modelo, ejecutar:
```bash
source .venv/Scripts/activate
cd backend
python manage.py makemigrations blog
python manage.py migrate
```

### 3. Lógica de Negocio
- **Usuarios Identificados (Email)**: Almacenar el email proporcionado (opcional) y marcar el rol como `identified`.
- **Usuarios Registrados (OAuth)**: Almacenar el ID del proveedor externo (`provider`) y el `provider_uid` (ID único que da Google/GitHub). NUNCA almacenar contraseñas.
- **Administradores**: Verificar automáticamente si el email proporcionado coincide con el dominio autorizado (ej: `@jaimediaz817.com`).
- **Edición de comentarios**: Permitir edición solo si el comentario tiene menos de 7 días (para identificados) y el usuario es el autor (con identificación verificable).
- **Interfaz**: Añadir selectores de identificación en el formulario de comentario y badges de estado en los comentarios mostrados.

---

## 🔑 PASOS DETALLADOS PARA CONFIGURAR OAUTH (GOOGLE/GITHUB)

Al autenticarse con Google o GitHub, **NO guardas contraseñas**, solo guardas el ID único del usuario y el tipo de proveedor.

### 🔵 Configuración de Google OAuth
1. **Crear proyecto en Google Cloud Console**:
   - Ve a: https://console.cloud.google.com/
   - Inicia sesión con tu Gmail
   - Arriba donde dice "Seleccionar proyecto" → click → "NUEVO PROYECTO"
   - Nombre: `jdiaz-blog` → Click "CREAR"

2. **Configurar pantalla de consentimiento**:
   - Menú izquierdo: "APIs y servicios" → "Pantalla de consentimiento OAuth"
   - Tipo de usuario: "Externo" → "CREAR"
   - Nombre de aplicación: `JDiaz Blog`
   - Email de soporte: Tu email personal
   - Email de contacto: Tu email personal
   - Click "GUARDAR Y CONTINUAR" en todas las pantallas hasta el final.

3. **Obtener Credenciales (Client ID y Secret)**:
   - "APIs y servicios" → "Credenciales"
   - Click "+ CREAR CREDENCIALES" → "ID de cliente OAuth"
   - Tipo de aplicación: "Aplicación web"
   - Nombre: `jdiaz-blog-web`
   - URIs de redireccionamiento autorizados: `http://127.0.0.1:8000/accounts/google/login/callback/`
   - Click "CREAR"
   - **COPIAR**: Client ID y Client Secret que aparecen en el popup.

### 🟣 Configuración de GitHub OAuth
1. **Crear OAuth App en GitHub**:
   - Ve a: https://github.com/settings/developers
   - Inicia sesión con tu cuenta GitHub
   - Menú izquierdo: "Configuración de desarrollador" → "OAuth Apps"
   - Click botón verde "New OAuth App"

2. **Llenar el formulario**:
   - Application name: `JDiaz Blog`
   - Homepage URL: `http://127.0.0.1:8000/`
   - Application description: `Blog personal de Jaime Diaz` (opcional)
   - Authorization callback URL: `http://127.0.0.1:8000/accounts/github/login/callback/`
   - Click "Register application"
   - **COPIAR**: Client ID y Client Secret que aparecen en la página.

### ⚙️ Configuración en Django (settings.py)
1. **Instalar dependencia**:
   ```bash
   source .venv/Scripts/activate
   cd backend
   pip install django-allauth>=0.50.0
   pip freeze > ../requirements.txt
   ```

2. **Agregar al FINAL de `backend/jdsite/settings.py`**:
   ```python
   # --- CONFIGURACIÓN DJANGO ALLAUTH (PARA GOOGLE/GITHUB) ---
   AUTHENTICATION_BACKENDS = [
       'django.contrib.auth.backends.ModelBackend',
       'allauth.account.auth_backends.AuthenticationBackend',
   ]

   SITE_ID = 1

   LOGIN_REDIRECT_URL = '/'
   LOGOUT_REDIRECT_URL = '/'

   SOCIALACCOUNT_PROVIDERS = {
       'google': {
           'APP': {
               'client_id': os.getenv('GOOGLE_OAUTH_CLIENT_ID'),
               'secret': os.getenv('GOOGLE_OAUTH_CLIENT_SECRET'),
               'key': ''
           },
           'SCOPE': ['profile', 'email'],
           'AUTH_PARAMS': {'access_type': 'online'},
       },
       'github': {
           'APP': {
               'client_id': os.getenv('GITHUB_OAUTH_CLIENT_ID'),
               'secret': os.getenv('GITHUB_OAUTH_CLIENT_SECRET'),
               'key': ''
           }
       }
   }
   ```

3. **Agregar variables al archivo `.env`**:
   ```
   GOOGLE_OAUTH_CLIENT_ID=tu_client_id_de_google_aqui
   GOOGLE_OAUTH_CLIENT_SECRET=tu_client_secret_de_google_aqui
   GITHUB_OAUTH_CLIENT_ID=tu_client_id_de_github_aqui
   GITHUB_OAUTH_CLIENT_SECRET=tu_client_secret_de_github_aqui
   ```

4. **Incluir URLs de allauth en `backend/jdsite/urls.py`**:
   ```python
   urlpatterns = [
       # ... tus otras URLs existentes ...
       path('accounts/', include('allauth.urls')),
   ]
   ```

5. **Ejecutar migraciones**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### 📊 Qué se guarda al autenticar con Google/GitHub
Cuando un usuario se autentica, django-allauth guarda automáticamente en la base de datos:

**En la tabla `socialaccount_socialaccount`:**
- `user_id`: ID del usuario Django (relación con User)
- `provider`: "google" o "github"
- `uid`: El ID único que Google/GitHub asigna a ese usuario
- `extra_data`: Información adicional como nombre, email, avatar (JSON)

**En la tabla `auth_user` (usuario Django):**
- `username`: El email del usuario (si no existe)
- `email`: El email verificado por Google/GitHub
- `first_name`, `last_name`: Nombre y apellido (si están disponibles)

**LO QUE NO SE GUARDA:**
- NUNCA se guardan las contraseñas de Google/GitHub.
- NUNCA se guardan los tokens de acceso (solo se usan temporalmente durante el login).
- NUNCA se guardan credenciales del proveedor externo.

---

## 🎯 Beneficios Esperados
- Máxima accesibilidad: el 99% de visitantes pueden comentar en 2 segundos sin fricción
- Opciones progresivas: quienes desean más funcionalidad pueden identificarse gradualmente
- Control administrativo: identificación automática de moderadores y dueño del blog
- Privacidad respetada: nadie forzado a revelar más información de la que desea
- Escalabilidad: el sistema puede evolucionar sin romper funcionalidad existente
- Confianza del usuario: transparencia total sobre qué datos se recopilan y cómo se usan

## ❌ Qué NO Incluir Esta Historia
- Sistema de contraseñas propio
- Obligatoriedad de email para comentar
- Notificaciones por email activadas por defecto
- Solicitud de teléfono o datos personales excesivos
- Historia de modificaciones ilimitada (mantener límite de 7 días para identificados por email)
- Inicio de sesión requerido para ver el blog (solo para funcionalidades adicionales)

## 🔗 Relación con Otros Requisitos
- Complementa HU-005.3_SISTEMA_COMENTARIOS_BLOG (sistema base de comentarios)
- Se basa en el sistema de reacciones existente (HU-005.2_SISTEMA_REACCIONES_BLOG)
- Mantiene compatibilidad con scroll infinito (HU-005.6_SCROLL_INFINITO_COMENTARIOS_BLOG)
- No afecta a la paginación de blogs (HU-005.1_PAGINACION_BLOG, HU-007_LISTADO_BLOG_PAGINACION)