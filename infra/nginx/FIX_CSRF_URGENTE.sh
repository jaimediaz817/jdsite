#!/bin/bash
# 🔥 SCRIPT DE EMERGENCIA PARA ARREGLAR CSRF 403 EN VPS

# Hacer backup del settings.py actual
cp /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py.bak

# Agregar CSRF_TRUSTED_ORIGINS si no existe
grep -q "CSRF_TRUSTED_ORIGINS" /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py || cat >> /var/www/jdiaz.tipsterbyte.com/app/backend/jdsite/settings.py << 'EOF'

# ============================================
# CSRF SECURITY SETTINGS FOR PRODUCTION (EMERGENCY FIX)
# ============================================
CSRF_TRUSTED_ORIGINS = [
    "https://jaimediaz.dev",
    "https://www.jaimediaz.dev",
]
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
EOF

# Reiniciar servicios
sudo systemctl restart jdiaz_gunicorn.service
sleep 3
sudo systemctl reload nginx

echo "✅ Listo. Verifica el registro."