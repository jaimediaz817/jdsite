# HU-029: Sistema de Códigos QR para Artículos del Blog

## 🎯 Objetivo
Crear un sistema de generación y gestión de códigos QR que permita:
1. Generar códigos QR con el logo de MTP en el centro
2. Asociar los QR a artículos específicos del blog (ej: `/blog/calistenia-rutina/`)
3. Gestionar todo el sistema desde el dashboard como superadmin

## 📋 Contexto de Uso
- **Ubicación física**: Pegar códigos QR en un lugar público (cancha de calistenia, barras)
- **Flujo**: Persona escanea QR → Llega a URL fija del artículo → Ve contenido asociado
- **Logo**: Usar `logo_mark_to_post_dark_single.png` del footer como marca de agua

## 🔍 Criterios de Aceptación

### Funcionales
- [ ] El superadmin puede crear QR desde el dashboard
- [ ] Cada QR se asocia **únicamente** a artículos PUBLICADOS (is_published=True + moderation_status='approved')
- [ ] Un QR activo NO puede estar asociado a 2 artículos: al reasignar, se desvincula del anterior automáticamente
- [ ] Los QR generados tienen el logo MTP pequeño y central, con QR normal estándar (30% del tamaño)
- [ ] Se puede descargar el QR como imagen PNG
- [ ] Se puede ver preview del QR antes de descargar
- [ ] Icono QR en blog_list: muestra `fa-qrcode` en card si artículo tiene QR activo
- [ ] Artículos con QR activo tienen estado visual especial (badge resaltado) en blog_list
- [ ] Vista previa QR en detalle: modal de 250px al hacer click en el icono

### Técnicos
- [ ] Usar librería Python `qrcode` (nativa, sin dependencias complejas)
- [ ] El logo se inserta usando PIL/Pillow (ya incluido en Django)
- [ ] URL de destino configurable vía SITE_URL de settings
- [ ] Los QR se almacenan en `media/qr_codes/` 
- [ ] Acceso restringido a superusuarios únicamente

### UI/UX Dashboard
- [ ] Nueva sección en el aside: "QR Artículos"
- [ ] Formulario simple: seleccionar artículo + generar QR
- [ ] Preview en tiempo real del QR generado
- [ ] Diseño consistente con sidebar existente (Alpine.js, colores MTP)

## 🗂️ Recursos del Proyecto

### Archivos existentes relevantes
```
backend/static/images/addons/logo_mark_to_post_dark_single.png  # Logo MTP (120x120 aprox)
backend/blog/models.py                                      # Modelo BlogPost
backend/blog/templates/blog/partials/_dashboard_config_sidebar.html  # Sidebar dashboard
backend/blog/templates/blog/dashboard.html                   # Template principal
backend/jdsite/settings.py                                  # SITE_URL configurado
```

## 🔄 Mecanismo Profesional: QR → Ruta Intermedia → Artículo

### ¿Por qué NO apuntar QR directo al artículo?
Si el QR apunta directamente a `/blog/calistenia-rutina/`, **no podrás cambiar el destino** sin regenerar el QR físico.

### Mecanismo RECOMENDADO (Opción B)
```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  QR IMPRESO     │  →  │  /qr/{slug}/       │  →  │  /blog/{slug}/        │
│  (inmutable)    │     │  (ruta intermedia) │     │  (URL del artículo)   │
└─────────────────┘     └──────────────────┘     └────────────────────┘
                              ↑
                         Puedes cambiar
                         esta relación
                         SIN tocar el QR
```

### Ventajas del mecanismo interino
- ✅ **Reasociación dinámica**: Cambiar artículo sin regenerar QR
- ✅ **Tracking**: Contar cuántos escaneos recibe cada QR
- ✅ **Fallback**: Manejar artículos eliminados/despublicados
- ✅ **Multi-uso**: Mismo QR para diferentes propósitos en el tiempo

### Imagen del Logo MTP
- **Path actual**: `static/images/addons/logo_mark_to_post_dark_single.png`
- **Uso actual**: Footer del blog (blog_list.html línea 19)
- **Tamaño**: 120px ancho, se usará versión escalada para el QR

## 📦 Librerías Requeridas

### Instalación
```bash
# Activar entorno virtual primero
source .venv/Scripts/activate

# Instalar librerías (verificar si ya están instaladas)
pip install qrcode[pil] Pillow

# Verificar en requirements.txt
pip freeze > requirements.txt
```

