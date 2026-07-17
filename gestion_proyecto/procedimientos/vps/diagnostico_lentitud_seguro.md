# Diagnóstico y corrección de lentitud en VPS Ubuntu 24.04 (SIN reiniciar servicios)

> Objetivo: Diagnosticar y aliviar la lentitud sin `reboot`, sin `shutdown`,
> y sin `systemctl restart` masivo. Solo se tocan procesos específicos o se
> reinicia un único servicio si es estrictamente necesario.

---

## ⚠️ REGLAS DE ORO PARA NO ROMPER NADA
1. **NUNCA** ejecutes `reboot`, `shutdown -r` ni `init 6`.
2. **NUNCA** hagas `systemctl restart` de todos los servicios.
3. Solo mata procesos específicos (por PID) si identificas el culpable.
4. `drop_caches` es SEGURO: no mata procesos, solo libera memoria de cache del SO.

---

## 🔍 PASO 1 — DIAGNÓSTICO (no afecta nada, solo lectura)

```bash
# 1. Carga del sistema (load average: si > número de CPUs, hay cuello de botella)
uptime

# 2. Memoria RAM y SWAP (si Swap usado es alto => está paginando => lentitud)
free -h

# 3. Disco (si / está al 100% => lentitud extrema y errores de escritura)
df -h

# 4. Top 15 procesos por CPU
ps aux --sort=-%cpu | head -15

# 5. Top 15 procesos por MEMORIA
ps aux --sort=-%mem | head -15

# 6. Servicios que FALLARON (no los reinicies aún, solo mira)
systemctl --failed

# 7. Errores recientes en logs del sistema (última 1h)
journalctl -p err -n 50 --since "1 hour ago"

# 8. I/O de disco (si %util está cerca de 100% => cuello de botella de disco)
#    Instalar si falta: sudo apt install sysstat
iostat -x 1 3
```

---

## 🎯 PASO 2 — IDENTIFICAR EL CULPABLE

```bash
# ¿Qué tanto espacio ocupan los logs? (a veces llenan el disco)
sudo du -sh /var/log/* 2>/dev/null | sort -h

# ¿Hay archivos de log mayores a 100MB?
sudo find /var/log -type f -size +100M 2>/dev/null

# ¿MySQL/MariaDB está consumiendo toda la RAM?
ps aux | grep -E 'mysql|mariadb' | grep -v grep

# ¿Cuántos procesos de Python/Gunicorn/Django hay corriendo?
ps aux | grep -E 'gunicorn|python|uwsgi' | grep -v grep | wc -l

# Uso de SWAP por proceso (si hay procesos con mucho SWAP => paginación)
cat /proc/*/status 2>/dev/null | grep -E '^(Name|VmSwap)' | paste - - | sort -k3 -h | tail -10
```

**Causas típicas en este proyecto (Django + Nginx + MySQL):**
- MySQL y Gunicorn peleando por RAM → el SO empieza a usar SWAP → lentitud brutal.
- Logs de Nginx/Django acumulados sin rotación → disco lleno.
- Procesos zombie de Gunicorn acumulados tras varios deploys.

---

## 🛠️ PASO 3 — CORRECCIONES SEGURAS (SIN tocar servicios)

### 3.1 Liberar memoria de cache del SO (100% SEGURO, no mata nada)
```bash
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```
> Esto libera pagecache, dentries e inodes. Los servicios siguen vivos.
> Es lo primero que debes probar si la RAM está apretada pero los servicios corren.

### 3.2 Rotar y limpiar logs sin reiniciar servicios
```bash
# Limpiar logs de systemd (mantiene últimos 7 días)
sudo journalctl --vacuum-time=7d

# Forzar rotación de logs de aplicaciones (no reinicia el servicio)
sudo logrotate -f /etc/logrotate.conf

# Limpiar /tmp de archivos viejos (modificados hace +7 días)
sudo find /tmp -type f -mtime +7 -delete 2>/dev/null
```

### 3.3 Matar SOLO un proceso runaway (identificado en Paso 2)
```bash
# Reemplaza PID con el ID del proceso culpable (NO el PID del servicio padre)
kill -15 PID      # intento elegante
# si no muere:
kill -9 PID       # forzado (último recurso)
```

---

## 🔄 PASO 4 — REINICIAR SOLO UN SERVICIO (si el Paso 3 no basta)

> Esto causa una interrupción BREVE (segundos) solo de ese servicio.
> Es seguro y NO es un reboot del servidor.

```bash
# Si Nginx está lento / acumulando conexiones:
sudo systemctl restart nginx

# Si Gunicorn/Django está lento (workers zombie acumulados):
sudo systemctl restart gunicorn
# o si usas socket:
sudo systemctl restart gunicorn.socket

# Si MySQL está paginando mucho (breve corte de BD ~1-3s):
sudo systemctl restart mysql
```

---

## ✅ CHECKLIST POST-CORRECCIÓN
```bash
uptime              # load average debe bajar
free -h             # swap usado debe bajar tras drop_caches
df -h               # / debe tener espacio libre
systemctl --failed  # debe seguir vacío o sin nuevos fallos
```

---

## 🚫 LO QUE NUNCA DEBES HACER
- `sudo reboot` / `sudo shutdown -r now` → reinicia TODO, rompe sesiones SSH activas.
- `systemctl isolate` / `systemctl default` → cambia el target, puede matar servicios.
- `kill -9` al PID padre de MySQL/Nginx/Gunicorn → caen todos los hijos.
- `rm -rf` en /var/log sin ver qué hay → pierdes auditoría.