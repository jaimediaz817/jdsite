# Comandos para ver logs de Django en producción (Ubuntu)

## 🔍 Ver logs en tiempo real (tu caso: jdiaz_gunicorn)

```bash
# Logs de tu servicio específico
sudo journalctl -u jdiaz_gunicorn.service -f

# Últimos 50 registros
sudo journalctl -u jdiaz_gunicorn.service -n 50 --no-pager

# Filtrar errores del editor
sudo journalctl -u jdiaz_gunicorn.service -n 100 --no-pager | grep -A 20 -B 5 "save_blog\|ERROR\|Traceback\|Exception"
```

## 📋 Si no hay logs en journalctl

```bash
# Buscar archivo de logs manual
ls -la /var/www/jdiaz.tipsterbyte.com/logs/
sudo tail -f /var/www/jdiaz.tipsterbyte.com/logs/*.log

# O verificar en /var/log/
sudo ls -la /var/log/ | grep -i gunicorn
sudo tail -f /var/log/gunicorn/error.log 2>/dev/null || echo "No existe"
```

## 🛠️ Reiniciar con el nombre correcto

```bash
# Reiniciar tu servicio
sudo systemctl restart jdiaz_gunicorn.service

# Verificar que está corriendo
sudo systemctl status jdiaz_gunicorn.service
```

## ⚡ Debug rápido

```bash
# Ver errores recientes del editor
sudo journalctl -u jdiaz_gunicorn.service --since "10 minutes ago" | grep -i "error\|traceback"
```

---

## 🎯 Error actual: "Unexpected token '<'..."

El endpoint `POST /blog/api/save-blog/` está devolviendo HTML de error 500. **Ejecuta:**

```bash
sudo journalctl -u jdiaz_gunicorn.service -n 50 --no-pager | grep -A 20 -B 5 "save_blog"
```

Y dime qué error aparece exactamente.