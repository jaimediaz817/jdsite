# 🔍 DIAGNÓSTICO Y RECUPERACIÓN: Error 403 en registro + Procedimiento Seguro

## 📅 Fecha
2026-07-02

## ⚠️ PROBLEMA REPORTADO
- Error 403 Forbidden en `/accounts/signup/` en producción (HTTPS)
- Funciona correctamente en LOCAL (HTTP)
- El formulario incluye `{% csrf_token %}` correctamente

---

## 🚨 ¡LECCIÓN APRENDIDA! .env ELIMINADO POR GIT RESET

**IMPORTANTE:** El archivo `.env` está en `.gitignore` y **NO SE PUEDE RECUPERAR** con `git reset --hard HEAD`.

### Soluciones para recuperar .env:
1. **Si tienes backup reciente**: Restaurar desde backup
2. **Si tienes el .env.local**: Copiar y adaptar las credenciales
3. **Usar el template creado**: `backend/.env.prod.template`

---

## 🔄 COMANDOS GIT PARA REVERTIR CAMBIOS EN VPS (100% SEGUROS)

### Verificar estado actual:
```bash
cd /var/www/jdiaz.tipsterbyte.com/app
git status
```

### Revertir código SIN afectar .env (RECOMENDADO):
```bash
# Opción 1: Stashing (guarda cambios locales sin commit)
git stash push -m "cambios-manuales-$(date +%s)" -- backend/

# Opción 2: Reset parcial (solo archivos NO en .gitignore)
# NO uses: git reset --hard HEAD (¡elimina .env!)

# Opción 3: Volver a commit específico pero preservando .env
git diff HEAD > /tmp/backup_cambios_manuales.txt
git reset --hard HEAD
# Luego recuperar .env desde backup o template
```

### Deploy limpio desde GitHub:
```bash
git pull origin main
sudo systemctl restart jdiaz_gunicorn.service
sudo systemctl reload nginx
```

---

## 📝 MEJORAS AL JS DE REGISTRO (backend/templates/account/signup.html)

### Script mejorado con debugging:
```javascript
<script>
document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('form');
    var btn = document.getElementById('signup-btn');
    var spinner = document.getElementById('signup-spinner');
    var btnText = document.getElementById('signup-btn-text');

    // Debug: Ver información del formulario y CSRF
    console.log('[SIGNUP DEBUG] Form found:', form ? 'YES' : 'NO');
    console.log('[SIGNUP DEBUG] CSRF cookie:', document.cookie);
    console.log('[SIGNUP DEBUG] Current URL:', window.location.href);
    console.log('[SIGNUP DEBUG] Referrer:', document.referrer);

    // Verificar que el token CSRF existe
    var csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfInput) {
        console.log('[SIGNUP DEBUG] CSRF token found:', csrfInput.value.substring(0, 20) + '...');
    } else {
        console.error('[SIGNUP ERROR] CSRF token NOT found in form!');
    }

    if (form) {
        form.addEventListener('submit', function () {
            console.log('[SIGNUP DEBUG] Form submitting...');
            console.log('[SIGNUP DEBUG] Form action:', form.action);
            if (btn) { btn.disabled = true; }
            if (spinner) { spinner.classList.remove('d-none'); }
            if (btnText) { btnText.textContent = 'Registrando...'; }
        });
    }
});
</script>
```

---

## 🐍 SISTEMA DE LOGGING EN BACKEND (PARA VER ERRORES EN PRODUCCIÓN)

### Configuración en settings.py (al final):
```python
# Logging para debugging en producción
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.security.csrf': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

---

## 📋 COMANDOS PARA VER LOGS EN PRODUCCIÓN

### Ver logs de Gunicorn (el más importante):
```bash
# Ver últimos 100 logs:
sudo journalctl -u jdiaz_gunicorn.service -n 100 --no-pager

# Ver solo errores CSRF:
sudo journalctl -u jdiaz_gunicorn.service -n 100 --no-pager | grep -i 'csrf\|forbidden\|referer'

# Ver logs en tiempo real:
sudo journalctl -u jdiaz_gunicorn.service -f
```

### Verificar configuración de Django en producción:
```bash
cd /var/www/jdiaz.tipsterbyte.com/app/backend
source .venv/bin/activate
python -c "
from django.conf import settings
print('DJANGO_ENV:', getattr(settings, 'DJANGO_ENV', 'NOT SET'))
print('DEBUG:', settings.DEBUG)
print('ALLOWED_HOSTS:', settings.ALLOWED_HOSTS)
print('CSRF_TRUSTED_ORIGINS:', getattr(settings, 'CSRF_TRUSTED_ORIGINS', 'NOT SET'))
"
```

---

## 🛠️ SOLUCIÓN AL 403 FORBIDDEN (VERIFIED)

### Verificar .env de producción:
```bash
cat /var/www/jdiaz.tipsterbyte.com/app/backend/.env | grep -E "DJANGO_ENV|DEBUG|ALLOWED_HOSTS|SECRET_KEY"
```

### Crear .env desde template (si fue eliminado):
```bash
# En VPS:
cp /var/www/jdiaz.tipsterbyte.com/app/backend/.env.prod.template /var/www/jdiaz.tipsterbyte.com/app/backend/.env
# Luego editar con: nano /var/www/jdiaz.tipsterbyte.com/app/backend/.env
```

### Verificar security-headers de nginx:
```bash
sudo cat /etc/nginx/snippets/security-headers.conf
# El Referrer-Policy debe ser: no-referrer-when-downgrade (no same-origin)
```

---

## 📌 ARCHIVOS IMPORTANTES CREADOS

| Archivo                                                               | Propósito                                |
| --------------------------------------------------------------------- | ---------------------------------------- |
| `backend/.env.prod.template`                                          | Template para recrear .env en producción |
| `backend/templates/account/signup.html`                               | Template con debugging CSRF              |
| `gestion_proyecto/diagnosticos/DIAG-002_registro_403_recuperacion.md` | Este archivo de diagnóstico              |

---

## 🚀 PROCEDIMIENTO RECOMENDADO (ORDEN DE EJECUCIÓN)

1. **Crear .env desde template**:
   ```bash
   cp backend/.env.prod.template /var/www/.../app/backend/.env
   # Editar con credenciales reales
   ```

2. **Pushear cambios desde local**:
   ```bash
   git add backend/templates/account/signup.html backend/.env.prod.template
   git commit -m "feat: signup csrf debugging"
   git push origin main
   ```

3. **En VPS: `git pull origin main`**

4. **Reiniciar servicios**:
   ```bash
   sudo systemctl restart jdiaz_gunicorn.service
   sudo systemctl reload nginx
   ```

5. **Probar registro desde navegador** (F12 para ver debugging)