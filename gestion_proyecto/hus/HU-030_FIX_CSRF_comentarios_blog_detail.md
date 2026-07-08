# HU-030: FIX CSRF en comentarios - blog_detail.js

## 🚨 PROBLEMA IDENTIFICADO
- **Error**: "Unexpected token '<'" al enviar comentarios
- **Causa**: El header `X-CSRFToken` NO se incluye en los requests AJAX POST
- **Ubicación**: `backend/blog/static/blog/js/blog_detail.js` líneas 271 y 360

## 🔍 DIAGNOSTICO EN VPS
```bash
# Ver logs de CSRF fallidos
sudo journalctl -u jdiaz_gunicorn.service --since "10 minutes ago" | grep -i "csrf_diagnostic"

# Buscar errores específicos
sudo journalctl -u jdiaz_gunicorn.service -n 100 --no-pager | grep -B 5 -A 10 "403\|Forbidden"

# Ver respuesta completa del endpoint
curl -X POST https://jaimediaz.dev/blog/2026-04-26_mejoras_ui_ux_blog_historico_manualmente-05/comment/ \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 🔧 FIX REQUERIDO

### Archivo: `blog_detail.js`

**Línea 271 - submitMainCommentForm:**
```javascript
headers: { 
    'X-Requested-With': 'XMLHttpRequest', 
    'Accept': 'application/json',
    // AGREGAR:
    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value 
}
```

**Línea 360 - submitReplyForm:**
```javascript
fetch(form.action, { 
    method: 'POST', 
    body: new FormData(form), 
    credentials: 'same-origin', 
    headers: { 
        'X-Requested-With': 'XMLHttpRequest', 
        'Accept': 'application/json',
        // AGREGAR:
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value 
    } 
})
```

## ✅ COMPROBADO
- ✅ `csrfmiddlewaretoken` existe en el template
- ✅ Cookie CSRF se genera: `1ZVtV0HTDPcz2ooQI9dR`
- ✅ Token en form: `50M2ZWuKYEzcdPYLOpfh`
- ❌ Header `X-CSRFToken`: `NOT_FOUND`

## 📋 PASOS DE SOLUCIÓN
- [x] Agregar header X-CSRFToken en submitMainCommentForm (línea ~271)
- [x] Agregar header X-CSRFToken en submitReplyForm (línea ~360)
- [x] Verificar que el token se toma correctamente del input hidden

## 🔁 VERIFICACIÓN POST-FIX
```bash
# En la VPS
sudo systemctl restart jdiaz_gunicorn.service
sudo journalctl -u jdiaz_gunicorn.service -f

# Probar desde browser console:
fetch('/blog/test-slug/comment/', {
    method: 'POST',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
    },
    credentials: 'same-origin',
    body: new FormData(document.querySelector('#comment-form'))
})
```

---
HU creada: 2025-07-07
Estado: 🔥 **URGENTE - PRODUCCIÓN**