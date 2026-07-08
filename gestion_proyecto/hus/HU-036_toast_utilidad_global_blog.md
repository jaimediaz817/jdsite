# HU-036: Toast Global Reutilizable del Blog

## 🎯 Objetivo
Convertir el sistema de notificaciones toast premium actual en una **utilidad global reutilizable** del blog, eliminando código duplicado y permitiendo que cualquier página o funcionalidad del blog pueda mostrar toasts premium sin necesidad de reimplementar la lógica.

## 📋 Contexto

### Situación actual:
El toast premium existe en **DOS LUGARES** con el mismo código:

1. **`backend/blog/static/blog/js/blog_list.js`** (líneas 218-312)
   - Usado por: Clic en artículos desvinculados
   - Función: `showToast(message, type)`
   - Incluye: HTML dinámico, CSS classes, auto-hide 8s

2. **`backend/blog/templates/blog/blog_list.html`** (líneas 887-1014)
   - Usado por: Parámetros URL `?error=not_found&slug=...`
   - Función: `showToast(message, type)` (mismo nombre, código idéntico)
   - Incluye: HTML dinámico, CSS classes, auto-hide 8s

### Problemas actuales:
- ⚠️ **Código duplicado**: Misma función definida 2 veces
- ⚠️ **Mantenimiento doble**: Cambios requieren actualizar 2 archivos
- ⚠️ **Riesgo de divergencia**: Pueden comportarse diferente en el futuro
- ⚠️ **Logging excesivo**: 6 console.log en producción
- ⚠️ **Función fantasma**: `hideToast()` llamada pero no definida en el inline
- ⚠️ **Container duplicado**:Ambos scripts crean el mismo elemento DOM

### Beneficios esperados:
- ✅ **DRY**: Single Source of Truth para el toast
- ✅ **Reutilizable**: Cualquier página del blog puede usarlo
- ✅ **Mantenible**: Un solo lugar para cambios
- ✅ **Limpio**: Sin logs de debug en producción
- ✅ **Consistente**: Mismo comportamiento en todos los usos

## ✅ Criterios de Aceptación

### Funcionales
- [ ] Cualquier página del blog puede llamar: `showBlogToast(message, type)`
- [ ] El toast se ve idéntico en todos los escenarios
- [ ] Auto-ocultado en 8 segundos (mantener)
- [ ] Cierre manual con botón X animado
- [ ] Barra de progreso sincronizada con auto-hide
- [ ] Funciona en modo normal y dark mode

### Técnicos
- [ ] Código JS en un solo archivo: `backend/blog/static/blog/js/toast-utils.js`
- [ ] CSS incluido en el JS (inyección dinámica) o archivo separado
- [ ] Sin logs de `console.log` en producción
- [ ] Sin código duplicado
- [ ] Disponible globalmente via `window.showBlogToast()`
- [ ] Cargado en el template base del blog (si existe) o en cada página que lo necesite

### No funcionales
- [ ] Loading del script < 5KB
- [ ] Sin dependencias externas ( vanilla JS )
- [ ] Compatible con jQuery 3.2.1 y Bootstrap 4.3.1

## 🔧 Pasos de Implementación

### Fase 1: Crear utilidad toast standalone (15 min)
1. Crear `backend/blog/static/blog/js/toast-utils.js`
   - Función `showBlogToast(message, type)` 
   - Incluir CSS inline (inyectado dinámicamente)
   - Auto-hide 8s
   - Botón cerrar animado
   - Sin logs de debug
   - Sin dependencias

2. Funcionalidad:
   ```javascript
   window.showBlogToast = function(message, type) {
       // Crear container si no existe
       // Inyectar CSS si no existe
       // Crear toast con diseño premium
       // Auto-hide 8s con barra de progreso
       // Botón cerrar con animación
   }
   ```

### Fase 2: Integrar en blog_list.html (10 min)
1. **Eliminar**:
   - Script inline de toast (líneas 887-1014)
   - CSS inline del toast (líneas 648-886)
   - Función `showToast` duplicada

2. **Mantener**:
   - Lógica de detección de parámetros URL
   - Llamadas a `showBlogToast()` en lugar de `showToast()`

3. **Cargar**:
   - `<script src="{% static 'blog/js/toast-utils.js' %}"></script>`

