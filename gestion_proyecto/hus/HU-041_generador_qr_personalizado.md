# HU-041: Generador de Códigos QR Personalizados

> **Objetivo:** Crear un sistema de generación de códigos QR personalizados conlogo, título y eslogan, independiente de artículos del blog, para compartir perfiles y URLs genéricas.

**Fecha:** 11/06/2026
**Responsable:** Jaime Díaz
**Tiempo estimado:** 3-4 horas (análisis + implementación)

---

## 📊 ANÁLISIS DEL SISTEMA ACTUAL

### Código existente que se APROVECHA (sin modificaciones)

| Componente                   | Ubicación             | Estado actual                                  | Acción en esta HU         |
| ---------------------------- | --------------------- | ---------------------------------------------- | ------------------------- |
| `generate_qr_with_logo()`    | `qr_generator.py:38`  | Genera QR con logo MTP + título + eslogan      | ✅ USAR TAL CUAL           |
| `get_qr_filename()`          | `qr_generator.py:313` | Genera nombre de archivo PNG                   | ✅ USAR TAL CUAL           |
| `get_qr_media_path()`        | `qr_generator.py:326` | Genera ruta en `media/qr_codes/`               | ✅ USAR TAL CUAL           |
| Modelo `QRCode`              | `models.py`           | Almacena QRs generados (asociados a artículos) | 🔄 Solo añadir campos      |
| Admin `QRCodeAdmin`          | `admin.py`            | Gestión en panel admin                         | ✅ USAR TAL CUAL           |
| Template `dashboard_qr.html` | Templates             | Lista QRs existentes                           | 🔄 Solo añadir botón       |
| Vista `dashboard_qr`         | `views.py`            | Lista QRs del usuario                          | 🔄 Solo añadir nueva vista |

### Código NUEVO (solo lo imprescindible)

| Componente                       | Acción  | Razón                                               |
| -------------------------------- | ------- | --------------------------------------------------- |
| Formulario `QRPersonalizadoForm` | 🆕 NUEVO | Campos: URL, título, eslogan, logo, tamaño, preview |
| Vista `qr_create`                | 🆕 NUEVA | Procesar formulario y generar QR                    |
| Template `qr_create.html`        | 🆕 NUEVO | Formulario + preview lado a lado                    |
| JS `qr_create.js`                | 🆕 NUEVO | Preview en tiempo real + submit AJAX                |
| CSS `qr_create.css`              | 🆕 NUEVO | Estilos del formulario (si se necesitan)            |
| Endpoint AJAX `qr_preview`       | 🆕 NUEVO | Generar preview sin guardar en BD                   |

### Qué NO se modifica (reutilización 100%)

- ❌ `qr_generator.py` - NO SE MODIFICA
- ❌ Modelo `QRCode` - SOLO SE AÑADEN CAMPOS (no se borran ni cambian)
- ❌ `dashboard_qr.html` - SOLO SE AÑADE BOTÓN (no se reemplaza)
- ❌ `dashboard_qr` vista - SE AÑADE NUEVA VISTA (no se modifica)
- ❌ URLs existentes - SE AÑADEN RUTAS NUEVAS (no se cambian)

### Arquitectura actual de QRs

```
QR actual (HU-029):
├── Modelo: QRCode
│   ├── url (URL del artículo)
│   ├── title (título)
│   ├── slug (nombre archivo)
│   ├── article (FK opcional a BlogPost)
│   └── created_at
├── Generador: qr_generator.py
│   ├── Logo MTP hardcodeado
│   ├── Texto: título + eslogan
│   └── Output: PNG en media/qr_codes/
└── Dashboard: dashboard_qr.html
    └── Lista de QRs por usuario

Nuevo sistema (HU-041):
├── Modelo: QRCode (AMPLIADO)
│   ├── [todos los campos existentes]
│   ├── is_personalized (boolean)
│   ├── logo_custom (char, opcional)
│   └── generated_at (datetime)
├── Generador: qr_generator.py (SIN CAMBIOS)
│   └── Se llama con parámetros variables
├── Formulario: QRPersonalizadoForm (NUEVO)
│   ├── URL, título, eslogan
│   ├── Logo: MTP default / upload propio / sin logo
│   └── Preview en Canvas
├── Vista: qr_create (NUEVA)
│   ├── GET: mostrar formulario
│   └── POST: generar QR + guardar/descargar
└── Template: qr_create.html (NUEVO)
    └── Layout 2 columnas: formulario | preview
```

