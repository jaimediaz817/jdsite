# 🔴 PROCEDIMIENTO DE EMERGENCIA — VPS Producción
## Fecha: 2026-07-05

---

## ⚠️ Problema #1: Permission Denied al guardar artículos

**Error:**
```
PermissionError: [Errno 13] Permission denied: 
'/var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/test_blog/blog.md'
```

### 🔍 Diagnóstico — Ejecutar en VPS (en orden):

```bash
# 1.1 - Qué usuario ejecuta gunicorn
ps aux | grep gunicorn | grep -v grep

# 1.2 - Propietario actual de blogs_source/
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/

# 1.3 - Propietario del archivo específico que falla
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/blogs_source/test_blog/

# 1.4 - Propietario raíz del proyecto
ls -la /var/www/jdiaz.tipsterbyte.com/app/backend/
```

### ✅ Solución:

```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend

# Dar permisos al usuario de gunicorn (generalmente www-data)
sudo chown -R www-data:www-data blogs_source/
sudo chmod -R u+rwX blogs_source/

# También asegurar static/blogs/ para las imágenes
sudo chown -R www-data:www-data static/blogs/
sudo chmod -R u+rwX static/blogs/

# Asegurar media/ también
sudo chown -R www-data:www-data media/
sudo chmod -R u+rwX media/
```

---

## ⚠️ Problema #2: 413 Request Entity Too Large

**Error nginx al subir imágenes:**
```
413 Request Entity Too Large
```

### 🔍 Diagnóstico:

```bash
# 2.1 - Buscar configuración actual de client_max_body_size
sudo grep -r "client_max_body_size" /etc/nginx/

# 2.2 - Ver configuración del sitio
sudo cat /etc/nginx/sites-available/jaimediaz.dev.conf

# 2.3 - Ver logs de nginx
sudo tail -50 /var/log/nginx/error.log
```

### ✅ Solución:

Editar el archivo de configuración de nginx:
```bash
sudo nano /etc/nginx/sites-available/jaimediaz.dev.conf
```

Agregar **dentro del bloque `server { }`** (o donde ya exista):
```nginx
client_max_body_size 20M;
```

Luego:
```bash
# Verificar sintaxis
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

---

## ✅ Verificación post-fix

```bash
# Verificar que nginx sirve archivos
curl -I http://localhost/static/blogs/

# Ver logs de Django
sudo journalctl -u jdiaz_gunicorn --no-pager -n 30

# Probar subida de imagen
curl -I http://localhost/static/blogs/