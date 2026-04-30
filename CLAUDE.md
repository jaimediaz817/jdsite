# 📜 Reglas de Claude para el proyecto jdsite_clean
> Archivo permanente. Claude DEBE leer este archivo al principio de CUALQUIER sesión, CUALQUIER mensaje, CUALQUIER tarea.
> ESTAS REGLAS SON INQUEBRANTABLES, NUNCA OLVIDARLAS.

---

## 🟡 REGLAS DE ORO INQUEBRANTABLES

1.  **✅ Fases granulares SIEMPRE:**
    - NUNCA implementar más de UNA cosa a la vez
    - Cada paso es independiente, se prueba, se confirma, se pasa al siguiente
    - No abarcar más de 15 minutos de trabajo por solicitud
    - Siempre terminar cada fase antes de empezar la siguiente
    - NUNCA hacer multiples cambios en un solo mensaje

2.  **✅ Sin dependencias nuevas sin aprobación explícita:**
    - Usar siempre lo que ya está instalado en Django
    - Si se necesita instalar algo, preguntar PRIMERO
    - Preferir soluciones nativas sobre librerías de terceros

3.  **✅ Nunca romper lo existente:**
    - Cualquier modificación debe ser aditiva
    - NUNCA borrar código existente, solo comentar si es estrictamente necesario
    - Todo lo que funciona hoy, debe seguir funcionando mañana

4.  **✅ La fuente de verdad son los archivos:**
    - Todo contenido, configuración, datos empieza como archivo en disco
    - Base de datos es solo cache, nunca la fuente de verdad
    - Todo se puede reconstruir ejecutando comandos

5.  **✅ Documentación primero, código después:**
    - Primero escribimos la HU en `gestion_proyecto/hus/`
    - Luego definimos el plan
    - Luego escribimos el código

---

## 🟡 ESTRUCTURA DE TRABAJO

```
gestion_proyecto/
└── hus/
    ├── HU-001_blog_markdown_django.md
    ├── HU-002_xxxxxx.md
    └── ...
```

Cada Historia de Usuario tiene:
- ID numérico secuencial
- Objetivo claro
- Criterios de aceptación
- Pasos de implementación granular
- Estado

---

## 🟡 PROCESO DE IMPLEMENTACIÓN

1.  ✅ Crear HU y validamos requisitos
2.  ✅ Dividimos en fases de máximo 20 minutos cada una
3.  ✅ Implementamos UNA SOLA fase
4.  ✅ Probamos
5.  ✅ Confirmamos con el usuario
6.  ✅ Pasamos a la siguiente fase

---

## 🟡 GIT BASH / ENTORNO VIRTUAL (WINDOWS)

✅ **PROCEDIMIENTO OBLIGATORIO PARA CUALQUIER COMANDO DJANGO:**
```bash
# ✅ EN LA RAIZ DEL PROYECTO, SIEMPRE:
source .venv/Scripts/activate

# ✅ Luego entras a backend y ejecutas lo que necesites:
cd backend
python manage.py ...
```

✅ **NUNCA ejecutes comandos de Django sin activar antes el entorno virtual.**
✅ **NUNCA ejecutes python manage.py desde la raíz. Siempre dentro de /backend.**

✅ **Para salir del entorno y cambiar de proyecto:**
```bash
deactivate
```

✅ **SIEMPRE seguir este orden para NO TENER ERRORES de dependencias, rutas o módulos no encontrados.**

---

## 🟡 REGLAS ESPECIALES PARA CLAUDE DEV

✅ Hablar siempre en español
✅ Ser directo, no ponerse formal
✅ NUNCA empezar los mensajes con "Perfecto", "Claro", "Genial", "Entendido"
✅ Ir directo al grano
✅ Mostrar siempre el task_progress en todos los pasos
✅ No inventar informacion que no existe en los archivos

---

> ✅ Última actualización: 29/04/2026