### Limitaciones actuales

1. **Solo genera QRs para artículos** - Necesita `article_id`
2. **Logo hardcodeado** - Siempre usa `logo_mark_to_post_dark_single.png`
3. **No hay formulario público** - Solo se crea desde `qr_assign_article`
4. **No soporta logos personalizados** - No hay upload ni selección
5. **No hay preview** - Se genera y guarda directamente

---

## 🎯 REQUISITOS DEL USUARIO

### Historia de uso

> "Quiero compartir un QR de mi home personal (`https://jaimediaz.dev`) en LinkedIn para que reclutadores y empresas puedan acceder fácilmente a mi perfil."

### Funcionalidades solicitadas

1. **Generar QR para cualquier URL** (no solo artículos)
   - Ejemplo: `https://jaimediaz.dev` (home personal)
   - Ejemplo: `https://jaimediaz.dev/about/` (página específica)
   - Ejemplo: `https://calistenia.example.com` (proyecto externo)

2. **Personalizar logo del QR**
   - Logo por defecto: MTP (transparente PNG)
   - Opción de subir logo propio (PNG con transparencia)
   - Selector de logos predefinidos (biblioteca)
   - Ajuste de tamaño del logo

3. **Personalizar texto del QR**
   - Título del QR (ej: "Jaime Díaz - Portfolio")
   - Eslogan (ej: "Desarrollador Full Stack | Blog & Proyectos")
   - Vista previa en tiempo real

4. **Interfaz de usuario**
   - Botón "Crear QR" en dashboard de QRs
   - Formulario nuevo (página separada o modal)
   - Preview antes de generar
   - Descarga directa (PNG)

5. **Pregunta abierta:** ¿Guardar en BD o solo generar/descargar?

---

## 💡 PROPUESTA DE SOLUCIÓN

### Opción A: Guardar en BD (Recomendado)

Ventajas:
- Historial de QRs generados
- Reutilización sin volver a generar
- Estadísticas (si se implementan en el futuro)
- Gestión centralizada

Desventajas:
- Aumenta tamaño de BD
- Migración necesaria

### Opción B: Solo generar y descargar

Ventajas:
- No requiere cambios en BD
- Más rápido
- Sin migraciones

Desventajas:
- No hay historial
- Se pierde el QR si no se guarda el archivo
- No se puede reutilizar

### Opción C: Híbrida (RECOMENDADA)

- Guardar en BD **si** el usuario quiere
- Opción de "Guardar" o "Solo descargar"
- Si se guarda, aparece en lista de QRs

---

## 🚀 CARACTERÍSTICAS ADICIONALES SUGERIDAS

### 1. Plantillas de estilo

```yaml
Estilos predefinidos:
  - "Profesional": Logo MTP + negro/blanco
  - "Creativo": Logo personalizado + colores personalizados
  - "Minimalista": Sin logo + QR limpio
  - "Corporativo": Logo empresa + colores corporativos
```

### 2. Configuración avanzada

- **Tamaño del QR**: 500px, 1000px, 2000px (para impresión)
- **Color principal**: Negro por defecto, opción de personalizar
- **Color de fondo**: Blanco por defecto, opción de transparente
- **Corrección de errores**: L, M, Q, H (H = 30% tolerancia)
- **Formato de salida**: PNG, SVG (vectorial)

### 3. Preview en tiempo real

- Canvas HTML5 para mostrar preview
- Actualización al cambiar cualquier campo
- Zoom para ver detalles
- Descarga directa sin recargar página

### 4. Biblioteca de logos

**Estructura:**
```
backend/static/images/qr_logos/
├── default/
│   ├── logo_mark_to_post_dark_single.png  # Logo MTP actual
│   └── logo_mtp_light.png                  # Variante clara
├── tech/
│   ├── python.png
│   ├── django.png
│   └── javascript.png
└── personal/
    ├── avatar_jaime.png
    └── marca_personal.png
```

### 5. Historial y analytics (futuro)

- Contador de escaneos (si se implementa endpoint)
- Fecha de creación
- Último escaneo
- Geolocalización (opcional, solo si se requiere)

---

## 📋 ANÁLISIS DE IMPLEMENTACIÓN (mínimo código nuevo)

### Cambios en modelo `QRCode` (solo añadir campos)

