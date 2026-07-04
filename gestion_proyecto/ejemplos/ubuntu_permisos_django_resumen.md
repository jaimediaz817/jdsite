# Ubuntu: Permisos para Django en Producción

## 🎯 Problema común
Error 500 al subir archivos o crear carpetas desde aplicaciones web en Django.

## 🔧 Solución definitiva (3 directorios)

```bash
# Ir al proyecto
cd /var/www/jdiaz.tipsterbyte.com/app

# 1. CREAR el directorio que falta
sudo mkdir -p backend/static/blogs/

# 2. Asignar propietario (www-data es el usuario por defecto)
sudo chown -R www-data:www-data backend/{media,blogs_source,static/blogs}

# 3. Asignar permisos 755
sudo chmod -R 755 backend/{media,blogs_source,static/blogs}

# 4. Reiniciar servidor web
sudo systemctl restart gunicorn
```

## ✅ Comando único

```bash
cd /var/www/tu-dominio.com && sudo mkdir -p backend/static/blogs/ && sudo chown -R www-data:www-data backend/{media,blogs_source,static/blogs} && sudo chmod -R 755 backend/{media,blogs_source,static/blogs} && sudo systemctl restart gunicorn && echo "✅ Listo"
```

## ⚠️ Notas

- `mkdir -p` crea la carpeta y **todas las padres necesarias** si no existen
- Si la carpeta ya existe, `mkdir -p` no hace nada (seguro de ejecutar)
- El usuario **www-data** en Ubuntu/Debian ejecuta el servidor web
- El error "Permission denied" desaparece cuando el propietario puede escribir