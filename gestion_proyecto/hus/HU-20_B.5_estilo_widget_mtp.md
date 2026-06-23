# HU-20-B.5: Estilo visual profesional para widgets de imagen MTP

## 📋 Metadatos
- **ID:** HU-20-B.5
- **Dependencias:** HU-20-B (widgets flotantes) — implementada
- **Estado:** Implementación inmediata
- **Prioridad:** Media

## 🎯 Objetivo
Mejorar visualmente el widget de imagen incrustado en el editor CodeMirror, agregando:
1. Un **contorno/borde sutil** alrededor del widget para que se perciba como un elemento incrustado por la herramienta.
2. Un **sello "MTP"** como marca visual que identifique que es un widget construido con el editor custom Mark to Post.

## ✅ Cambios realizados

### Fase 1: CSS — Estilos visuales para el widget (blog_editor.css)
- Agregado borde sutil azul alrededor de `.img-line-widget`
- Agregado badge "MTP" en la esquina superior derecha vía `::after`
- Agregado efecto hover que intensifica el borde y el sello
- Agregada animación sutil fadeIn para cuando aparece el widget

### Fase 2: JS — Clase CSS condicional (blog_editor.js)
- Agregada clase `mtp-branded` al widget de imagen para estilos específicos

## 📝 Archivos modificados
- `backend/blog/static/blog/css/blog_editor.css` — estilos del widget
- `backend/blog/static/blog/js/blog_editor.js` — clase condicional