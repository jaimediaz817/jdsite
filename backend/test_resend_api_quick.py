#!/usr/bin/env python
"""
Test rápido Resend API - Lee la key del .env manualmente
"""

import os
import re
import requests
from pathlib import Path

# Leer .env manualmente sin dependencias
env_path = Path(__file__).parent / ".env"
api_key = ""
try:
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("EMAIL_HOST_PASSWORD="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
except:
    api_key = os.getenv("EMAIL_HOST_PASSWORD", "")

API_KEY = api_key

print("🧪 Test rápido Resend API")
print("=" * 40)

# Test 1: Verificar API key
print(f"\n1. API Key: {API_KEY[:10]}...")

# Test 2: Probar endpoint
url = "https://api.resend.com/emails"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

data = {
    "from": "Jaime Diaz <contacto@jaimediaz.dev>",
    "to": ["jdsolutions817@gmail.com"],
    "subject": "Test desde script",
    "text": "Prueba de API key",
}

print(f"\n2. Enviando a: {data['to']}")
print(f"   Desde: {data['from']}")

try:
    response = requests.post(url, json=data, headers=headers, timeout=10)
    print(f"\n3. Respuesta: {response.status_code}")

    if response.status_code in (200, 201):
        print("   ✅ ¡Funciona!")
    else:
        print(f"   ❌ Error: {response.text}")
        print("\n   POSIBLES CAUSAS:")
        print("   - Dominio jaimediaz.dev no verificado en Resend")
        print("   - API key revocada")
        print("   - Email 'from' no permitido")

except Exception as e:
    print(f"\n❌ Error de conexión: {e}")

print("\n" + "=" * 40)
