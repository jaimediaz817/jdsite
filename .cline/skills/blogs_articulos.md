# Skill: Formateo de contenido en import_blogs.py

## Filosofía
El objetivo es que el MD sea limpio y semántico, y que el HTML 
resultante tenga tags significativos para poder estilar con CSS.
Nunca aplanar contenido estructurado en <p> genéricos.

## Bloques especiales disponibles (sintaxis :::)

| Bloque             | Sintaxis                      | HTML generado                           |
| ------------------ | ----------------------------- | --------------------------------------- |
| Slides             | `:::slides`                   | `<div class="slides-container">`        |
| Info               | `:::callout:info`             | `<div class="callout callout-info">`    |
| Warning            | `:::callout:warning`          | `<div class="callout callout-warning">` |
| Tip                | `:::callout:tip`              | `<div class="callout callout-tip">`     |
| Pullquote          | `:::pullquote`                | `<blockquote class="pullquote">`        |
| Código con archivo | `:::codefile:ruta/archivo.py` | `<div class="codefile-container">`      |

## Reglas de listas

- Listas con `-`, `*`, `+` → `<ul><li>`
- Listas con `1.` → `<ul class="steps"><li class="step">`
- Líneas con emoji bullet (✅ ❌ 💡) → `<ul class="emoji-list"><li>`
- NUNCA colapsar items de lista en un solo `<p>`

## Reglas de párrafos

- Saltos simples dentro de un párrafo → se unen con espacio
- Saltos dobles → nuevo `<p>`
- Líneas estructurales (listas, headings, blockquotes) → NUNCA unir

## Reglas de imágenes

- Una imagen sola → `<figure class="single-image-container">`
- Dos o más imágenes seguidas → carousel automático con Swiper
- Imágenes dentro de `:::slides` → slider con navegación propia
- Alt text con `|` → `título|descripción`
- Primera imagen del MD → portada (no aparece en el cuerpo)

## Reglas de código

- Bloques con backticks normales → `<pre><code>` con codehilite
- Bloques con `:::codefile:ruta` → `<div class="codefile-container">` con header de archivo

## Reglas de limpieza

- Comentarios HTML `<!-- -->` → eliminados antes de procesar
- Frontmatter `---` → extraído, nunca aparece en el HTML
- `meta_title` → máximo 59 chars (truncado con aviso)
- `meta_description` → máximo 154 chars (truncado con aviso)

## Orden de procesamiento (importante)

1. Leer archivo y extraer frontmatter
2. Proteger bloques `:::` con placeholders
3. Eliminar comentarios HTML
4. Normalizar saltos de línea (respetando estructuras)
5. Restaurar bloques `:::`
6. Extraer título
7. Extraer imagen de portada
8. `replace_special_blocks_md` → slides, callouts, pullquotes, codefiles
9. `convert_markdown_to_html` → markdown → HTML
10. `process_special_blocks` → popup:gallery legacy
11. `process_images` → rutas de imágenes + alt automático
12. `auto_create_carousels` → carouseles automáticos
13. `apply_custom_formatting` → ol→steps, emoji-list, conclusión wrapper

## Cómo añadir un nuevo bloque especial

1. Definir sintaxis: `:::nombre_bloque\ncontenido\n:::`
2. Agregar handler `_replace_nombre` en `replace_special_blocks_md`
3. Agregar `re.sub` al final del método
4. El regex de protección en `read_markdown_file` lo cubre automáticamente
5. Documentar en este skill con HTML generado y clase CSS

## Clases CSS que deben existir en el frontend

- `.slides-container`, `.slide`, `.slide-caption`, `.slides-nav`, `.slides-dots`
- `.callout`, `.callout-info`, `.callout-warning`, `.callout-tip`
- `.pullquote`
- `.codefile-container`, `.codefile-header`, `.codefile-name`, `.codefile-body`
- `.emoji-list`
- `.single-image-container`
- `.blog-carousel-container` (Swiper)
- `.steps`, `.step`
- `.conclusion`