### Fase 3: Integrar en blog_list.js (5 min)
1. **Eliminar**:
   - Función `showToast` (líneas 218-273)
   - Código duplicado

2. **Mantener**:
   - Lógica de interceptación de clics
   - Llamadas a `window.showBlogToast()`

3. **Verificar**:
   - No romper funcionalidad existente

### Fase 4: Limpiar y probar (10 min)
1. Verificar que no queden logs de debug
2. Probar ambos escenarios:
   - URL con `?error=not_found`
   - Clic en artículo roto
3. Verificar dark mode
4. Verificar cierre manual
5. Verificar auto-hide 8s

## 📊 Estado
- [x] Diagnóstico completado
- [ ] HU creada
- [ ] Fase 1: Crear utilidad toast
- [ ] Fase 2: Integrar en blog_list.html
- [ ] Fase 3: Integrar en blog_list.js
- [ ] Fase 4: Limpiar y probar

## 🎨 Diseño de la API

### Uso desde cualquier página:
```javascript
// Error: artículo no encontrado
showBlogToast('El artículo no existe', 'danger');

// Advertencia: artículo no disponible
showBlogToast('Este artículo está pendiente', 'warning');

// Con HTML en el mensaje
showBlogToast('<strong>Artículo</strong> no encontrado', 'danger');
```

### Tipos soportados:
- `'danger'` → Icono exclamation-circle, badge rojo
- `'warning'` → Icono exclamation-triangle, badge naranja

### Comportamiento:
- Duración: 8 segundos
- Barra de progreso animada
- Cierre manual con botón X
- Animación de entrada/salida
- Soporte dark mode

## 🔍 Análisis de Alternativas

### Opción 1: Archivo JS standalone (SELECCIONADA)
**Pros**:
- No requiere cambios en templates base
- Fácil de implementar
- Cargado bajo demanda
- Sin dependencias

**Contras**:
- Debe incluir el CSS inline o inyectarlo

### Opción 2: Template tag de Django
**Pros**:
- Integración nativa con Django

**Contras**:
- Más complejo
- Mezcla lógica JS con templates Django
- No es necesario para este caso

### Opción 3: Usar librería externa (toastr/sweetalert)
**Pros**:
- Battle-tested

**Contras**:
- Dependencia externa (viola regla: usar solo lo instalado)
- Menos personalización
- Overhead innecesario

## 📝 Notas de Implementación

### Scope del CSS:
- El toast NO debe estar en un archivo CSS global del blog
- El CSS debe ser **autónomo** e **inyectado** por el JS
- Esto evita conflictos con estilos existentes

### Orden de carga recomendado:
```html
<!-- En cada página del blog que necesite toasts -->
<script src="{% static 'blog/js/toast-utils.js' %}"></script>
```

### Ubicación física:
```
backend/blog/static/blog/js/toast-utils.js
```

---

## 📚 Guía de Uso Completo

### 1. **Requisitos previos en cualquier página del blog**

Para usar `showBlogToast()` en cualquier template del blog, solo necesitas:

```html
{% load static %}

<!-- En el <head> o antes del cierre del </body> -->
<script src="{% static 'blog/js/toast-utils.js' %}"></script>
```

**No necesitas**:
- ❌ Importar CSS adicional
- ❌ Incluir jQuery o Bootstrap (el toast es vanilla JS)
- ❌ Definir funciones previas

**Solo asegúrate** de que `toast-utils.js` se cargue ANTES de que lo uses.

---

### 2. **Ejemplos de uso en diferentes escenarios**

#### **Ejemplo 1: En `blog_detail.html` - Comentario eliminado**
```javascript
// En blog_detail.js o inline en blog_detail.html
function eliminarComentario(comentarioId) {
    fetch('/blog/api/comentario/' + comentarioId + '/eliminar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remover elemento del DOM
            document.getElementById('comentario-' + comentarioId).remove();
            
            // Mostrar toast de éxito
            showBlogToast('Comentario eliminado correctamente', 'danger');
        } else {
            showBlogToast('Error al eliminar el comentario', 'warning');
        }
    })
    .catch(error => {
        showBlogToast('Error de conexión', 'warning');
    });
}
```

#### **Ejemplo 2: En `dashboard.html` - Artículo aprobado**
```javascript
// En dashboard.js al aprobar un artículo
function aprobarArticulo(slug) {
    fetch('/blog/api/articulo/' + slug + '/aprobar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showBlogToast(
                '<strong>Artículo aprobado</strong><br>Ahora es visible para todos los usuarios', 
                'success'
            );
        }
    });
}
```

