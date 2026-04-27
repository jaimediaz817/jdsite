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

## ✅ REGLAS DE ORO

1.  ❌ NUNCA modificas nada en base de datos manualmente
2.  ❌ NUNCA subes imágenes por ningún otro lado
3.  ✅ La carpeta `blogs_source/` es la ÚNICA fuente de verdad
4.  ✅ Si algo se rompe, vuelves a ejecutar `import_blogs` y todo vuelve a funcionar
5.  ✅ Puedes borrar, modificar, mover carpetas cuando quieras