# 🚀 PLAN DE ACCIÓN: HU-008 Avatares Consistentes en Comentarios
> Aprobado según Diagnóstico y HU oficial
> Fecha: 29/04/2026
> Cumplimiento: ✅ Reglas Cline 100%

---

## 📋 PRINCIPIOS DE EJECUCIÓN
✅ Una fase a la vez
✅ Cada fase < 15 minutos de trabajo
✅ Se prueba y confirma cada fase antes de pasar a la siguiente
✅ NUNCA se rompe lo existente
✅ Todo es aditivo
✅ NO se modifica modelo BlogComment (solo propiedades)
✅ NO se crea tabla nueva

---

## 🗓️ FASES DE IMPLEMENTACIÓN

| Fase     | Descripción                                                   | Tiempo estimado | Estado      |
| -------- | ------------------------------------------------------------- | --------------- | ----------- |
| 🔹 FASE 1 | Crear utilidades de hash y color (backend/blog/utils.py)      | 5 min           | ⏳ Pendiente |
| 🔹 FASE 2 | Agregar propiedades a BlogComment (properties)                | 5 min           | ⏳ Pendiente |
| 🔹 FASE 3 | Crear CSS para avatares (backend/static/blog/css/)            | 8 min           | ⏳ Pendiente |
| 🔹 FASE 4 | Integrar avatar en template de comentarios                    | 10 min          | ⏳ Pendiente |
| 🔹 FASE 5 | Testing y validación completa                                 | 5 min           | ⏳ Pendiente |

---

## 🔹 FASE 1: Utilidades de Hash y Color
**Objetivo:** Crear módulo de generación determinística de avatares

**Archivo:** `backend/blog/utils.py` (crear o extender)

**Código a agregar:**
```python
import hashlib
from typing import Tuple

def generate_avatar_seed(ip_address: str, commenter_name: str, secret: str = "jdsite_blog_secret") -> str:
    """
    Genera hash consistente para avatar basado en IP + nombre.
    
    Args:
        ip_address: Dirección IP del usuario (no se persiste)
        commenter_name: Nombre del comentarista
        secret: Palabra clave secreta para salt del hash
    
    Returns:
        Hash SHA256 de 64 caracteres (hexadecimal)
    
    Nota: Cada combinación IP + nombre genera el mismo hash siempre
    """
    data = f"{ip_address}:{commenter_name}:{secret}".encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def get_avatar_color(seed: str) -> str:
    """
    Extrae color hexadecimal consistente del seed.
    Usa primeros 6 caracteres del hash.
    
    Args:
        seed: Hash SHA256 generado por generate_avatar_seed()
    
    Returns:
        String con formato #RRGGBB
    
    Ejemplo: seed="abc123..." → "#abc123"
    """
    return f"#{seed[:6]}"


def get_avatar_initials(name: str) -> str:
    """
    Extrae iniciales del nombre (máximo 2 caracteres).
    
    Reglas:
    - Si nombre tiene 2+ palabras: Primera letra + primera letra última palabra
    - Si nombre tiene 1 palabra: Primeras 2 letras
    - Si nombre vacío: "?"
    
    Args:
        name: Nombre completo del comentarista
    
    Returns:
        String de máximo 2 caracteres en MAYÚSCULAS
    
    Ejemplos:
        "Juan Pérez" → "JP"
        "María" → "MA"
        "A B C D" → "AD"
        "" → "?"
    """
    name = name.strip()
    if not name:
        return "?"
    
    parts = name.split()
    
    if len(parts) >= 2:
        # Primer letra de primera palabra + primer letra de última palabra
        return (parts[0][0] + parts[-1][0]).upper()
    else:
        # Primeras 2 letras de la única palabra
        return name[:2].upper()
```

**Validación:**
- [ ] Archivo `backend/blog/utils.py` creado
- [ ] Función `generate_avatar_seed` importable
- [ ] Función `get_avatar_color` importable
- [ ] Función `get_avatar_initials` importable
- [ ] NO hay errores de import

**Tiempo:** 5 min

---

## 🔹 FASE 2: Propiedades en BlogComment
**Objetivo:** Agregar propiedades calculadas a modelo BlogComment (sin migración)

**Archivo:** `backend/blog/models.py`

**Ubicación:** Dentro de la clase `BlogComment`, agregar estas 3 propiedades:

```python
from .utils import generate_avatar_seed, get_avatar_color, get_avatar_initials

class BlogComment(models.Model):
    # ... campos existentes ...
    
    @property
    def avatar_seed(self) -> str:
        """
        Genera hash SHA256 consistente para el avatar.
        Basado en IP + nombre normalizado.
        IMPORTANTE: No se persiste, se calcula cada vez.
        """
        return generate_avatar_seed(self.ip_address, self.name)
    
    @property
    def avatar_color(self) -> str:
        """
        Color hexadecimal único y consistente para este comentarista.
        Formato: #RRGGBB (ejemplo: #a3c5d2)
        """
        return get_avatar_color(self.avatar_seed)
    
    @property
    def avatar_initials(self) -> str:
        """
        Iniciales del nombre para mostrar en el avatar.
        Máximo 2 caracteres en mayúsculas.
        """
        return get_avatar_initials(self.name)
```