#### **Ejemplo 3: En `blog_editor.html` - Guardado automático**
```javascript
// Auto-guardado cada 30 segundos
setInterval(function() {
    guardarBorrador();
}, 30000);

function guardarBorrador() {
    var contenido = document.getElementById('editor-content').value;
    
    fetch('/blog/api/borrador/guardar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contenido: contenido })
    })
    .then(response => response.json())
    .then(data => {
        if (data.saved) {
            showBlogToast('Borrador guardado automáticamente', 'success');
        }
    });
}
```

---

### 3. **API Completa - Parámetros disponibles**

#### **Firma básica:**
```javascript
showBlogToast(message, type)
```

#### **Parámetros:**

| Parámetro | Tipo   | Valores posibles        | Descripción                          |
| --------- | ------ | ----------------------- | ------------------------------------ |
| `message` | string | Cualquier texto HTML    | Mensaje a mostrar (soporta HTML)     |
| `type`    | string | `'danger'`, `'warning'` | Tipo de toast (afecta icono y color) |

**NOTA**: La API actual solo soporta 2 tipos. Si necesitas más, se puede ampliar.

---

### 4. **Personalización avanzada**

#### **4.1 Cambiar tiempo de auto-ocultado**

Por defecto: **8 segundos**

Para cambiarlo, edita `toast-utils.js` línea 87:

```javascript
// Línea 87 en toast-utils.js
// Actual: 8000ms = 8 segundos
currentHideTimeout = setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 450);
}, 8000);  // <-- CAMBIAR ESTE VALOR
```

**Valores recomendados:**
- `5000` = 5 segundos (rápido)
- `8000` = 8 segundos (default)
- `12000` = 12 segundos (lento)
- `0` = sin auto-ocultado (solo cierre manual)

---

#### **4.2 Toast SIN auto-ocultado (solo cierre manual)**

Para crear un toast que **permanezca hasta que el usuario lo cierre**, modifica el código así:

```javascript
// En toast-utils.js, reemplaza la línea 87 con:
var hideTimeout = null;

// Auto-hide OPCIONAL (solo si duration > 0)
if (typeof duration !== 'undefined' && duration > 0) {
    hideTimeout = setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 450);
    }, duration);
}

// Modificar la función showBlogToast para aceptar el parámetro duration
window.showBlogToast = function(message, type, duration) {
    // ... código existente ...
    
    // Al final, en lugar de:
    // currentHideTimeout = setTimeout(..., 8000);
    
    // Usar:
    var finalDuration = duration || 8000; // 8s por defecto, 0 = sin auto-hide
    if (finalDuration > 0) {
        currentHideTimeout = setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 450);
        }, finalDuration);
    }
};
```

**Uso:**
```javascript
// Toast que permanece hasta cerrar manualmente
showBlogToast('Error crítico - haz clic en X para continuar', 'danger', 0);

// Toast con tiempo personalizado (5 segundos)
showBlogToast('Guardado exitosamente', 'success', 5000);
```

---

#### **4.3 Modificar estilos CSS del toast**

El CSS está **dentro del JS** (inyectado dinámicamente). Para modificarlo:

**Ubicación:** `toast-utils.js` líneas 10-200 (función `injectToastCSS()`)

**Ejemplos de personalización:**

```javascript
// 1. Cambiar tamaño del toast
// Buscar: width: min(94vw, 420px);
// Cambiar a: width: min(94vw, 500px);

// 2. Cambiar colores del badge danger
// Buscar: background: linear-gradient(135deg, #ff6b7a 0%, #ee5a6f 50%, #d94558 100%);
// Cambiar a: background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

// 3. Cambiar duración de animación de entrada
// Buscar: transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1);
// Cambiar a: transition: transform 0.3s ease, opacity 0.3s ease;

// 4. Cambiar posición (de top a bottom)
// Buscar: top: 28px;
// Cambiar a: bottom: 28px;
// Y: transform: translateX(-50%); (mantener)
```

---

### 5. **Casos de uso recomendados en el blog**

