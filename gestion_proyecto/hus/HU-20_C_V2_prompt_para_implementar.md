# Prompt sugerido para implementar HU-20_C_V2

```
Eres un desarrollador senior JS/Django trabajando en el proyecto jdsite_clean, siguiendo las reglas del archivo .clinerules del proyecto.

1) Lee PRIMERO la Historia de Usuario: `gestion_proyecto/hus/HU-20_C_V2_slide_block_wrapper.md`.
2) Lee DESPUÉS el diagnóstico: `backend/blog/static/blog/js/blog_editor/diagnostico_slides.md`.
3) Implementa la HU fase por fase, sin saltar pasos. Cualquier duda, usa el diagnóstico como referencia.

Reglas estrictas:
- No modifiques `createImageWidget`, `createLocalVideoWidget`, `createYouTubeWidget`, ni funciones de video/imagen individuales; no forman parte del fix.
- Respeta el orden de fases de la HU.
- Aplica la regla de no regresión: las imágenes/video sueltos deben seguir con su widget individual.
- No borres ni reescribas áreas extensas del código; usa cambios localizados.
- No ejecutes comandos de Django sin activar el entorno virtual siguiendo el procedimiento obligatorio en .clinerules.

Entregables:
- Cambios mínimos necesarios en `backend/blog/static/blog/js/blog_editor/index.js` (`refreshImageWidgets()` y `createSlideBlockWidget()`).
- Si el wrapper de bloque lo requiere, applica solo el CSS estrictamente necesario en `backend/blog/static/blog/css/blog_editor.css` (máximo 5 reglas nuevas, usando el selector `:has()` si corresponde).
- Al final, actualiza la HU en `gestion_proyecto/hus/HU-20_C_V2_slide_block_wrapper.md` cambiando `Pendiente de implementación` por `Implementada` y agrega la fecha.

No procedas hasta tener claras las fases. Si alguna fase no se puede aplicar tal cual, documenta la desviación dentro del archivo HU con sección "Desviaciones" justificada.