# HU-023-B: Compartir artículo en redes sociales con imagen llamativa

## Objetivo
Generar dinámicamente una imagen de mosaico/resumen automático para que los artículos del blog se vean llamativos y profesionales cuando se comparten en WhatsApp, Facebook, Twitter y otras redes sociales.

## Escenarios de uso

### WhatsApp Status
- Cuando el usuario comparta un artículo en su estado de WhatsApp
- El preview mostrará una imagen generada automáticamente (no depende de cover_image individual)
- La imagen incluye: título del post, tags principales, categoría, preview visual

### Facebook/Twitter/LinkedIn
- Al compartir el link del artículo
- Se mostrará la misma imagen mosaico para branding consistente
- Mejor CTR al reconocer visualmente el sitio

### Blog listado
- La imagen mosaico puede usarse también como thumbnail en el grid del blog
- Imagen genérica con branding del blog para posts sin cover_image

## Criterios de aceptación

### Imagen OG dinámica
- [ ] Si el post tiene `cover_image`: usar la imagen del post (pero con overlay de branding)
- [ ] Si el post NO tiene `cover_image`: generar mosaico automático con:
  - Logo/branding del blog (esquina superior izquierda)
  - Título del artículo (centrado, legible)
  - Tags principales (badges decorativos)
  - Categoría con color distintivo
  - Fondo con patrón visual atractivo

### Tamaño y formato por plataforma
- [ ] **Open Graph (1200x630px)** - WhatsApp, Facebook, LinkedIn:
  - Ratio 1.91:1, ideal para todos los formatos
- [ ] **Twitter Card (1200x600px)**:
  - Ratio 2:1, ligeramente más panorámico
- [ ] **WhatsApp Status (1080x1350px)**:
  - Ratio 4:5, vertical, para compartir como estado
- [ ] **Formato**: JPG optimizado < 300KB cada imagen
- [ ] Cache estático (no regenerar en cada request)

### Previews por plataforma
- **WhatsApp Chat/Mensaje**: Muestra thumbnail 1200x630px + título + URL debajo
- **WhatsApp Status**: La imagen se adapta al ratio 4:5 vertical, texto legible en móvil
- **Facebook Feed**: Imagen 1200x630px con overlay de branding en esquina superior
- **Twitter/X**: Imagen 1200x600px, preview al instante al pegar el link

### Implementación técnica
- [ ] Endpoint `/blog/og-image/<slug>/` que genera la imagen
- [ ] Cache de imágenes generadas en `backend/static/og-cache/`
- [ ] Fallback a `og-social-share.jpg` si hay error
- [ ] Template HTML para renderizar la imagen antes de convertir a imagen

### Imágenes de referencia para el mosaico
- [ ] **Primera opción**: `cover_image` del post (si existe) → crop + overlay branding
- [ ] **Segunda opción**: Imágenes del contenido (`content_html`) → primeras 2-3 imágenes
- [ ] **Tercera opción**: Imagen por defecto `og-social-share.jpg` con título/texto overlay
- [ ] **Regla de selección automática**:
  1. Si `cover_image` existe → se usa como base del mosaico
  2. Si NO existe cover_image → buscar primeras imágenes en `content_html`
  3. Si NO hay imágenes en contenido → usar plantilla genérica con texto

### Detalles de extracción de imágenes
- **De `content_html`**: Parsear con BeautifulSoup para extraer `<img src="...">`
- **Orden de prioridad**: Portada > imágenes del contenido > placeholder genérico
- **Crop inteligente**: Recortar manteniendo el foco en el centro de la imagen
- **Overlay branding**: Logo semi-transparente en esquina superior derecha

## Notas

### Prioridad
- **ALTA**: Mejora el aspecto profesional en redes sociales
- **BAJO impacto técnico**: Solo afecta meta tags, no rompe nada existente

### Opciones de implementación
1. **PIL/Pillow**: Generar imágenes dinámicamente
2. **Playwright/Selenium**: Renderizar template HTML y screenshot
3. **SVG estático**: Más simple, menos personalizable

### Preview de WhatsApp
Ejemplo de cómo se vería:
```
┌─────────────────────────────────────────────────────┐
│  LOGO BLOG         Título del artículo aquí       │
│  jd.site    ┃     en múltiples líneas            │
│             ┃                                    │
│  [UI/UX] [Blog] [Tech]                           │
│                                                     │
│     Fondo con patrón visual sutil                   │
│             ┃                                    │
│  jaimediaz.dev/blog/slug-del-articulo              │
└─────────────────────────────────────────────────────┘
```

---

## Estado
- [ ] Pendiente de análisis técnico
- [ ] Pendiente de estimación
- [ ] Pendiente de implementación