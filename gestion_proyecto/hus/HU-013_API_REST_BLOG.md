# 📋 HU-013: API REST pública para el blog

> **ID:** HU-013  
> **Fecha:** 16/06/2026  
> **Responsable:** Cline  
> **Estado:** 🟡 En Progreso — 0 fases implementadas  
> **Tiempo estimado total:** 4 fases (~15 min cada una)  
> **Dependencias:** HU-012 (Mejoras SEO Blog Detail)  

---  

## 🚨 INSTRUCCIONES DE DESARROLLO (LEER ANTES DE EMPEZAR)

> ⚠️ **REGLAS DE ORO PARA IMPLEMENTAR ESTA HU:**  
> 1. **Una fase a la vez** – cada fase debe poder probarse de forma independiente.  
> 2. **Sin dependencias nuevas sin aprobación** – usaremos solo lo que ya está instalado (Django). Si se necesita `djangorestframework`, preguntar primero.  
> 3. **Nunca romper lo existente** – la API será aditiva, no modificará vistas o plantillas actuales.  
> 4. **Documentar antes de codificar** – primero crear la HU, luego el plan, y por último el código.  

---  

## 🎯 OBJETIVO

Exponer una **API REST pública** que permita a terceros (apps móviles, newsletters, integraciones) consumir el contenido del blog de forma estructurada.

### Endpoints propuestos

| Endpoint                          | Método  | Descripción                                                       |
| --------------------------------- | ------- | ----------------------------------------------------------------- |
| `/api/blog/posts/`                | **GET** | Lista paginada de artículos publicados.                           |
| `/api/blog/posts/<slug>/`         | **GET** | Detalle de un artículo (incluye contenido HTML, meta tags, etc.). |
| `/api/blog/posts/<slug>/related/` | **GET** | Artículos relacionados (misma lógica que en la vista HTML).       |
| `/api/blog/categories/`           | **GET** | Lista de categorías disponibles.                                  |
| `/api/blog/tags/`                 | **GET** | Lista de tags disponibles.                                        |
| `/api/blog/feed/rss/`             | **GET** | Feed RSS (ya existe, se re‑expondrá).                             |
| `/api/blog/feed/atom/`            | **GET** | Feed Atom (ya existe, se re‑expondrá).                            |

---  

## 📊 ESTADO ACTUAL (AUDITORÍA)

| ✅ Lo que YA funciona bien                                         | 🔴 Lo que falta                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Modelo `BlogPost` con `slug`, `category`, `tags`, `content_html`. | Exponer los datos vía API REST.                                                     |
| Algoritmo de artículos relacionados ya implementado en la vista.  | Re‑usar ese algoritmo en la API.                                                    |
| Feed RSS/Atom ya disponible.                                      | Añadir endpoints `/api/blog/feed/*`.                                                |
| `django.core.serializers` disponible en el proyecto.              | Decidir si usar **Django REST Framework** (DRF) o vistas basadas en `JsonResponse`. |

---  

## 🔧 FASES DE IMPLEMENTACIÓN

### ⚡ FASE 1: Preparar entorno y decidir tecnología
- **Objetivo:** Añadir `djangorestframework` (solo si se aprueba) o crear vistas basadas en `JsonResponse`.
- **Tareas:**
  1. Preguntar al equipo si se permite instalar `djangorestframework`.  
  2. Si se aprueba, añadir la dependencia a `requirements.txt` (comentada por ahora).  
  3. Crear archivo `backend/blog/api/__init__.py` (paquete vacío).  

### ⚡ FASE 2: Serializadores y vistas básicas
- **Objetivo:** Implementar serializadores (o funciones) para `BlogPost`, `Category`, `Tag`.  
- **Tareas:**
  1. Crear `backend/blog/api/serializers.py` con `BlogPostSerializer`, `CategorySerializer`, `TagSerializer`.  
  2. Implementar vista `PostListAPIView` (GET) que devuelva los últimos 10 posts, paginada.  
  3. Registrar la URL en `backend/blog/urls.py` bajo el prefijo `api/blog/`.  