### Justificación
- `qrcode`: Librería estándar de Python para generación de QR
- `[pil]`: Soporte para imágenes (Pillow/PIL) - necesario para superponer el logo
- Ambos son librerías ligeras, sin dependencias externas complejas

## 🏗️ Arquitectura y Modelos

### Modelo Nuevo: `QRCode`
```python
# backend/blog/models.py (añadir al final)
class QRCode(models.Model):
    """
    Código QR asociado a un artículo del blog.
    El superadmin puede generar QR para compartir artículos físicamente.
    """
    name = models.CharField(
        max_length=100,
        help_text="Nombre descriptivo del QR (ej: 'Calistenia - Cancha')"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="Slug único para identificar el QR"
    )
    blog_post = models.ForeignKey(
        BlogPost,
        on_delete=models.CASCADE,
        related_name="qr_codes",
        help_text="Artículo al que redirige el QR"
    )
    # Ruta donde se guarda la imagen generada
    image_path = models.CharField(
        max_length=500,
        blank=True,
        help_text="Ruta relativa de la imagen QR guardada"
    )
    # Timestamp de creación
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Usuario que creó el QR"
    )
    # Campo para reasignación única: al crear nuevo QR, el anterior se desvincula
    is_active = models.BooleanField(default=True, help_text="QR activo actualmente")
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Código QR"
        verbose_name_plural = "Códigos QR"
    
    def __str__(self):
        return f"{self.name} → /{self.blog_post.slug}"
    
    def get_absolute_qr_url(self):
        """URL pública del QR para escaneos"""
        from django.urls import reverse
        return reverse("blog:qr_redirect", args=[self.slug])
    
    def save(self, *args, **kwargs):
        """Al guardar, si es QR activo, desvincular otros QR del mismo artículo"""
        if self.is_active and self.blog_post:
            QRCode.objects.filter(blog_post=self.blog_post, is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)
```

### Migración
```bash
# Después de crear el modelo
python manage.py makemigrations blog
python manage.py migrate
```

## 🔄 Flujo de Trabajo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Superadmin)                       │
│                                                                 │
│  1. Click "QR Artículos" en el aside                        │
│  2. Seleccionar artículo del dropdown                          │
│  3. Escribir nombre descriptivo + eslogan                      │
│  4. Click "Generar QR"                                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Preview del QR                         │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  ████████████████████████████████████████████████  │    │  │
│  │  │  ████████████████████████████████████████████████  │    │  │
│  │  │  ████████████████████████████████████████████████  │    │  │
│  │  │  █████████████ LOGO + ÍCONO CATEGORÍA + NOMBRE ████ │    │  │
│  │  │  ████████████████████████████████████████████████  │    │  │
│  │  │  ████████████████████████████████████████████████  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  5. Botón "Descargar PNG" o "Ver lista de QR"                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    URL Pública                                 │
│                                                                 │
│  /blog/qr/{slug}/  →  Redirect (302)  →  /blog/{post_slug}/   │
│                                                                 │
│  Ejemplo: /blog/qr/calistenia-cancha/ → /blog/calistenia-rutina/ │
└─────────────────────────────────────────────────────────────────┘
```

## 📝 Pasos de Implementación (Granulares)

### Fase 1: Modelo de Datos
- [ ] Agregar modelo `QRCode` en `backend/blog/models.py`
- [ ] Crear migración: `python manage.py makemigrations blog`
- [ ] Ejecutar migración: `python manage.py migrate`

### Fase 2: Librerías
- [ ] Instalar `qrcode[pil]` y verificar `Pillow`
- [ ] Actualizar `requirements.txt`

### Fase 3: Utilidad de Generación QR
- [ ] Crear `backend/blog/utils/qr_generator.py`
- [ ] Función `generate_qr_with_logo(url, logo_path, campaign_data)` → imagen PNG
- [ ] Integrar ícono categoría + nombre campaña + eslogan minimalista
- [ ] Guardar imagen en `media/qr_codes/{slug}.png`

### Fase 4: Vistas
- [ ] Vista `dashboard_qr_view` - lista y formulario de creación
- [ ] Vista `generate_qr_view` - endpoint AJAX para generar QR
- [ ] Vista `qr_redirect_view` - redirección 302 al artículo
- [ ] Vista `download_qr_view` - descarga de imagen PNG

### Fase 5: URLs
```python
# backend/blog/urls.py
path("dashboard/qr/", dashboard_qr_view, name="dashboard_qr"),
path("dashboard/qr/generate/", generate_qr_view, name="generate_qr"),
path("dashboard/qr/<slug:slug>/download/", download_qr_view, name="download_qr"),
path("qr/<slug:slug>/", qr_redirect_view, name="qr_redirect"),  # Público
```

### Fase 6: Templates
- [ ] Crear `dashboard_qr.html` - interfaz de gestión
- [ ] Añadir opción en `_dashboard_config_sidebar.html`
- [ ] Preview modal o sección en la página

### Fase 7: JavaScript
- [ ] Alpine.js para el formulario y preview
- [ ] Fetch API para generar QR sin recargar página
- [ ] Manejo de errores y loading states

### Fase 8: Admin (Opcional)
- [ ] Registrar modelo en `backend/blog/admin.py`
- [ ] Acción personalizada: "Generar QR desde admin"

## 🎨 Diseño del Logo y Elementos Visuales en el QR

### Parámetros Técnicos
```python
# Dimensiones recomendadas
LOGO_SIZE = 0.25  # 25% del tamaño del QR (ajustable)
QR_VERSION = 1-5  # Auto-ajustado según la URL
BOX_SIZE = 10     # Tamaño de cada caja (para buena resolución)
BORDER = 4        # Borde estándar
```

### Manejo de Logo Blanco/Transparente
```python
# Si el logo tiene fondo blanco o transparente, agregar círculo negro como fondo
# Esto asegura que el logo resalte sobre el QR negro

