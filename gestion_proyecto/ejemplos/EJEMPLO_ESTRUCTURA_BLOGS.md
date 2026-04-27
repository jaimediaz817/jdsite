# 📋 EJEMPLO EXACTO ESTRUCTURA CARPETAS BLOGS
> Ejemplo práctico paso a paso

---

## ✅ ESTRUCTURA FINAL DE `backend/blogs_source/`

```
backend/blogs_source/
├── 2026-04-24_por-que-zoho-falla/         # 📁 BLOG 1
│   ├── blog.md                           # ✅ CONTENIDO
│   ├── captura_pantalla_1.png             # 🖼️ IMAGEN 1
│   └── diagrama_arq.png                   # 🖼️ IMAGEN 2
│
└── 2026-04-25_django-markdown-blog/       # 📁 BLOG 2
    ├── blog.md                           # ✅ CONTENIDO
    └── flujo_trabajo.png                 # 🖼️ IMAGEN 1
```

✅ **CADA BLOG ES UNA CARPETA. NADA MAS.**

✅ Dentro:
- OBLIGATORIO: `blog.md`
- Opcional: cualquier cantidad de imágenes, videos, archivos

---

## 🚀 PASO A PASO PARA CREAR UN BLOG NUEVO

### 1. 🆕 Crear carpeta
```bash
mkdir backend/blogs_source/2026-04-25_ejemplo-blog-nuevo
```

### 2. ✍️ Escribir contenido
Abre: `backend/blogs_source/2026-04-25_ejemplo-blog-nuevo/blog.md`

Escribe:
```markdown
# Este es el título de mi blog

Aquí escribo todo mi contenido normalmente.

## Sección 1

Y aquí pego una captura:
```

### 3. 🖼️ Pegar imágenes
- Toma captura con `Win + Shift + S`
- Volve al VS Code, cursor en la línea vacía
- Pulsa `Ctrl + V`

✅ VS Code escribe AUTOMÁTICAMENTE:
```markdown
![alt text](captura_pantalla.png)
```

✅ Y guarda AUTOMÁTICAMENTE la imagen en:
`backend/blogs_source/2026-04-25_ejemplo-blog-nuevo/captura_pantalla.png`

✅ **YA ESTÁ.** NO HACES NADA MAS.

---

## 🚀 SUBIR A GITHUB

```bash
git add backend/blogs_source/
git commit -m "Blog: Por qué Zoho falla en el 6to mes"
git push
```

✅ ✅ ✅ **TERMINASTE. TU TRABAJO ACABA AQUÍ.**

---

## ⚙️ EN PRODUCCIÓN (VPS)

✅ El cron corre automáticamente cada 6 horas:
```bash
cd /var/www/jaimediaz.dev
git pull
python manage.py import_blogs
python manage.py collectstatic --noinput
```

✅ HACE TODO AUTOMATICAMENTE:
1.  Descarga el nuevo blog de github
2.  Detecta que es nuevo
3.  Convierte Markdown a HTML
4.  Copia las imágenes a static
5.  Genera el slug
6.  Añade al sitemap
7.  Lo publica

✅ NUNCA tienes que conectarte por SSH para publicar nada.

---

## 🧪 EN LOCAL (TESTEAR)

Si quieres probar antes de pushear:
```bash
cd backend
python manage.py import_blogs
python manage.py runserver
```

Abre: `http://localhost:8000/blog/`

---

## 📦 COMANDOS QUE TE TIENES QUE APRENDER:

| Comando                                | Cuando lo usas                               |
| -------------------------------------- | -------------------------------------------- |
| `python manage.py makemigrations blog` | **SOLO UNA VEZ AHORA** (para crear la tabla) |
| `python manage.py migrate blog`        | **SOLO UNA VEZ AHORA**                       |
| `python manage.py import_blogs`        | Cuando quieres importar blogs nuevos         |

✅ **Estos 3 comandos son todo lo que necesitas para SIEMPRE.**