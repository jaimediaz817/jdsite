# DIAG-003: Errores 500 en Editor de Blog (Producción) - FINAL

## Problemas identificados

### 1. Upload de imágenes (FilePond) - Error 500
- Endpoint: `POST /blog/api/upload-file/`
- Causa: El usuario web (www-data) no tiene permisos de escritura en `media/`

### 2. Guardar borrador - Permission denied
- Error: `[Errno 13] Permission denied: '/var/www/.../static/blogs/...'`
- Causa: El usuario web no puede crear la carpeta `static/blogs/`

---

## 🔧 Solución DEFINITIVA (Usuario: www-data)

```bash
# Ir al directorio del proyecto
cd /var/www/jdiaz.tipsterbyte.com/app

# Arreglar permisos de escritura (static/blogs/ DEBE existir o crearse)
sudo chown -R www-data:www-data backend/media/
sudo chown -R www-data:www-data backend/blogs_source/
sudo chown -R www-data:www-data backend/static/blogs/  # Si no existe, créalo:

# Crear static/blogs/ si no existe
sudo mkdir -p backend/static/blogs/
sudo chown -R www-data:www-data backend/static/blogs/

# Permisos 755
sudo chmod -R 755 backend/media/
sudo chmod -R 755 backend/blogs_source/
sudo chmod -R 755 backend/static/blogs/

# Reiniciar Gunicorn
sudo systemctl restart gunicorn
```

---

## ✅ Comando único (actualizado)

```bash
cd /var/www/jdiaz.tipsterbyte.com/app && sudo mkdir -p backend/static/blogs/ && sudo chown -R www-data:www-data backend/{media,blogs_source,static/blogs} && sudo chmod -R 755 backend/{media,blogs_source,static/blogs} && sudo systemctl restart gunicorn && echo "✅ Listo"