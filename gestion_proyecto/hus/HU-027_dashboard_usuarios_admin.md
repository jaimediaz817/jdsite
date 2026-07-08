# HU-027: Gestión de Usuarios en Dashboard (Superadmin)

## Objetivo
Agregar un aside responsive en la dashboard para que el superadmin pueda gestionar usuarios del blog sin necesidad de acceder al administrador de Django.

## Criterios de Aceptación
- [x] El aside debe ser responsive (sidebar en móvil, offcanvas)
- [x] Solo visible para superusuarios
- [x] Listado de usuarios con sus estados (activo, staff, superuser, fecha registro)
- [x] Paginación de usuarios
- [ ] Búsqueda por username/email
- [x] Acciones básicas: activar/desactivar usuarios
- [x] Diseño consistente con el sidebar de blog_list

## Pasos de Implementación (Granulares)

### Fase 1: Modelo y estadísticas
- [x] Crear vista `dashboard_users_view` en `blog/views.py`
- [x] Agregar estadísticas de usuarios (total, activos, staff, superusers)

### Fase 2: Template
- [x] Crear template `dashboard_users.html`
- [x] Sidebar integrado en `dashboard.html` (partial `_dashboard_config_sidebar.html`)

### Fase 3: URLs
- [x] Agregar URL `dashboard/users/`
- [x] Agregar URL `dashboard/users/toggle/<int:user_id>/` (AJAX)

### Fase 4: JavaScript
- [x] Manejar toggle de activación vía AJAX

### Fase 5: Tests
- [ ] Verificar acceso solo superadmin
- [ ] Verificar paginación

## Estado
- Estado: ✅ Implementación completa (pendiente pruebas)

## Notas
- Usar el estilo del sidebar existente (`blog_sidebar.css`)
- Campos a mostrar: username, email, first_name, is_active, is_staff, is_superuser, registration_source, date_joined
- La vista principal `dashboard_view` ahora pasa `user_stats` al contexto para el sidebar