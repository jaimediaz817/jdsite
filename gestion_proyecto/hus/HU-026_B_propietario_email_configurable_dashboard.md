# HU-026-B: Configuración de email propietario desde Dashboard

## Objetivo
Permitir al superadmin configurar el email de notificaciones desde el dashboard, con fallback automático a `settings.OWNER_EMAIL` cuando no haya valor configurado.

---

## Contexto actual

### Email actualmente hardcodeado
**Archivo:** `backend/jdsite/settings.py` (línea 166)
```python
OWNER_EMAIL = os.getenv("OWNER_EMAIL")  # Sin valor por defecto
```

**Archivo:** `backend/blog/services.py` (línea 558)
```python
send_mail(..., recipient_list=[settings.OWNER_EMAIL])
```

---

## Flujo solicitado

### Prioridad de obtención del email
1. **Primero:** Buscar en tabla `AdminConfig`/`SiteSetting` el email configurado
2. **Fallback:** Si no existe o es NULL, usar `settings.OWNER_EMAIL` (desde .env)
3. **Sin afectar:** El mecanismo actual sigue funcionando sin cambios

---

## Arquitectura propuesta

### Opción 1: Tabla de parámetros (recomendado)
```python
# backend/blog/models.py
class AdminConfig(models.Model):
    key = models.CharField(max_length=100, unique=True)  # 'owner_email'
    value = models.EmailField(null=True, blank=True)
    description = models.CharField(max_length=200)
    
    @classmethod
    def get_owner_email(cls):
        config = cls.objects.filter(key='owner_email').first()
        if config and config.value:
            return config.value
        return settings.OWNER_EMAIL
```

### Opción 2: Singleton en settings (más simple)
```python
# backend/blog/utils.py
def get_owner_email():
    # Intentar desde DB primero
    from .models import AdminConfig
    config = AdminConfig.objects.filter(key='owner_email').values_list('value', flat=True).first()
    if config:
        return config
    return settings.OWNER_EMAIL
```

---

## Archivos involucrados

1. **`backend/blog/models.py`** - Nuevo modelo `AdminConfig`
2. **`backend/blog/views.py`** - Vista para gestión de configuración
3. **`backend/blog/templates/blog/dashboard_config.html`** - Template aside (inspirado en sidebar)
4. **`backend/blog/urls.py`** - Nueva URL `dashboard_config/`
5. **`backend/blog/services.py`** - Usar función `get_owner_email()` en lugar de `settings.OWNER_EMAIL`

---

## Diseño del aside (inspirado en sidebar)

### Ubicación en dashboard
```
┌───────────────────────────────────────────┐
│  📊 Dashboard de Moderación              │
│                                           │
│  +------------------+   +----------------+ │
│  |   TABLA        |   | ⚙️ CONFIG      | │
│  |                |   |                | │
│  | Artículos...   |   | Email:         │ │
│  | Stats...       |   | [admin@jmdz...]│ │
│  |                |   |                | │
│  +------------------+   | [ Guardar ]    | │
│                        |                | │
│                        | Tooltip:       │ │
│                        | "Email para...│ │
│                        +----------------+ │
└───────────────────────────────────────────┘
```

### Estructura HTML del aside
```html
<!-- Based on the sidebar structure from blog_list.html -->
<aside class="absolute-sidebar config-sidebar">
    <div class="config-section">
        <h4 class="config-title">⚙️ Gestión de Notificaciones</h4>
        
        <div class="config-item">
            <label class="config-label">Email propietario</label>
            <input type="email" 
                   class="form-control config-input" 
                   id="owner-email-input"
                   value="{{ owner_email }}"
                   title="Email para notificaciones de nuevos borradores">
            <small class="config-help">Recibe notificaciones cuando autores envían borradores</small>
        </div>
        
        <button class="btn btn-sm btn-primary config-save-btn">
            <i class="fas fa-save me-1"></i>Guardar
        </button>
    </div>
</aside>
```

---

## Estilos CSS (inspirados en blog_sidebar.css)
```css
.config-sidebar {
    position: sticky;
    top: 20px;
    width: 280px;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
}

.config-title {
    font-size: .85rem;
    font-weight: 600;
    color: #6f42c1;
    margin-bottom: 15px;
    border-bottom: 1px solid #e4e4e7;
    padding-bottom: 8px;
}

.config-input {
    font-size: .8rem;
    padding: 6px 10px;
}

.config-help {
    color: #6b7280;
    font-size: .72rem;
}
```

---

## Pasos de implementación

### Fase 1: Backend - Modelo
- [x] Crear modelo `AdminConfig` con campo `owner_email`
- [x] Crear migration inicial

### Fase 2: Backend - Utils
- [x] Crear función `get_owner_email()` con fallback
- [x] Modificar `services.py` para usar la nueva función

### Fase 3: Backend - Views
- [x] Endpoint AJAX para guardar cambios (`save_owner_email_ajax`)

### Fase 4: Frontend - Template
- [x] Crear partial `_dashboard_config_sidebar.html`

---

## Archivos modificados
1. ✅ `backend/blog/models.py` - Modelo `AdminConfig` agregado
2. ✅ `backend/blog/migrations/0016_admin_config.py` - Migration creada
3. ✅ `backend/blog/migrations/0020_merge_20260706_0318.py` - Merge migration aplicada
4. ✅ `backend/blog/admin.py` - Registro en admin
5. ✅ `backend/blog/utils.py` - Función `get_owner_email()` agregada
6. ✅ `backend/blog/utils/__init__.py` - Exportación de `get_owner_email` agregada
7. ✅ `backend/blog/views.py` - Vista `save_owner_email_ajax` agregada
8. ✅ `backend/blog/services.py` - Referencias a `settings.OWNER_EMAIL` reemplazadas
9. ✅ `backend/blog/templates/blog/partials/_dashboard_config_sidebar.html` - Template creado
10. ✅ `backend/blog/static/blog/js/dashboard.js` - JS para guardar vía AJAX
11. ✅ `backend/blog/static/blog/css/dashboard.css` - Estilos para el aside

---

## Estado
- **Estado:** IMPLEMENTADO (HU-026-B completado)
- **Prioridad:** Baja (extensión de HU-026)
- **Complejidad:** Media

---

## Estado
- **Estado:** IMPLEMENTADO (HU-026-B completado)
- **Prioridad:** Baja (extensión de HU-026)
