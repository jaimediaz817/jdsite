# HU-032: Sidebar visible únicamente para superadmin en dashboard

## Objetivo
Que el sidebar lateral (`absolute-sidebar blog-sidebar`) en el dashboard de moderación sea visible **únicamente para usuarios superadmin**. Los usuarios authors/staff no superadmin no deben ver el sidebar ni el espacio que ocupa, permitiendo que el contenido principal se expanda al ancho total disponible.

## Criterios de aceptación
- [ ] El sidebar `absolute-sidebar blog-sidebar` solo se renderiza cuando `user.is_superuser` es `True`
- [ ] Para usuarios no superadmin, el contenido principal ocupa el ancho total sin dejar espacio vacío del sidebar
- [ ] No se modifica la lógica existente para superadmin (mantienen su sidebar y estilos)
- [ ] Se mantiene la compatibilidad con el botón toggle para móviles (`sidebar-header-toggle`)

## Implementación
### Paso 1: Modificar `dashboard.html`
- Envolver el `<aside>` del sidebar en una condición `{% if user.is_superuser %}`
- El contenido principal debe adaptarse dinámicamente

### Paso 2: Actualizar CSS `blog_sidebar.css`
- Agregar estilos para `.blog-wrapper--no-sidebar` que ocupe todo el ancho
- Asegurar que `.blog-main` no tenga margen izquierdo cuando el sidebar no está presente

## Estado
- Estado: IMPLEMENTADO