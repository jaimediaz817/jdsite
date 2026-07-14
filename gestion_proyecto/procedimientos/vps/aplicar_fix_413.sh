#!/bin/bash
# HU-042: Aplicar fix error 413 - aumentar límite de upload
# EJECUTAR EN LA VPS como root o con sudo

echo "=== Deteniendo nginx temporalmente ==="
systemctl stop nginx

echo "=== Respaldando configuración actual ==="
cp /etc/nginx/sites-enabled/jaimediaz.dev.conf /etc/nginx/sites-enabled/jaimediaz.dev.conf.bak.$(date +%Y%m%d_%H%M%S)

echo "=== Actualizando configuración de nginx ==="
# El archivo local ya tiene client_max_body_size 20m, pero lo forzamos desde aquí por seguridad
sed -i 's/client_max_body_size.*/client_max_body_size 20m;/g' /etc/nginx/sites-enabled/jaimediaz.dev.conf || echo "No se pudo actualizar con sed, verifica manualmente"

echo "=== Verificando configuración de nginx ==="
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración de nginx válida"
    echo "=== Iniciando nginx ==="
    systemctl start nginx
    echo "✅ nginx iniciado"
else
    echo "❌ Error en configuración de nginx, restaurando backup..."
    cp /etc/nginx/sites-enabled/jaimediaz.dev.conf.bak.* /etc/nginx/sites-enabled/jaimediaz.dev.conf 2>/dev/null || true
    systemctl start nginx
    echo "⚠️  Se restauró el backup, verifica la configuración manualmente"
    exit 1
fi

echo "=== Recargando gunicorn ==="
systemctl restart jdiaz_gunicorn

echo "=== Verificando estado ==="
systemctl status nginx --no-pager | head -n 5
echo ""
systemctl status jdiaz_gunicorn --no-pager | head -n 5

echo ""
echo "=== FIN: Fix 413 aplicado ==="
echo "Recuerda probar subiendo una imagen de 5-10MB para verificar"