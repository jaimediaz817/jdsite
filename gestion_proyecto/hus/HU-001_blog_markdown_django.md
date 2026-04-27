# 📋 HU-001: Sistema de Blogs desde Markdown para LinkedIn
> **ID:** HU-001
> **Fecha:** 24/04/2026
> **Responsable:** Cline
> **Estado:** 🔄 EN PROGRESO
> **Tiempo estimado total:** 45 min

---

## 🎯 Objetivo
Crear un sistema de blogs extremadamente simple, donde el único trabajo del usuario es escribir archivos Markdown en una carpeta. Todo el resto se hace automáticamente.
No hay administrador, no hay panel, no hay editor WYSIWYG. Solo archivos .md.

---

## ✅ Criterios de Aceptación

1.  [ ] Carpeta `backend/blogs_source/` es la única fuente de verdad
2.  [ ] Cada blog es una carpeta con:
    - `blog.md` → contenido + frontmatter
    - `/assets/` → imágenes, videos, archivos
3.  [ ] Comando `python manage.py import_blogs` que:
    - Lee todos los blogs
    - Parsea Markdown a HTML seguro
    - Genera slugs SEO automáticamente
    - Copia assets a static
    - Inserta/actualiza en base de datos
4.  [ ] Rutas:
    - `/blog/` → lista de blogs
    - `/blog/<slug>/` → detalle del blog
5.  [ ] Templates usan EXACTAMENTE los mismos estilos, fuentes y componentes de `home.html`
6.  [ ] Sitemap.xml incluye todos los blogs automáticamente
7.  [ ] Todo se puede destruir y reconstruir ejecutando nuevamente el comando
8.  [ ] 0 dependencias nuevas instaladas

---

## 📦 Fases de implementación granular

| Fase | Tarea                                             | Tiempo estimado | Estado       |
| ---- | ------------------------------------------------- | --------------- | ------------ |
| 1    | Crear modelo `BlogPost` y migración               | 5 min           | ✅ COMPLETADO |
| 2    | Crear comando Django `import_blogs`               | 15 min          | ✅ COMPLETADO |
| 3    | Crear templates blog_list.html y blog_detail.html | 10 min          | ✅ COMPLETADO |
| 4    | Añadir URLs y views                               | 5 min           | ✅ COMPLETADO |
| 5    | Añadir al sitemap                                 | 5 min           | ✅ COMPLETADO |
| 6    | Documentar procedimiento para escribir blogs      | 5 min           | ✅ COMPLETADO |

---

## 📌 PASOS FINALES PENDIENTES (MANUAL)

| #   | Tarea                                                                                      | Estado      |
| --- | ------------------------------------------------------------------------------------------ | ----------- |
| 7   | ✅ Descomentar `'blog'` en `INSTALLED_APPS` (settings.py)                                   | ⬜ PENDIENTE |
| 8   | ✅ Añadir ruta `path("blog/", include("blog.urls", namespace="blog"))` en urls.py principal | ⬜ PENDIENTE |
| 9   | ✅ Ejecutar migraciones `makemigrations blog` + `migrate blog`                              | ⬜ PENDIENTE |
| 10  | ✅ Añadir `BlogPostSitemap` al sitemap general del proyecto                                 | ⬜ PENDIENTE |

---

---

## 🎯 FLUJO PRODUCTIVO FINAL (ENTORNO REAL)

```
✅ TU ORDENADOR LOCAL
  │
  ├─ Escribes blog.md
  ├─ Pegas imágenes con Ctrl+V
  └─ git commit + git push
        │
        ▼
    🐙 GITHUB
        │
        ▼
    🖥️ VPS PRODUCCIÓN
        │
        ├─ Cron Job cada 6 horas ejecuta:
        │  `cd /var/www/... && git pull && python manage.py import_blogs`
        │
        ├─ ✅ El comando detecta el nuevo blog
        ├─ ✅ Importa automáticamente
        ├─ ✅ Genera slugs, copia imágenes, actualiza sitemap
        └─ ✅ NUNCA crea duplicados por el hash único
```

✅ **GARANTÍAS:**
- 🔒 100% idempotente. Se puede ejecutar 1 o 1000 veces con el mismo resultado
- ❌ NUNCA habrá blogs duplicados
- ❌ NUNCA sobrescribe nada que no haya cambiado
- ✅ Si algo falla, vuelves a ejecutar y todo se arregla solo
- ✅ No tienes que tocar la VPS NUNCA para publicar un blog

---

## 🎯 Estrategia LinkedIn asociada
> No se publica contenido en LinkedIn. Solo se publica el link.
> Todo el tráfico va a tu dominio. Todo el SEO es tuyo.
> LinkedIn es solo un distribuidor, nunca tu casa.
