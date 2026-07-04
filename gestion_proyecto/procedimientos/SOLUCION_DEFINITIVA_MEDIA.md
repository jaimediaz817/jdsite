# 🔥 SOLUCIÓN DEFINITIVA - Error 500 en upload-file y blogs_source

## Errores posibles:
```
# Error 1 (upload-file):
PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/media/blog_editor_temp/4'

# Error 2 (crear blog):
PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/2026-07-03_mi-primer-articulo-en-produccion/blog.md'
```

---

## ❓ ¿Por qué borrar el directorio existente?

**No es obligatorio**, pero se hace por:
1. **Eliminar permisos heredados incorrectos** - Si `blog_editor_temp/4` fue creado por root, tiene dueño root:root y Django no puede escribir
2. **ACL acumuladas** - Permisos complejos anteriores pueden interferir
3. **Partir de limpio** - Garantiza que todo tenga los mismos permisos

---

## ✅ COMANDO QUE SIEMPRE FUNCIONA (copia y pega en tu VPS):

```bash
# ============================================
# PASO 1: Ir al directorio correcto
# ============================================
cd /var/www/jdiaz.tipsterbyte.com/app/

# ============================================
# PASO 2: Borrar y recrear todo media
# ============================================
rm -rf backend/media/
mkdir -p backend/media/blog_editor_temp/

# ============================================
# PASO 3: Permisos ULTRA PERMISSIVOS (777)
# ============================================
chmod -R 777 backend/media/

# ============================================
# PASO 4: Cambiar dueño al usuario ACTUAL
# ============================================
sudo chown -R $(whoami):$(whoami) backend/media/

# ============================================
# PASO 5: Si Gunicorn usa www-data
# ============================================
sudo chown -R www-data:www-data backend/media/ 2>/dev/null || true

# ============================================
# PASO 6: Reiniciar Django
# ============================================
sudo systemctl restart jdiaz_gunicorn.service

# ============================================
# PASO 7: Verificar
# ============================================
ls -la backend/media/
```

---

## 🔥 SOLUCIÓN PARA blogs_source (Error 2):

```bash
chmod -R 777 backend/blogs_source/
sudo chown -R www-data:www-data backend/blogs_source/ 2>/dev/null || true
sudo systemctl restart jdiaz_gunicorn.service
```

---

## 🔥 SOLUCIÓN PARA static/blogs (Error 3):

```bash
chmod -R 777 backend/static/blogs/
sudo chown -R www-data:www-data backend/static/blogs/ 2>/dev/null || true
sudo systemctl restart jdiaz_gunicorn.service
```

---

## 🚨 ALTERNATIVA: Si el error persiste

### Verifica quién ejecuta Gunicorn:
```bash
ps aux | grep gunicorn | grep -v grep
```

### Usa ACL (más fuerte que chmod):
```bash
sudo apt-get install acl -y
sudo setfacl -R -m u:www-data:rwx /var/www/jdiaz.tipsterbyte.com/app/backend/media/
sudo setfacl -R -d -m u:www-data:rwx /var/www/jdiaz.tipsterbyte.com/app/backend/media/
sudo systemctl restart jdiaz_gunicorn.service
```

---

## 💡 Nota importante:
- El `4` en `blog_editor_temp/4` es el ID de usuario en la base de datos
- El directorio se crea AUTOMÁTICAMENTE cuando subas una imagen
- Si tienes múltiples usuarios, cada uno tendrá su carpeta (5, 6, 7, etc.)

---

## ⚠️ IMPORTANTE: Usa `sudo` si ves "Operation not permitted"

Si el `chmod` falla con `Operation not permitted`, significa que el directorio fue creado por otro usuario (probablemente root). Ejecuta:

```bash
# Con sudo obligatorio:
sudo chmod -R 777 backend/media/
sudo chmod -R 777 backend/blogs_source/
sudo chmod -R 777 backend/static/blogs/
