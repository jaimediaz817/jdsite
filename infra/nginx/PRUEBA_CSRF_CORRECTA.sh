#!/bin/bash
# 🔥 PRUEBA CSRF CON COOKIES Y TOKEN - EJECUTAR EN VPS

# 1. Obtener la página del formulario (guarda cookies y HTML)
curl -c /tmp/cookies.txt -s https://jaimediaz.dev/accounts/signup/ -o /tmp/form.html

# 2. Extraer el CSRF token del HTML
CSRF=$(grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]' /tmp/form.html)

# 3. Si no hay token, falla
if [ -z "$CSRF" ]; then
    echo "❌ No se encontró CSRF token en el formulario"
    exit 1
fi

echo "✅ CSRF Token encontrado: $CSRF"

# 4. Enviar POST con cookies y token
curl -b /tmp/cookies.txt -X POST https://jaimediaz.dev/accounts/signup/ \
  -d "csrfmiddlewaretoken=$CSRF&username=testuser123&password1=Testpass123&password2=Testpass123" \
  -H "Referer: https://jaimediaz.dev/accounts/signup/" \
  -w "HTTP_CODE: %{http_code}\n" -s -o /dev/null