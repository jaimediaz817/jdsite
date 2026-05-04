# Skill: Django — jdsite_clean

## Stack
- Django 4.x + Python 3.11+
- Entorno virtual en `.venv/Scripts/activate` (Windows)
- Comandos siempre desde `/backend`, nunca desde la raíz

## Convenciones
- Vistas basadas en clases para CRUD, funciones para lógica simple
- URLs en snake_case: `blog_detail`, `user_profile`
- Modelos siempre con `__str__` definido
- `get_object_or_404` en lugar de try/except en vistas
- Formularios con Django Forms o ModelForms, nunca lógica en templates

## Estructura de apps
- Cada app: `models.py`, `views.py`, `urls.py`, `forms.py`
- Lógica de negocio en `services.py`, no en vistas
- Templates en `backend/templates/<app_name>/`
- Statics en `backend/<app>/static/<app>/`

## Reglas
- Sin dependencias nuevas sin aprobación explícita
- Sin queries raw SQL salvo casos muy justificados
- Sin lógica en templates, solo presentación
- Migraciones con nombre descriptivo
- NUNCA editar migraciones ya aplicadas
- Vistas con POST AJAX: agregar `@csrf_protect` (o asegurar `@csrf_exempt` si corresponde) para evitar 405 Method Not Allowed. El formulario debe enviar `X-CSRFToken` en headers.