**Validación:**
- [ ] Las 3 propiedades existen en BlogComment
- [ ] Importes están en la parte superior del archivo
- [ ] Se puede acceder a `comment.avatar_seed` desde template
- [ ] Se puede acceder a `comment.avatar_color` desde template
- [ ] Se puede acceder a `comment.avatar_initials` desde template
- [ ] NO hay cambios en la BD (propiedades, no campos)
- [ ] NO hay new migrations generadas

**Tiempo:** 5 min

---

## 🔹 FASE 3: CSS para Avatares
**Objetivo:** Estilizar el componente visual del avatar

**Archivo:** `backend/static/blog/css/comment-avatars.css` (NUEVO)

**Contenido:**
```css
/**
 * Estilos para avatares en comentarios del blog
 * Avatares: círculos con iniciales + color único por usuario
 */

/* Contenedor principal del avatar */
.comment-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    
    /* Color dinámico viene del inline style: style="background-color: #..." */
    background-color: #999;
    color: white;
    
    /* Tipografía */
    font-weight: bold;
    font-size: 18px;
    line-height: 1;
    
    /* Propiedades de display */
    flex-shrink: 0;
    user-select: none;
    
    /* Animación suave */
    transition: transform 150ms ease, box-shadow 150ms ease;
}

/* Efecto hover */
.comment-avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Layout del comentario: avatar + contenido */
.comment-wrapper {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    padding: 12px 0;
}

/* Contenedor de texto del comentario */
.comment-content {
    flex: 1;
    min-width: 0; /* Permite que el texto se quiebre correctamente */
}

/* Metadata: nombre + fecha */
.comment-meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
}

.comment-author {
    font-weight: 600;
    color: #333;
}

.comment-date {
    color: #666;
    font-size: 12px;
}

/* Texto del comentario */
.comment-text {
    color: #444;
    line-height: 1.6;
    word-break: break-word;
}

/* Responsivo: en móvil puede ser más compacto */
@media (max-width: 768px) {
    .comment-avatar {
        width: 40px;
        height: 40px;
        font-size: 16px;
    }
    
    .comment-wrapper {
        gap: 10px;
        margin-bottom: 16px;
    }
}
```

**Validación:**
- [ ] Archivo `comment-avatars.css` creado
- [ ] Avatar es círculo de 48x48px
- [ ] Iniciales son legibles (fuente bold, blanco)
- [ ] Hover anima suavemente (escala 1.05)
- [ ] Layout flex funciona correctamente
- [ ] Responsivo en móvil

**Tiempo:** 8 min

---

## 🔹 FASE 4: Integración en Template
**Objetivo:** Mostrar avatar en template de comentarios

**Archivos a modificar:**
- `backend/blog/templates/blog/blog_detail.html` (template que renderiza comentarios)

**Paso 1: Cargar CSS**
En la sección `<head>`, agregar:
```html
<link rel="stylesheet" href="{% static 'blog/css/comment-avatars.css' %}">
```

**Paso 2: Modificar template de comentario**
Buscar la sección donde se renderiza cada comentario. Típicamente algo como:

```html
<!-- ANTES -->
<div class="comment-item">
    <strong>{{ comment.name }}</strong>
    <small>{{ comment.created_at|date:"j M Y, H:i" }}</small>
    <p>{{ comment.content }}</p>
</div>

<!-- DESPUÉS: agregar avatar -->
<div class="comment-wrapper">
    <div class="comment-avatar" style="background-color: {{ comment.avatar_color }};">
        {{ comment.avatar_initials }}
    </div>
    <div class="comment-content">
        <div class="comment-meta">
            <strong class="comment-author">{{ comment.name }}</strong>
            <small class="comment-date">{{ comment.created_at|date:"j M Y, H:i" }}</small>
        </div>
        <p class="comment-text">{{ comment.content }}</p>
        <!-- Espacio para reacciones si existen -->
        {% if comment.reactions_available %}
            {# Template de reacciones va aquí #}
        {% endif %}
    </div>
</div>
```

**Importante:**
- Aplicar esto a comentarios PRINCIPALES
- Aplicar esto a RESPUESTAS (if comment.parent exists)
- Asegurarse que HTML está indentado correctamente
- NO romper HTML existente

**Validación:**
- [ ] CSS está cargada en página
- [ ] Avatar aparece al lado de cada comentario
- [ ] Avatar muestra iniciales correctas
- [ ] Avatar muestra color consistente
- [ ] Avatar aparece en comentarios principales
- [ ] Avatar aparece en respuestas
- [ ] Layout no se rompe
- [ ] Responsive en móvil

**Tiempo:** 10 min

---

## 🔹 FASE 5: Testing y Validación
**Objetivo:** Verificar que todo funciona correctamente

