# 1. Arreglar permisos del MEDIA_ROOT (el directorio padre)
sudo chown -R jdiaz:jdiaz /var/www/jdiaz.tipsterbyte.com/app/backend/media/
sudo chmod -R 755 /var/www/jdiaz.tipsterbyte.com/app/backend/media/

# 2. Asegurar que existe el directorio
mkdir -p /var/www/jdiaz.tipsterbyte.com/app/backend/media/blog_editor_temp/

# 3. Reiniciar Gunicorn
sudo systemctl restart jdiaz_gunicorn.service






# === PASO 1: Ir al directorio ===
cd /var/www/jdiaz.tipsterbyte.com/app/

# === PASO 2: Crear directorio y dar permisos 777 (diagnóstico) ===
mkdir -p backend/media/blog_editor_temp/
chmod -R 777 backend/media/

# === PASO 3: Reiniciar Gunicorn ===
sudo systemctl restart jdiaz_gunicorn.service

# === PASO 4: Probar subir imagen en el editor ===










## 📋 Explicación completa del error y solución

### 🔴 **Error identificado (de los logs):**
```
PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/media/blog_editor_temp/4'
```

### 📍 **Causa raíz:**
El código en `backend/blog/services.py` línea 703 crea un directorio `blog_editor_temp/{user_id}/` para guardar imágenes temporales, pero el usuario que ejecuta Gunicorn **no tiene permiso de escritura**.

### 📁 **Estructura que necesita el editor:**
```
backend/media/
  └── blog_editor_temp/
      └── {id_usuario}/     ← Se crea automáticamente
          └── imagen.jpg    ← Archivo temporal
```

### ✅ **Solución en `gestion_proyecto/procedimientos/SOLUCION_DEFINITIVA_MEDIA.md`:**

1. **`rm -rf backend/media/`** - Borrar directorio existente
2. **`mkdir -p backend/media/blog_editor_temp/`** - Crear directorio vacío
3. **`chmod -R 777`** - Permisos totales (lectura/escritura/ejecución)
4. **`chown`** - Cambiar dueño a usuarios correctos (www-data o jdiaz)
5. **`systemctl restart`** - Aplicar cambios

### 💡 **Después de aplicar:**
Sube una imagen y el código creará automáticamente el directorio `blog_editor_temp/4/` (el `4` es tu ID de usuario).
cd /var/www/jdiaz.tipsterbyte.com/app/
rm -rf backend/media/
mkdir -p backend/media/blog_editor_temp/
chmod -R 777 backend/media/
sudo chown -R $(whoami):$(whoami) backend/media/
sudo chown -R www-data:www-data backend/media/ 2>/dev/null || true
sudo systemctl restart jdiaz_gunicorn.service












cd /var/www/jdiaz.tipsterbyte.com/app/
chmod -R 777 backend/media/
chmod -R 777 backend/blogs_source/
sudo chown -R www-data:www-data backend/media/ backend/blogs_source/
sudo systemctl restart jdiaz_gunicorn.service



cd /var/www/jdiaz.tipsterbyte.com/app/
sudo chmod -R 777 backend/media/ backend/blogs_source/ backend/static/blogs/
sudo chown -R www-data:www-data backend/media/ backend/blogs_source/ backend/static/blogs/
sudo systemctl restart jdiaz_gunicorn.service


