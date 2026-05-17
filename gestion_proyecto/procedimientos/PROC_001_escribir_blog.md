# 📋 PROC_001: Procedimiento para escribir y publicar un blog
> Versión: 1.0
> Fecha: 24/04/2026
> Responsable: Jaime Díaz

---

## ✅ FLUJO COMPLETO EN 4 PASOS
Nunca tienes que tocar base de datos, admin, panel, ni nada. Solo Markdown.

---

### 🚀 PASO 1: Crear carpeta del blog
1.  Ir a `backend/blogs_source/`
2.  Crear una carpeta con el formato: `YYYY-MM-DD_titulo-del-blog`
    ✅ Ejemplo: `2026-04-24_por-que-zoho-siempre-falla`
3.  Dentro crear un archivo `blog.md`

---

### ✍️ PASO 2: Escribir el contenido
1.  La primera línea SIEMPRE es el título:
    ```markdown
    # Por qué las integraciones de Zoho siempre fallan en el 6to mes
    ```

2.  Escribes todo el resto del artículo normalmente en Markdown.

3.  **Para insertar imágenes:**
    - Toma captura con `Win + Shift + S`
    - Volve a VS Code
    - Pon el cursor donde quieras la imagen
    - Pulsa `Ctrl + V`

✅ ✅ ✅ **YA ESTÁ.** VS Code guarda la imagen automáticamente y escribe el Markdown por ti.

✅ No tienes que hacer absolutamente nada más.

---

### 🛠️ PASO 3: Importar a la base de datos
Ejecuta el comando:
```bash
cd backend
python manage.py import_blogs
```

✅ El comando:
- Detecta automáticamente blogs nuevos
- Detecta cambios en blogs existentes
- Copia todas las imágenes automáticamente
- Genera slugs SEO
- Actualiza sitemap.xml

✅ Solo procesa lo que ha cambiado. No toca nada que no se haya modificado.

---

### 📢 PASO 4: Publicar en LinkedIn
✅ **NUNCA PUBLIQUES EL CONTENIDO EN LINKEDIN.**

✅ Solo publica ESTO y NADA MÁS:
> 📝 Nuevo artículo: Por qué las integraciones de Zoho siempre fallan en el 6to mes
> 
> 🔗 https://jaimediaz.dev/blog/por-que-zoho-siempre-falla
> 
> Cuando llevas 12 años haciendo esto, ves patrones que nadie ve.

✅ Todas las visitas van a TU dominio.
✅ Todo el SEO es TUYO.
✅ LinkedIn es solo un distribuidor, nunca tu casa.

---

---

## 🖼️ REGLAS PARA LA IMAGEN DE PORTADA

### ✅ Mecanismo automático

La **primera imagen** que aparece en el contenido del `blog.md` (después del `# Título`, fuera de bloques `:::`) se convierte **automáticamente** en la imagen de portada del artículo.

- ✅ Se copia a `static/blogs/<slug>/`
- ✅ Se guarda la ruta en `cover_image` de la BD
- ✅ **Se elimina del contenido del artículo** (no aparece en el detalle, solo en listados y redes sociales)

### ✅ Cómo escribir la portada correctamente

```markdown
# Título del artículo

![Texto alternativo SEO](portada.png)

## Primera sección

Aquí empieza el contenido real del artículo...
Otras imágenes dentro del contenido sí aparecen en el detalle.
![Descripción de imagen interna](diagrama.png)
```

### ⚠️ Importante

- La portada **nunca se ve en el detalle** del artículo. Solo en listados, Open Graph y Twitter Cards.
- Si pones la portada al inicio del markdown, no se duplica ni interfiere con el contenido.
- Si tu blog no tiene imágenes en el contenido, **no tendrá portada** (`cover_image = None`).
- El campo `image` en el frontmatter SOLO se usa como **fallback** si el contenido no tiene imágenes. No se recomienda usarlo.
- Puedes pegar imágenes con `Ctrl+V` directamente en VS Code (Win+Shift+S para capturar) y el sistema las procesa automáticamente.

---

## ✅ REGLAS DE ORO

1.  ❌ NUNCA modificas nada en base de datos manualmente
2.  ❌ NUNCA subes imágenes por ningún otro lado
3.  ✅ La carpeta `blogs_source/` es la ÚNICA fuente de verdad
4.  ✅ Si algo se rompe, vuelves a ejecutar `import_blogs` y todo vuelve a funcionar
5.  ✅ Puedes borrar, modificar, mover carpetas cuando quieras
6.  ✅ La primera imagen del markdown SIEMPRE será la portada automática
7.  ✅ Las imágenes dentro del contenido (2da, 3ra, etc.) aparecen normal en el artículo
