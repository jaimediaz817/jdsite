# 🚀 PROCEDIMIENTO ESTANDAR DESPLIEGUE A PRODUCCION
## VERSION 1.0

---

### 🎯 IDENTIFICACION
| Campo                | Valor                           |
| -------------------- | ------------------------------- |
| **ID Procedimiento** | PROC-002                        |
| **Version**          | 1.0                             |
| **Fecha creacion**   | 28/04/2026                      |
| **Responsable**      | Jaime Díaz                      |
| **Tiempo estimado**  | 7 minutos                       |
| **Entorno objetivo** | VPS Produccion Nginx + Gunicorn |

---

## 📋 PRE REQUISITOS OBLIGATORIOS ANTES DE EMPEZAR
✅ ✅ ✅
- [ ] Tienes acceso SSH a la VPS
- [ ] Tienes el archivo `.env` de produccion actualizado
- [ ] El codigo esta pusheado a la rama `main` en Github
- [ ] Tienes al menos 512mb de RAM libre en el servidor
- [ ] No hay despliegues en curso

---

## 🔴 PASOS DE DESPLIEGUE EN ORDEN ESTRICTO

### 🟠 PASO 1: Conectarse al servidor
```bash
ssh usuario@ip-servidor
cd /var/www/jdsite
```

### 🟠 PASO 2: Actualizar codigo desde repositorio
```bash
git status
git pull origin main
```
> ✅ IMPORTANTE: Si hay conflictos ABORTAR inmediatamente

### 🟠 PASO 3: Activar entorno virtual
```bash
source venv/bin/activate
```

### 🟠 PASO 4: Instalar dependencias nuevas (si existen)
```bash
pip install -r requirements.txt
```

### 🟠 PASO 5: Ejecutar migraciones de base de datos
```bash
python manage.py migrate
```
> ✅ SOLO ejecutar migraciones que NO sean destructivas. Nunca borrar tablas en produccion

### 🟠 PASO 6: Recolectar archivos estaticos
```bash
python manage.py collectstatic --noinput
```
> ✅ Este paso actualiza CSS, JS, imagenes. Obligatorio SIEMPRE

### 🟠 PASO 7: Importar blogs actualizados
```bash
python manage.py import_blogs
```

### 🟠 PASO 8: Reiniciar servicio Gunicorn
```bash
sudo systemctl restart gunicorn
```

### 🟠 PASO 9: Verificar estado del servicio
```bash
sudo systemctl status gunicorn
```
> ✅ Debe aparecer `active (running)` en verde

### 🟠 PASO 10: Prueba de humo
```bash
curl -I https://jaimediaz.dev
```
> ✅ Debe retornar codigo 200 OK

---

## ✅ CHECKLIST DE VERIFICACION POST DESPLIEGUE
- [ ] La pagina carga sin errores 500
- [ ] Los estilos CSS cargan correctamente
- [ ] Los blogs se muestran correctamente
- [ ] Los tags dinámicos aparecen en los articulos
- [ ] El formulario de contacto funciona
- [ ] El envio de correos funciona
- [ ] Google Search Console no reporta errores

---

## ⚠️ PROCEDIMIENTO DE ROLLBACK SI ALGO FALLA
```bash
git reset --hard HEAD~1
sudo systemctl restart gunicorn
```
> ✅ Volver inmediatamente al commit anterior. No arreglar cosas en caliente en produccion

---

## 🔑 VARIABLES .ENV OBLIGATORIAS EN PRODUCCION
```env
DEBUG=False
SECRET_KEY=***
ALLOWED_HOSTS=jaimediaz.dev
DATABASE_URL=***
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=***
EMAIL_HOST_PASSWORD=***
```

---

> 📌 Ultima actualizacion: 28/04/2026
> 📌 Aplicable desde la version HU-006
> 📌 Este procedimiento es OBLIGATORIO para TODO despliegue