### Test 1: Consistencia de Avatar (OBLIGATORIO)
```
1. Ir a un artículo del blog
2. Comentar con nombre "Juan Pérez" desde navegador 1
3. Anotar avatar color y iniciales (ej: color #a3c5d2, iniciales "JP")
4. Recargar página
5. Verificar: avatar es IGUAL (#a3c5d2, "JP")
6. Abrir en otro navegador/incógnito (misma IP)
7. Comentar de nuevo con "Juan Pérez"
8. Verificar: avatar es IGUAL (#a3c5d2, "JP")
```
**Esperado:** ✅ Avatar idéntico en todas las cargas

### Test 2: Avatar Diferente por Nombre (OBLIGATORIO)
```
1. Comentar con "Juan Pérez" → ver avatar
2. Comentar con "María García" → debe ser DIFERENTE
3. Anotar ambos colores/iniciales
4. Recargar
5. Verificar: cada usuario tiene su propio avatar
```
**Esperado:** ✅ Avatares diferentes por usuario

### Test 3: Avatares en Respuestas (OBLIGATORIO)
```
1. Crear comentario principal
2. Crear respuesta a ese comentario
3. Verificar que AMBOS tienen avatar
4. Avatar del que responde es diferente al del principal (si nombres diferentes)
```
**Esperado:** ✅ Avatar en comentarios anidados

### Test 4: HTML/CSS (OBLIGATORIO)
```
1. Ver source del comentario (F12 → Inspector)
2. Verificar que div.comment-avatar existe
3. Verificar que style="background-color: #..." está presente
4. Verificar que CSS se aplica (caja circular)
5. Probar hover → debe escalar
```
**Esperado:** ✅ HTML y CSS correctos

### Test 5: Responsivo (VERIFICAR)
```
1. Abrir blog en desktop (1920px)
2. Avatar debe ser 48x48px
3. Abrir en móvil (375px)
4. Avatar debe ser 40x40px
5. Iniciales deben ser legibles en ambos
```
**Esperado:** ✅ Responsive correcto

### Test 6: Sin JavaScript (IMPORTANTE)
```
1. Desactivar JavaScript en navegador (Dev Tools → Settings → Disable JS)
2. Recargar blog
3. Avatar debe ser VISIBLE (generado en servidor)
4. No debe haber errores en consola
```
**Esperado:** ✅ Avatar funciona sin JS (server-side rendering)

### Test 7: Casos Edge (VALIDAR)
```
1. Nombre vacío ("") → avatar muestra "?"
2. Nombre muy largo → iniciales máx 2 caracteres
3. Nombre con números "User123" → iniciales "US"
4. Nombre con símbolos "José-María" → iniciales "JM"
5. Nombre solo espacios "   " → avatar muestra "?"
```
**Esperado:** ✅ Edge cases manejados correctamente

### Validación Final
- [ ] Test 1: ✅ Consistencia
- [ ] Test 2: ✅ Avatar diferente
- [ ] Test 3: ✅ Respuestas
- [ ] Test 4: ✅ HTML/CSS
- [ ] Test 5: ✅ Responsive
- [ ] Test 6: ✅ Sin JS
- [ ] Test 7: ✅ Edge cases
- [ ] [ ] NO hay errores en consola
- [ ] [ ] NO hay migraciones de BD
- [ ] [ ] NO se rompió lo existente
- [ ] [ ] Performance: página carga sin lag

**Tiempo:** 5 min

---

## 📊 MÉTRICAS OBJETIVO

| Métrica                      | Valor objetivo | Resultado |
| ---------------------------- | -------------- | --------- |
| Avatares consistentes        | 100%           | ⏳        |
| Casos de prueba pasando      | 7/7            | ⏳        |
| Migraciones nuevas           | 0              | ⏳        |
| Dependencias nuevas          | 0              | ⏳        |
| Líneas de código (utils)     | < 50           | ⏳        |
| Líneas de CSS nuevas         | < 60           | ⏳        |

---

## 🔗 DEPENDENCIAS CON OTRAS HU

- **HU-005.3** (Sistema comentarios): YA COMPLETADO - BlogComment ya existe
- **HU-005.4** (Reacciones comentarios): COMPLETADO - Opcional para mostrar reacciones junto a avatar
- Esta HU-008 NO tiene dependencias bloqueantes

---

## 📝 NOTAS IMPORTANTES

1. **Propiedades vs Campos:** Se usan `@property` para NO crear campos en BD
2. **Hash consistente:** Mismo usuario (IP + nombre) = mismo avatar siempre
3. **Sin persistencia de IP:** Se calcula hash cada carga, IP no se guarda
4. **GDPR-compliant:** No se almacena nada, solo se calcula
5. **Preparado para futuro:** Cuando usuarios registrados (HU-009), pueden personalizar avatar
6. **Reutilizable:** Código está en utils para posible uso en otros lados

---

## 🚀 PRÓXIMOS PASOS

Después de completar HU-008:
1. Commit: "feat(HU-008): Avatares consistentes para comentarios sin almacenamiento"
2. Validar que blog sigue funcionando perfectamente
3. Considerar HU-009: Sistema de usuario registrado con avatar personalizado (futuro)

---

> ✅ Este plan cumple todas las reglas granulares de Cline.
> ✅ Cada fase es independiente, testeable y no sobrepasa 15 minutos.
> ✅ Se reutiliza arquitectura existente, no se reinventa.