```python
class QRCode(models.Model):
    # ... campos existentes SIN CAMBIOS ...
    
    # Campos NUEVOS para QRs personalizados
    is_personalized = models.BooleanField(default=False)
    logo_custom = models.CharField(max_length=500, blank=True, null=True)
    generated_at = models.DateTimeField(auto_now=True)
```

**NO se modifica:** `url`, `title`, `slug`, `article`, `created_at` (existentes)

### Formulario NUEVO (sin reutilizar)

```python
class QRPersonalizadoForm(forms.Form):
    url = forms.URLField(required=True)
    title = forms.CharField(max_length=120, required=True)
    slogan = forms.CharField(max_length=200, required=False)
    logo_type = forms.ChoiceField(
        choices=[('mtp', 'Logo MTP'), ('custom', 'Subir logo'), ('none', 'Sin logo')]
    )
    logo_file = forms.ImageField(required=False)
    qr_size = forms.IntegerField(default=1000, min_value=500, max_value=2000)
```

**NO se reutiliza:** Es un formulario nuevo para el nuevo flujo.

### Vistas NUEVAS (sin modificar las existentes)

```python
# URL: /blog/dashboard/qr/create/
def qr_create(request):
    """Formulario + generación de QR personalizado"""
    if not request.user.is_superuser:
        return redirect('blog:dashboard_qr')
    
    if request.method == 'POST':
        form = QRPersonalizadoForm(request.POST, request.FILES)
        if form.is_valid():
            # 1. Generar QR usando función EXISTENTE
            qr_path = generate_qr_with_logo(
                url=form.cleaned_data['url'],
                output_path=get_qr_media_path(slug),
                logo_path=...,
                text=form.cleaned_data['title'],
                slogan=form.cleaned_data['slogan']
            )
            # 2. Guardar en BD (si se quiere)
            # 3. Descargar o redirigir
    else:
        form = QRPersonalizadoForm()
    
    return render(request, 'blog/qr_create.html', {'form': form})
```

**NO se modifica:** `dashboard_qr` u otras vistas existentes.

### URLs NUEVAS (no se cambian las existentes)

```python
# backend/blog/urls.py - SOLO AÑADIR
urlpatterns = [
    # ... existentes ...
    path('dashboard/qr/create/', views.qr_create, name='qr_create'),
]
```

**NO se modifica:** Ninguna URL existente.

### Templates NUEVOS

**`blog/qr_create.html`** (NUEVO):
- Formulario con campos: URL, título, eslogan, logo_type, logo_file, qr_size
- Preview en Canvas (derecha)
- Botones: Generar, Descargar, Cancelar

**`dashboard_qr.html`** (SOLO AÑADIR):
- Botón "[+ Crear QR Personalizado]" al lado de "Generar QR"
- No se modifica el resto

### JS NUEVO

**`blog/static/blog/js/qr_create.js`** (NUEVO):
- Preview en tiempo real (AJAX a endpoint `/blog/dashboard/qr/preview/`)
- Submit del formulario
- Descarga del PNG

**NO se modifica:** `dashboard_qr.js` ni otros archivos JS existentes.

---

## 🎨 DISEÑO DE UI/UX

### Flujo de usuario

```
1. Usuario accede a /blog/dashboard/qr/
   ↓
2. Ve lista de QRs existentes + botón [+ Crear QR Personalizado]
   ↓
3. Click en botón → Redirige a /blog/dashboard/qr/create/
   ↓
4. Completa formulario:
   - URL: https://jaimediaz.dev
   - Título: "Jaime Díaz - Portfolio"
   - Eslogan: "Desarrollador Full Stack"
   - Logo: [Selecciona "Logo MTP"]
   ↓
5. Preview se actualiza en tiempo real (derecha del formulario)
   ↓
6. Click en "Generar QR"
   ↓
7. Sistema genera PNG llamando a generate_qr_with_logo() (FUNCIÓN EXISTENTE)
   ↓
8. Descarga automática del PNG
   ↓
9. (Opcional) Guardar en BD para historial
```

### Layout del formulario

