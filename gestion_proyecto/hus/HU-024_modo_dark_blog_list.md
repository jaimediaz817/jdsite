# HU-024: Modo Dark en blog_list

## Objetivo
Implementar un modo dark para la página de lista de artículos (`blog_list`) que reduzca la fatiga visual en ambientes con poca luz, reusando el sistema existente `data-reading-mode="dark"` del blog_detail.

## Contexto
Se recibió crítica de que la pantalla de blog_list "está muy iluminada" en una noche oscura. El blog_detail ya tiene implementado un sistema de dark mode con `data-reading-mode="dark"` que podemos reutilizar.

## Criterios de aceptación
1. Botón toggle para modo dark/light en la navbar o header de blog_list
2. Al activar dark mode, todos los elementos deben tener contraste adecuado (fondo oscuro, texto claro)
3. El estado del modo debe persistirse en `localStorage`
4. Transición suave al cambiar de modo (opacity/transform)
5. Menor impacto posible - reusar CSS existente si es posible

## Implementación

### Paso 1: Botón toggle en navbar
- Agregar botón con icono de luna/sol en el header
- Ubicación: dentro de `blog-toolbar-actions` o en el navigation menu

### Paso 2: CSS para dark mode
- Usar `html[data-reading-mode="dark"]` como selector base
- Definir variables CSS para colores:
  - `--bg-primary: #111827` (fondo oscuro)
  - `--text-primary: #f9fafb` (texto claro)
  - `--card-bg: #1f2937` (fondo de cards)
  - `--border-color: #374151` (bordes)

### Paso 3: JavaScript (jQuery mínimo)
```javascript
// Guardar en localStorage
localStorage.setItem('reading-mode', 'dark');
// Leer desde localStorage al cargar
localStorage.getItem('reading-mode');
```

### Paso 4: Elementos a estilizar
- `.blog-card` - fondo oscuro, texto claro
- `.search-filters` - fondo oscuro
- `.blog-grid` - fondo
- `.blog-write-btn` - colores adaptados
- Todos los textos y bordes

## Estado

**COMPLETADO** ✅

### Implementado:
1. **Botón toggle** en `backend/blog/templates/blog/blog_list.html` - `#reading-mode-toggle`
2. **CSS dark mode** en `backend/blog/static/blog/css/blog_list_fix.css`
3. **JavaScript jQuery** maneja toggle entre `normal` y `dark`, persiste en localStorage
4. Elementos estilizados:
   - `.blog-card` - fondo oscuro
   - `.search-filters` - fondo oscuro
   - `.blog-card-meta` - texto claro
   - `.chip` - fondo oscuro
   - `.empty-state-container` - texto adaptado
   - Botones y formularios - colores adaptados
