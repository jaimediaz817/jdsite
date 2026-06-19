# HU-20.A: Ocultar imágenes en el editor sin eliminar

## Objetivo
Implementar un sistema de meta-etiquetas en el editor que permita ocultar imágenes del renderizado final (HTML) sin eliminarlas del markdown, usando el botón "Ocultar en editor" ya existente.

## Contexto
Actualmente el botón "Ocultar en editor" en los `uploaded-item` no tiene efecto real. Se necesita que al hacer clic:
1. Envuelva todas las referencias a esa imagen en el editor con meta-etiquetas `:::no-import:::`
2. El script `import_blogs.py` ignore cualquier contenido dentro de estos bloques
3. Si la imagen es la única dentro de un `::slides::` o `::popup:gallery::`, se oculte el bloque completo
4. Si se reactiva la imagen, se eliminen las meta-etiquetas

## Meta-etiqueta propuesta
```
:::no-import:::
[contenido a ocultar]
:::final-no-import:::
```

## Criterios de aceptación
1. [ ] Al hacer clic en "Ocultar en editor" se envuelven TODAS las referencias a esa imagen con `:::no-import:::/:::final-no-import:::`
2. [ ] Si la imagen está sola en un `::slides::` o `::popup:gallery::`, se oculta el bloque completo
3. [ ] Al hacer clic en "Mostrar en editor" se eliminan las meta-etiquetas
4. [ ] `import_blogs.py` ignora contenido dentro de `:::no-import:::`
5. [ ] El toggle visual en el uploaded-item funciona correctamente
6. [ ] Compatible con imágenes en estructuras HTML padres

## Pasos de implementación
1. [ ] Modificar `toggleUploadedFile()` en `blog_editor.js` para envolver/desenvolver con meta-etiquetas
2. [ ] Modificar `import_blogs.py` para ignorar bloques `:::no-import:::`
3. [ ] Asegurar compatibilidad con slides/gallery

## Estado
- [ ] Pendiente