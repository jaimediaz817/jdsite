# HU-22 – Fix botón cerrar modal lightbox (`#image-zoom-modal`)

## 🎯 Objetivo
El botón X con clase `modal-lightbox-close` del modal `image-zoom-modal` no cierra correctamente el modal y muestra bordes/fealdad en el contenedor padre. Se busca corregir ambos problemas sin alterar la navegación existente (prev/next).

## 🔍 Diagnóstico previo
- **HTML**: El botón X existe con clase `modal-lightbox-close` dentro de `.modal-lightbox-wrapper`.
- **JS**: 
  - La función `closeLightbox()` existe (líneas 592-601 de `blog_detail.js`).
  - Se registra un event listener en el botón (línea 629).
  - El `stopPropagation()` está presente.
- **CSS**:
  - `.modal-lightbox-close` usa `position: fixed` y no restaura el `font-family` nativo del sistema.
  - El wrapper `.modal-lightbox-wrapper` no tiene `border-radius` ni `overflow: hidden`.
  - El `<dialog>` tiene estilos de borde/contorno duplicados en dos bloques de CSS (líneas 1038 y 4022).

## ✅ Criterios de aceptación
1. El botón X cierra el modal al hacer clic.
2. El cierre funciona también por tecla `Escape` (ya existe, mantener).
3. El contenedor `.modal-lightbox-wrapper` no muestra bordes ni contenido desbordado.
4. El botón X se ve limpio (sin outline de focus del navegador, bordes propios eliminados, tipografía nativa).
5. No se rompen las funcionalidades prev/next del lightbox.
6. El `<dialog>` queda limpio de bordes heredados del navegador.

## 🛠️ Pasos de implementación
1. Corregir CSS del wrapper para que herede el redondeo y oculte desbordes.
2. Corregir CSS del botón de cierre para eliminar bordes/outline y usar la tipografía del sistema.
3. Unificar/limpiar estilos duplicados del `<dialog>` en el CSS.
4. Validar que el modal sigue abriendo, navegando y cerrándose correctamente.

## ✅ Estado final: Completada

### 🔍 Diagnóstico real
El botón X no cerraba porque el listener se registraba en ejecución inmediata (IIFE) antes de que el `<dialog id="image-zoom-modal">` existiera en el DOM. Cuando `modal` era `null`, el bloque salía temprano y nunca se attachaba el `click` al botón `.modal-lightbox-close`. No fue un conflicto con Bootstrap 4; fue un problema de **DOM ready / timing**.

### 🛠️ Fix aplicado
- Envolver el bloque de mejoras del lightbox en `DOMContentLoaded` para asegurar la existencia del dialog antes de registrar listeners.
- Esto garantiza que `.modal-lightbox-close` tenga su listener de cierre y deje de propagar el evento al backdrop.

### ✅ Criterios verificados
1. Botón X cierra el modal (`closeLightbox()` se ejecuta).
2. Cierre por `Escape` mantenido.
3. Cierre por clic en backdrop mantenido (`e.target === modal`).
4. No se rompen prev/next/counter.
5. Sin dependencias nuevas; solo cambio de patrón de ejecución en `backend/blog/static/blog/js/blog_detail.js`.

### 🎨 Estilo profesional del botón cerrar
- Botón circular `border-radius: 9999px`.
- Tamaño fijo `2.75rem`, centrado con flex (`align-items: center; justify-content: center;`).
- Fondo semitransparente con `backdrop-filter: blur(6px)`.
- Tipografía nativa, sin padding desigual, foco accesible con outline blanco.
- Hover oscurecido sin movimiento brusco.

### 📦 Archivos modificados
- `backend/blog/static/blog/js/blog_detail.js`
- `backend/blog/static/blog/css/blog_detail.css`
- `backend/staticfiles/blog/css/blog_detail.css`