| Escenario                                 | Tipo      | Tiempo sugerido | Ejemplo                                              |
| ----------------------------------------- | --------- | --------------- | ---------------------------------------------------- |
| **Error crítico** (no se pudo guardar)    | `danger`  | 0 (permanente)  | `showBlogToast('Error al guardar', 'danger', 0)`     |
| **Éxito** (guardado, envío)               | `success` | 5000ms          | `showBlogToast('Guardado', 'success', 5000)`         |
| **Advertencia** (contenido no disponible) | `warning` | 8000ms          | `showBlogToast('Artículo no disponible', 'warning')` |
| **Info** (actualizaciones)                | `info`    | 10000ms         | `showBlogToast('Actualización disponible', 'info')`  |

**NOTA**: Actualmente solo están implementados `danger` y `warning`. Para agregar `success` e `info`, hay que agregar 2 líneas en `injectToastCSS()`:

```javascript
// En toast-utils.js, después de .toast-warning .toast-badge
#post-access-toast-container .post-access-toast.toast-success .toast-badge {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
}

#post-access-toast-container .post-access-toast.toast-info .toast-badge {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #fff;
}
```

---

### 6. **Ejemplo completo: Página `blog_detail.html`**

```html
{% load static %}
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- ... metadatos ... -->
    
    <!-- CSS del blog -->
    <link rel="stylesheet" href="{% static 'blog/css/blog_detail.css' %}">
</head>
<body>
    <!-- Contenido del artículo -->
    
    <!-- Botón: "Reportar artículo" -->
    <button id="btn-reportar" class="btn btn-outline-warning">
        <i class="fas fa-flag"></i> Reportar
    </button>
    
    <!-- Scripts -->
    <script src="{% static 'js/jquery-plugins/jquery-3.2.1.min.js' %}"></script>
    <script src="{% static 'js/bs/bootstrap.min.js' %}"></script>
    
    <!-- ✅ Cargar toast-utils.js ANTES de usarlo -->
    <script src="{% static 'blog/js/toast-utils.js' %}"></script>
    
    <!-- Tu script custom -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var btnReportar = document.getElementById('btn-reportar');
        
        btnReportar.addEventListener('click', function() {
            // Lógica de reporte
            fetch('/blog/api/reportar/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ motivo: 'Contenido inapropiado' })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // ✅ Ahora puedes usar showBlogToast()
                    showBlogToast(
                        '<strong>Reporte enviado</strong><br>Gracias por ayudarnos a mantener el blog', 
                        'success',
                        5000  // 5 segundos
                    );
                    
                    // Deshabilitar botón
                    btnReportar.disabled = true;
                    btnReportar.innerHTML = '<i class="fas fa-check"></i> Reportado';
                } else {
                    showBlogToast('Error al enviar reporte', 'danger');
                }
            });
        });
    });
    </script>
</body>
</html>
```

---

### 7. **Buenas prácticas**

#### ✅ **Hacer:**
- Cargar `toast-utils.js` lo más bajo posible en el template (antes de `</body>`)
- Usar mensajes descriptivos y concisos
- Incluir HTML en el mensaje para mejor jerarquía (`<strong>`, `<small>`, `<br>`)
- Usar `danger` para errores, `warning` para advertencias
- Especificar `duration` solo cuando difiera del default (8s)

#### ❌ **No hacer:**
- No cargar `toast-utils.js` en el `<head>` (bloquea renderizado)
- No mostrar toasts en exceso (máximo 1 cada 10 segundos)
- No usar texto muy largo (máximo 150 caracteres)
- No olvidar limpiar el DOM después de eliminar el toast (el JS lo hace automáticamente)

---

### 8. **Troubleshooting común**

| Problema                       | Causa                                 | Solución                                                               |
| ------------------------------ | ------------------------------------- | ---------------------------------------------------------------------- |
| `showBlogToast is not defined` | No cargaste `toast-utils.js`          | Agrega `<script src="{% static 'blog/js/toast-utils.js' %}"></script>` |
| Toast se ve mal                | CSS no se inyectó                     | Verifica que no haya errores JS en consola                             |
| No se oculta automáticamente   | `duration = 0`                        | No pasar `0` como tercer parámetro                                     |
| No aparece el toast            | Llamada antes de que cargue el script | Mueve el `<script>` más arriba o usa `DOMContentLoaded`                |

---

**Actualizado:** 08/06/2026  
**Versión:** 1.1  
**Cambios:** Agregada guía de uso completa con ejemplos
