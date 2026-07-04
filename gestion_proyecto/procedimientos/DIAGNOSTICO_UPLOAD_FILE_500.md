# 🔥 Diagnóstico Upload File 500 Error

## Error reportado (del log anterior):
```
PermissionError: [Errno 13] Permission denied: '/var/www/jdiaz.tipsterbyte.com/app/backend/media/blog_editor_temp/4'
```

## 🔴 PRIMERO: Verifica los logs actuales

**Ejecuta en tu VPS:**
```bash
# Ver el error actual
sudo journalctl -u jdiaz_gunicorn.service --since '2 minutes ago' -n 30 --no-pager

# Si quieres ver en tiempo real mientras subes imagen:
sudo journalctl -u jdiaz_gunicorn.service -f
# (luego sube imagen en otra ventana del navegador)
```

## 🔍 Verifica quién ejecuta Gunicorn:

---

## Solución paso a paso:

```bash
# 1. Ir al directorio del proyecto
cd /var/www/jdiaz.tipsterbyte.com/app/

# 2. Ver estructura actual
ls -la backend/media/
ls -la backend/media/blog_editor_temp/ 2>/dev/null || echo "Directorio no existe"

# 3. Crear directorio si no existe
mkdir -p backend/media/blog_editor_temp/

# 4. Dar permisos totales temporalmente (diagnóstico)
chmod -R 777 backend/media/

# 5. Probar subida de imagen
# Recarga la página del editor y sube una imagen

# 6. Si funciona, ajustar permisos correctos:
# sudo chown -R www-data:www-data backend/media/
# sudo chmod -R 775 backend/media/
```

## Si el error persiste:

```bash
# Ver quién ejecuta Gunicorn
ps aux | grep gunicorn | head -3

# Ver logs en tiempo real
sudo journalctl -u jdiaz_gunicorn.service -f

# Verificar MEDIA_ROOT en Django
cd backend
source /app/env/bin/activate
python manage.py shell -c "from django.conf import settings; print('MEDIA_ROOT:', settings.MEDIA_ROOT)"