```
┌────────────────────────────────────────────────────────────┐
│ Crear QR Personalizado                                      │
├──────────────────────────┬─────────────────────────────────┤
│ FORMULARIO               │ PREVIEW                         │
│                          │                                 │
│ URL destino:             │ ┌─────────────────────────┐    │
│ [https://jaimediaz.dev]  │ │                         │    │
│                          │ │      [QR CODE]         │    │
│ Título:                  │ │                         │    │
│ [Jaime Díaz Portfolio  ] │ │                         │    │
│                          │ ├─────────────────────────┤    │
│ Eslogan (opcional):      │ │ Jaime Díaz Portfolio    │    │
│ [Desarrollador Full...]  │ │ Desarrollador Full...   │    │
│                          │ └─────────────────────────┘    │
│ Logo:                    │                                 │
│ ○ Logo MTP (default)     │                                 │
│ ○ Subir logo propio      │                                 │
│   [Seleccionar archivo]  │                                 │
│ ○ Sin logo               │                                 │
│                          │                                 │
│ Tamaño:                  │                                 │
│ [1000px ▼]               │                                 │
│                          │                                 │
│ Color:                   │                                 │
│ [■ #000000]              │                                 │
│                          │                                 │
│ [Generar QR]             │                                 │
└──────────────────────────┴─────────────────────────────────┘
```

---

## 🔍 PREGUNTAS PARA REFINAR

1. **¿Almacenamiento?**
   - ¿Guardar en BD o solo generar/descargar?
   - ¿Límite de QRs por usuario?

2. **¿Biblioteca de logos?**
   - ¿Qué logos incluir por defecto?
   - ¿Permitir upload de logos personalizados?

3. **¿Preview?**
   - ¿Actualización en tiempo real (AJAX) o al enviar formulario?
   - ¿Mostrar preview en la misma página o modal?

4. **¿Colores personalizados?**
   - ¿Solo negro/blanco o colores arbitrarios?
   - ¿Soporte para transparencia en el QR (fondo transparente)?

5. **¿Formato de salida?**
   - ¿Solo PNG o también SVG (vectorial)?
   - ¿Resolución fija o configurable?

6. **¿Compartir?**
   - ¿Generar URL pública para el QR (ej: `/qr/jaime-diaz-portfolio/`)?
   - ¿O solo descarga de archivo?

---

## 📦 DEPENDENCIAS NECESARIAS

### Python
- `qrcode` - Generación de QRs (ya instalado)
- `pillow` - Manipulación de imágenes (ya instalado)

### Sin dependencias nuevas
- Todo con lo que ya está instalado

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Mínimo viable

- [ ] Formulario de creación de QR con URL, título y eslogan
- [ ] Preview en tiempo real
- [ ] Generación de PNG con logo MTP
- [ ] Descarga directa
- [ ] Opción de guardar en BD (si aplica)

### Completo

- [ ] Upload de logo personalizado (PNG con transparencia)
- [ ] Biblioteca de logos predefinidos
- [ ] Personalización de colores
- [ ] Selección de tamaño
- [ ] Historial de QRs generados
- [ ] Eliminación de QRs
- [ ] Compartir vía URL pública

### Avanzado (futuro)

- [ ] Formato SVG
- [ ] Analytics de escaneos
- [ ] Plantillas de estilo
- [ ] QR con diseño personalizado (formas, degradados)

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Análisis y diseño (esta HU)

- [x] Analizar sistema actual
- [x] Definir requisitos
- [ ] Refinar con feedback del usuario
- [ ] Elegir Opción A, B o C (almacenamiento)

### Fase 2: Formulario básico (sin BD)

- [ ] Crear formulario (URL, título, eslogan)
- [ ] Preview en tiempo real
- [ ] Generar QR con logo MTP
- [ ] Descargar PNG

### Fase 3: Almacenamiento (si aplica)

- [ ] Ampliar modelo QRCode
- [ ] Migración de BD
- [ ] Guardar QR en BD
- [ ] Lista de QRs guardados

### Fase 4: Personalización avanzada

- [ ] Upload de logo propio
- [ ] Biblioteca de logos
- [ ] Colores personalizados
- [ ] Tamaños configurables

### Fase 5: Optimización y testing

- [ ] Validaciones
- [ ] Pruebas en producción
- [ ] Documentación

---

## 📝 NOTAS TÉCNICAS

### Consideraciones de performance

- Generar QR en background (Celery) si > 3 segundos
- Cache de previews en sesión
- Limitar size de logos (max 500KB)

### Seguridad

- Validar URLs (no permitir `javascript:`)
- Limpiar metadata de imágenes subidas
- Límite de QRs por usuario (anti-spam)

### Accesibilidad

- Alt text en preview
- Labels en formulario
- Navegación por teclado

---

> 🎯 **PRÓXIMO PASO:** Responder las preguntas de la sección "Preguntas para refinar" y elegir la opción de almacenamiento (A, B o C).