def add_logo_with_background_check(logo_img, base_img):
    """
    Añade el logo al QR con detección automática de fondo blanco/transparente.
    Si el logo detecta que necesita fondo oscuro, crea un círculo negro (#1a1a1a)
    con 15% de padding adicional.
    """
    logo_size = min(base_img.size) // 4
    
    avg_color = get_average_color(logo_img)
    if avg_color > 200 or logo_img.mode == 'RGBA':
        background = create_circular_background(logo_size, color='#1a1a1a')
        background.paste(logo_img, (padding, padding), logo_img)
        logo_final = background
    else:
        logo_final = logo_img
    
    return logo_final
```

### Diseño Minimalista QR con Elementos Llamativos
```python
# Cada QR incluye elementos visuales integrados (no solo el código)

def generate_enhanced_qr(url, logo_path, category_icon, campaign_name, slogan, output_path):
    """
    Genera QR con elementos visuales llamativos:
    - Logo MTP en el centro
    - Ícono de categoría (ej: 🤸‍♂️ para calistenia) en esquina superior
    - Nombre de campaña debajo del QR
    - Eslogan llamativo en el diseño
    """
    # Generar QR base
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
    
    # Añadir logo con fondo negro si es necesario
    logo = Image.open(logo_path)
    logo = add_logo_with_background_check(logo, img)
    
    # Posicionar logo en el centro
    logo_size = min(img.size) // 4
    pos = ((img.size[0] - logo_size) // 2, (img.size[1] - logo_size) // 2)
    img.paste(logo, pos, logo if logo.mode == 'RGBA' else None)
    
    # Añadir ícono de categoría (ej: 🤸‍♂️ para calistenia)
    # Añadir texto: nombre campaña + eslogan
    draw = ImageDraw.Draw(img)
    # Texto: "mira rutinas, retos y estadísticas de quienes practican acá"
    
    img.save(output_path)
    return output_path
```

### Ejemplos de Esloganes por Categoría
| Categoría     | Eslogan sugerido                                              |
| ------------- | ------------------------------------------------------------- |
| Calistenia    | "Mira rutinas, retos y estadísticas de quienes practican acá" |
| Programación  | "Lee tutoriales y ejemplos en código"                         |
| Productividad | "Tips y herramientas para mejorar tu día a día"               |
| Fitness       | "Ejercicios y progresos de la comunidad"                      |

## 📊 Endpoints API

| Endpoint                              | Método | Auth       | Descripción             |
| ------------------------------------- | ------ | ---------- | ----------------------- |
| `/blog/dashboard/qr/`                 | GET    | Superadmin | Lista QR + formulario   |
| `/blog/dashboard/qr/generate/`        | POST   | Superadmin | Generar nuevo QR (AJAX) |
| `/blog/dashboard/qr/<slug>/download/` | GET    | Superadmin | Descargar PNG           |
| `/blog/qr/<slug>/`                    | GET    | Público    | Redirección al artículo |

## 🔒 Seguridad
- Solo `is_superuser` puede acceder a `/dashboard/qr/`
- El endpoint público `/qr/<slug>/` solo hace redirect, no expone datos
- Validación de slug para prevenir inyección de URL

## 📁 Estructura de Archivos

```
backend/
├── blog/
│   ├── models.py          # Modelo QRCode
│   ├── views.py           # Vistas QR
│   ├── urls.py            # URLs del QR
│   ├── admin.py           # Admin del QR
│   ├── utils/
│   │   └── qr_generator.py   # Lógica de generación
│   ├── templates/
│   │   └── blog/
│   │       └── dashboard_qr.html
│   └── static/
│       └── blog/
│           └── js/
│               └── dashboard_qr.js
media/
└── qr_codes/              # Carpeta para almacenar QR generados
    ├── calistenia-cancha.png
    ├── tutorial-django.png
    └── ...
```

## 🧪 Testing Manual

```bash
# 1. Activar entorno
source .venv/Scripts/activate

# 2. Crear migración
cd backend
python manage.py makemigrations blog

# 3. Migrar
python manage.py migrate

# 4. Ejecutar servidor
python manage.py runserver

# 5. Acceder como superadmin
# http://localhost:8000/blog/dashboard/qr/
```

## 📋 Consideraciones Especiales

1. **Rendimiento**: Los QR se generan bajo demanda y se cachean como archivos estáticos
2. **Backup**: Los QR se regeneran fácilmente, no son críticos de respaldar
3. **Multiples QR por artículo**: Posible, cada QR tiene nombre único (ej: uno para redes, otro para impresión)
4. **URL corta opcional**: Se podría agregar después con `django-shorturls` si es necesario
5. **Tracking**: Se podría añadir contador de escaneos futuro (campo `scan_count`)

## 🚨 Manejo de Artículos Eliminados/Despublicados

### Escenario: QR activo pero artículo no disponible
**Problema:** Usuario escanea QR → Artículo fue eliminado o despublicado

### Solución Implementada
```
┌─────────────────────────────────────────────────────────┐
│  /blog/qr/calistenia-cancha/ (público)                │
│                           ↓                            │
│  qr_redirect_view                                      │
│      ├── ¿blog_post.exists() Y is_published?            │
│      │       → SÍ: 302 redirect → /blog/{slug}/       │
│      │       ↓                                          │
│      └── NO: 404 personalizado → "Artículo no disponible" │
│                   o redirect a /blog/ (lista artículos)  │
└─────────────────────────────────────────────────────────┘
```

### Estrategias de Fallback
- **Opción A (recomendada):** Mostrar 404 amigable con mensaje "Este artículo ya no está disponible. Te mostramos otros artículos."
- **Opción B:** Redirect 302 a `/blog/` con mensaje toast "Artículo temporalmente no disponible"

### Visualización en Dashboard
- Los QR en la lista mostrarán badge de estado:
  - ✅ **Activo** (artículo publicado)
  - ⚠️ **Despublicado** (artículo existe pero no visible)
  - ❌ **Eliminado** (artículo borrado de BD)

## 📝 Metadatos de Registro del QR

### Información que se guarda al crear cada QR
| Campo        | Tipo        | Descripción                    | Ejemplo                           |
| ------------ | ----------- | ------------------------------ | --------------------------------- |
| `name`       | CharField   | **Propósito/ubicación del QR** | "Cancha Calistenia - Poste Norte" |
| `slug`       | SlugField   | Identificador único            | "calistenia-cancha-norte"         |
| `created_at` | DateTime    | Fecha/hora generación          | 2025-06-07 14:30:00               |
| `created_by` | FK User     | Quién lo creó                  | admin_user                        |
| `blog_post`  | FK BlogPost | Artículo asociado              | calistenia-rutina                 |
| `is_active`  | Boolean     | QR activo actualmente          | true                              |

### Campos adicionales propuestos
| Campo            | Tipo      | Descripción                          |
| ---------------- | --------- | ------------------------------------ |
| `location_notes` | TextField | Notas de ubicación física (opcional) |
| `scan_count`     | Integer   | Contador de escaneos (futuro)        |

### Ejemplos de propósitos
- "Cancha Calistenia - Poste Norte"
- "Parque de Fútbol - Tablilla Entrada"
- "Blog - Compartir en redes sociales"

---
HU creada: 2025-06-07
Última actualización: 2025-06-07
Estado: 📋 **FASE DE ANÁLISIS COMPLETA** - Pendiente aprobación para implementación