### ⚡ FASE 3: Endpoints detalle y relacionados
- **Objetivo:** Exponer detalle de artículo y lista de relacionados.  
- **Tareas:**
  1. Vista `PostDetailAPIView` (GET) que devuelva todos los campos del `BlogPost` + `category` y `tags`.  
  2. Vista `PostRelatedAPIView` (GET) que reutilice el algoritmo de `BlogDetailView.get_context_data()` para devolver hasta 4 posts relacionados.  

### ⚡ FASE 4: Endpoints auxiliares y pruebas
- **Objetivo:** Añadir endpoints de categorías, tags y re‑exponer feeds.  
- **Tareas:**
  1. Vistas `CategoryListAPIView` y `TagListAPIView`.  
  2. Endpoints `/api/blog/feed/rss/` y `/api/blog/feed/atom/` que simplemente redirijan a los existentes (`backend/blog/feeds.py`).  
  3. Documentar la API en `gestion_proyecto/hus/HU-013_API_REST_BLOG.md` (ejemplo de respuesta JSON).  
  4. Ejecutar pruebas manuales con `curl` o `httpie` para validar cada endpoint.  

---  

## 📋 CRITERIOS DE ACEPTACIÓN

- ✅ **Endpoint `/api/blog/posts/`** devuelve JSON paginado con al menos `slug`, `title`, `description`, `published_at`, `category`, `tags`.  
- ✅ **Endpoint `/api/blog/posts/<slug>/`** devuelve todos los campos del modelo, incluido `content_html`.  
- ✅ **Endpoint `/api/blog/posts/<slug>/related/`** devuelve hasta 4 artículos relacionados usando la misma lógica que la vista HTML.  
- ✅ **Endpoints `/api/blog/categories/` y `/api/blog/tags/`** devuelven listas de objetos con `id` y `name`.  
- ✅ **Feeds RSS/Atom** siguen accesibles vía `/api/blog/feed/rss/` y `/api/blog/feed/atom/`.  
- ✅ La API responde con **códigos HTTP correctos** (200, 404, 400).  
- ✅ La documentación de la API está incluida en esta HU y en `README.md` del proyecto.  

---  

## 🛠️ NOTAS TÉCNICAS

- Si se usa **DRF**, los viewsets pueden simplificar la implementación, pero se debe respetar la regla de “sin dependencias nuevas sin aprobación”.  
- Si se opta por **JsonResponse**, se mantendrá el proyecto libre de dependencias externas.  
- Los **serializadores** deben excluir campos internos (`id` si no es necesario) y respetar la política de privacidad (no exponer `author.email` si no se usa).  
- Los **códigos de estado** deben ser consistentes con la API RESTful (200 OK, 404 Not Found, 400 Bad Request).  

---  

## 📋 PENDIENTE — Próximos pasos

| #   | Acción                                                     | Responsable            | Estado |
| --- | ---------------------------------------------------------- | ---------------------- | ------ |
| 1   | Aprobar instalación de `djangorestframework` (si se desea) | Product Owner / Equipo | ⬜      |
| 2   | Crear paquete `backend/blog/api/` y archivos iniciales     | Cline                  | ⬜      |
| 3   | Implementar fase 1 (serializadores y vistas)               | Cline                  | ⬜      |
| 4   | Testear endpoints con `curl`/`httpie`                      | Cline                  | ⬜      |
| 5   | Documentar respuestas y ejemplos en esta HU                | Cline                  | ⬜      |

---  

> 📌 Última actualización: 16/06/2026  
> 📌 Aplicable desde HU-013  

---  

## 🔄 FLUJO COMPLETO (Resumen visual)

```
┌─────────────────────┐
│ 1. python manage.py │
│    import_blogs      │
│    (pobla BD)       │
└───────┬─────────────┘
        │
        ▼
┌─────────────────────┐
│ 2. Django ORM       │
│    (BlogPost)       │
└───────┬─────────────┘
        │
        ▼
┌─────────────────────┐
│ 3. API REST (GET)   │
│    /api/blog/posts/ │
│    → Serializador   │
│    → JsonResponse   │
└───────┬─────────────┘
        │
        ▼
┌─────────────────────┐
│ 4. Cliente (app,   │
│    newsletter, etc)│
│    consume JSON     │
└─────────────────────┘
```

---  

*Esta HU está lista para ser planificada y ejecutada en la siguiente iteración.*