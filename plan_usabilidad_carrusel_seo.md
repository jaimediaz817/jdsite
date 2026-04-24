# 🎨 PLAN DE USABILIDAD + CARRUSEL GITHUB FULL-WIDTH + SEO TÉCNICO
> **Fecha:** 2026-04-24  
> **Proyecto:** jdsite_clean — Portafolio Django de Jaime Díaz  
> **Restricción:** Solo modificar texto estático, añadir nuevas secciones sin romper estructura existente  
> **Objetivo:** Maximizar impacto en reclutadores, mejorar navegación y posicionamiento en Google

---

## PARTE 1: 🔍 DIAGNÓSTICO DE USABILIDAD (UX)

### 1.1 Problemas de navegación detectados

| #   | Problema                                                | Severidad | Evidencia                                                                                                                                                                    |
| --- | ------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Menú con demasiados items** (10 enlaces)              | 🔴 Alta    | `#main-menu` tiene Inicio, Bienvenido, Skills, Proyectos, Cómo trabajo, Mis números, Tecnologías, Contacto, Soporte, Reportar Bug. En móvil se vuelve imposible de escanear. |
| 2   | **Chips de navegación duplican funcionalidad**          | 🟡 Media   | `.nav-chips` repite Bienvenido, Skills, Proyectos, Cómo trabajo, Contacto — confusión sobre qué usar                                                                         |
| 3   | **Dos footers** con información contradictoria          | 🟡 Media   | El primer footer tiene redes sociales extensas, el segundo es un "Soporte" con teléfono. No queda claro cuál es el footer real.                                              |
| 4   | **"Soporte" en el menú lleva al footer**                | 🟡 Media   | Un reclutador buscando "Soporte" espera ayuda, no un footer con copyright                                                                                                    |
| 5   | **CTA "Reportar Bug" en menú principal**                | 🟡 Media   | Ocupa espacio valioso del menú. Mejor en el footer o como link sutil                                                                                                         |
| 6   | **Botón "Descargar CV" vs "Descargar certificaciones"** | 🟢 Baja    | Dos botones similares, uno con ícono y otro sin. Inconsistencia visual                                                                                                       |

### 1.2 Problemas de jerarquía visual

| #   | Problema                                               | Severidad | Solución propuesta                                                                          |
| --- | ------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------- |
| 1   | **Hero ocupa 100vh pero el contenido está muy arriba** | 🟡 Media   | En pantallas grandes el CTA queda a mitad de pantalla, el espacio inferior se pierde        |
| 2   | **Video de fondo en hero no tiene fallback de poster** | 🟡 Media   | Si el video no carga, el fondo es negro. Debería tener una imagen de fallback               |
| 3   | **La terminal está "escondida" en la sección Welcome** | 🔴 Alta    | Es un diferenciador ÚNICO pero está abajo del fold. Muchos reclutadores no llegan hasta ahí |
| 4   | **Sección "Mis números" usa mayúsculas excesivas**     | 🟢 Baja    | "UN POCO SOBRE MIS NÚMEROS" — reduce legibilidad y parece gritar                            |
| 5   | **Cards de proyectos tienen alturas inconsistentes**   | 🟡 Media   | Algunos proyectos tienen más bullets que otros, las cards no se alinean visualmente         |
| 6   | **Falta indicador de scroll en el hero**               | 🟢 Baja    | No hay flecha ni hint de que hay más contenido abajo                                        |

### 1.3 Problemas de accesibilidad (a11y)

| #   | Problema                                        | Severidad | WCAG                                                                               |
| --- | ----------------------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| 1   | **Videos de fondo sin control de pausa**        | 🔴 Alta    | 2.2.2 — Usuarios con trastornos vestibulares necesitan poder pausar el movimiento  |
| 2   | **Contraste en chips del hero**                 | 🟡 Media   | Los chips sobre video pueden tener contraste insuficiente dependiendo del frame    |
| 3   | **Enlaces "javascript:;" sin href real**        | 🟡 Media   | El logo en `details-contact` apunta a `javascript:;` — no es navegable por teclado |
| 4   | **Modal de galería sin aria-label descriptivo** | 🟢 Baja    | `#projectGalleryModal` necesita descripción del proyecto activo                    |

### 1.4 Problemas de performance percibida

| #   | Problema                                 | Impacto                                                                           |
| --- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | **Terminal tarda en cargar repos**       | El spinner es genérico, no comunica qué está pasando                              |
| 2   | **Formulario sin estado de éxito claro** | Después de enviar, el usuario no sabe si funcionó hasta que lee el toast          |
| 3   | **Scroll to section es lento en móvil**  | `mPageScroll2id` con offset 55 puede no ser suficiente en móvil con header sticky |

---

## PARTE 2: 🎯 PROPUESTA — CARRUSEL GITHUB FULL-WIDTH

### 2.1 Concepto

Una sección nueva, **entre el Hero y la sección Welcome**, que ocupe el **100% del ancho de pantalla** y muestre los repositorios de GitHub como un **carrusel horizontal infinito** (marquee-style) con las siguientes características:

- 🎠 **Carrusel tipo "marquee"**: los repos se desplazan horizontalmente de forma continua y suave
- 🃏 **Tarjetas tipo "glassmorphism"**: fondo translúcido con blur, sobre un fondo oscuro o con degradado
- 🖼️ **Avatar del lenguaje**: icono de Devicon o badge de color del lenguaje
- 🔢 **Stats visibles**: ⭐ stars, 🍴 forks, 📅 última actualización
- 🖱️ **Pausa al hover**: el carrusel se detiene cuando el mouse está encima
- 📱 **Touch/drag en móvil**: se puede deslizar con el dedo
- 🔗 **Click para abrir**: cada tarjeta es un link al repo en GitHub

### 2.2 Arquitectura técnica

```
┌─────────────────────────────────────────────────────────────┐
│  SECCIÓN: #github-showcase (nueva, entre hero y welcome)    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Fondo: degradado oscuro o imagen sutil             │   │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │   │
│  │  │Repo│ │Repo│ │Repo│ │Repo│ │Repo│ │Repo│  →→→    │   │
│  │  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │        │   │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘        │   │
│  └─────────────────────────────────────────────────────┘   │
│  Título: "Código en producción" + contador dinámico        │
│  Subtítulo: "X repositorios públicos · última actividad"   │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Dependencias existentes a reutilizar

| Recurso                          | Uso actual                        | Reutilización                          |
| -------------------------------- | --------------------------------- | -------------------------------------- |
| `github.js`                      | Carga repos para terminal y cards | ✅ Reutilizar `window.loadGitHubData()` |
| `window.JD_API.GITHUB_REPOS_URL` | Endpoint de la API                | ✅ Mismo endpoint                       |
| Swiper.js                        | Carruseles existentes             | ✅ Inicializar nueva instancia Swiper   |
| AOS.js                           | Animaciones de entrada            | ✅ Añadir `data-aos` a la nueva sección |

### 2.4 Archivos a crear/modificar

#### NUEVOS archivos:

| Archivo                                                            | Descripción                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `backend/static/js/components/github-carousel/jdGitHubCarousel.js` | Lógica del carrusel: consume `loadGitHubData`, renderiza cards, inicializa Swiper en modo `freeMode` + `autoplay` |
| `backend/static/css/components/github-carousel.css`                | Estilos del carrusel: glassmorphism, animaciones hover, responsive                                                |

#### MODIFICAR archivos existentes:

| Archivo                             | Qué cambiar                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `backend/templates/home.html`       | Insertar nueva sección `#github-showcase` entre el hero y `#welcome`. Añadir `<script>` y `<link>` para los nuevos componentes |
| `backend/static/js/jdController.js` | Importar e inicializar `initGitHubCarousel()` en el `DOMContentLoaded`                                                         |
| `backend/static/css/styles.css`     | Añadir clases auxiliares si son necesarias (aunque preferible mantenerlas en el CSS del componente)                            |

### 2.5 Detalle técnico del componente JS

```javascript
// jdGitHubCarousel.js — Pseudocódigo del plan

export function initGitHubCarousel() {
    const container = document.querySelector("#github-carousel-track");
    if (!container) return;

    // 1. Mostrar loader
    container.innerHTML = LOADER_HTML;

    // 2. Reutilizar la data ya cargada por github.js
    // Opción A: Si github.js ya cargó, usar la misma data
    // Opción B: Llamar a loadGitHubData() de nuevo (es idempotente)

    window.loadGitHubData().then((data) => {
        const allRepos = [];
        // Aplanar los grupos personal/profesional
        for (const group in data.groups) {
            allRepos.push(...data.groups[group]);
        }

        // 3. Renderizar tarjetas
        const cardsHtml = allRepos.map(repo => `
            <a href="${repo.url}" target="_blank" class="github-carousel-card" rel="noopener">
                <div class="gh-card-header">
                    <span class="gh-card-lang">${repo.language || 'N/A'}</span>
                    <span class="gh-card-stars">⭐ ${repo.stars || 0}</span>
                </div>
                <h4 class="gh-card-name">${repo.name}</h4>
                <p class="gh-card-desc">${repo.description || ''}</p>
                <div class="gh-card-footer">
                    <span>${repo.owner_tag === 'personal' ? '👤 Personal' : '💼 Profesional'}</span>
                </div>
            </a>
        `).join('');

        container.innerHTML = cardsHtml;

        // 4. Duplicar las cards para efecto infinito (marquee)
        container.innerHTML += cardsHtml;

        // 5. Inicializar Swiper en modo free-scroll
        new Swiper(container, {
            slidesPerView: 'auto',
            spaceBetween: 20,
            freeMode: true,
            loop: true,
            autoplay: {
                delay: 0,
                disableOnInteraction: false,
            },
            speed: 5000, // Lento para efecto marquee
            breakpoints: {
                768: { spaceBetween: 30 },
            }
        });
    });
}
```

### 2.6 Diseño visual propuesto (CSS)

```css
/* github-carousel.css — Pseudocódigo del plan */

#github-showcase {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 4rem 0;
    overflow: hidden;
}

.github-carousel-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    width: 320px;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s, background 0.3s;
}

.github-carousel-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.1);
}
```

---

## PARTE 3: 🔎 MEJORAS SEO TÉCNICAS

> ✅ **ACTUALIZACIÓN 2026-04-24:** Quick Wins aplicados en este sprint.

### 3.1 On-Page SEO

| Elemento              | Estado actual (ANTES)           | Estado actual (DESPUÉS)                                                      | Estado      |
| --------------------- | ------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| `<title>`             | `Jaime Díaz \| Página personal` | `Jaime Díaz \| Senior Fullstack Engineer · AI-Augmented · Zoho Ecosystem`    | ✅ Hecho     |
| `meta description`    | ~300 caracteres, genérica       | "Senior Fullstack Engineer con 13+ años..." (optimizado)                     | ✅ Hecho     |
| `h1`                  | "Hola, soy Jaime Díaz"          | Pendiente: añadir keyword                                                    | 🔲 Pendiente |
| Open Graph `og:title` | Correcto pero genérico          | Alineado con nuevo `<title>`                                                 | ✅ Hecho     |
| Twitter Cards         | Correcto                        | Alineado con nuevo `<title>`                                                 | ✅ Hecho     |
| `canonical`           | `https://jaimediaz.dev/`        | ✅ Correcto                                                                   | —           |
| Schema.org Person     | Completo                        | `jobTitle` actualizado a "Senior Fullstack Engineer" + `knowsAbout` ampliado | ✅ Hecho     |

### 3.1b Errores ortográficos corregidos (footer)

| Ubicación        | Error (ANTES)                                       | Corrección (DESPUÉS)                        |
| ---------------- | --------------------------------------------------- | ------------------------------------------- |
| Footer LinkedIn  | "certificados **obtendidos** tras lograr finalizar" | "certificados **obtenidos** tras finalizar" | ✅ Hecho |
| Footer Bitbucket | "Framework **tube** la oportunidad"                 | "Framework **tuve** la oportunidad"         | ✅ Hecho |
| Footer Bitbucket | "Framework **de la casa**"                          | "Framework **propio**"                      | ✅ Hecho |

### 3.2 Structured Data (Schema.org) — mejoras

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jaime Iván Díaz Gaona",
  "jobTitle": "Senior Fullstack Engineer",
  "knowsAbout": [
    "Zoho CRM",
    "Deluge",
    "FastAPI",
    "Angular",
    "React",
    "Next.js",
    "Docker",
    "Nginx",
    "WhatsApp integrations",
    "WOZTELL",
    "Clean Architecture",
    "AI-Augmented Development"
  ]
}
```

### 3.3 Performance Core Web Vitals

| Métrica                                       | Problema                                 | Solución                                                                                 |
| --------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| **LCP** (Largest Contentful Paint)            | Videos de fondo pesados                  | Añadir `poster` a todos los `<video>`, usar `preload="none"` en los que están below-fold |
| **CLS** (Cumulative Layout Shift)             | Imágenes sin `width`/`height` explícitos | Añadir `width` y `height` a todas las imágenes, o usar `aspect-ratio` en CSS             |
| **FID** → **INP** (Interaction to Next Paint) | jQuery + Bootstrap + múltiples librerías | Evaluar lazy-loading de librerías no críticas (pickadate, parsley, etc.)                 |
| **FCP** (First Contentful Paint)              | CSS grande bloqueante                    | Critical CSS inline para el hero, resto async                                            |

### 3.4 Indexabilidad

| Problema                         | Acción                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| No hay `sitemap.xml`             | Crear `/sitemap.xml` con URLs principales: `/`, `/cv/`, `/ask/t/{codes}` (dinámico) |
| No hay `robots.txt`              | Crear `/robots.txt` que permita todo y apunte al sitemap                            |
| Formularios sin `rel="nofollow"` | Añadir `rel="nofollow"` al formulario para no desperdiciar crawl budget             |

### 3.5 Keywords a reforzar

Basado en tu LinkedIn y en lo que buscan los reclutadores:

| Keyword                        | Dónde reforzar                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| "Senior Fullstack Engineer"    | `<title>`, `h1`, Schema.org, primer párrafo visible                                           |
| "AI-Augmented Developer"       | Hero subtitle, bio, Schema.org                                                                |
| "Zoho CRM Deluge"              | Skills, proyectos, meta keywords (aunque Google ya no usa meta keywords, sí LinkedIn y otros) |
| "Next.js"                      | Skills, bio (actualmente falta)                                                               |
| "Clean Architecture"           | Workflow, bio                                                                                 |
| "Oracle PostgreSQL SQL Server" | Skills (actualmente solo PostgreSQL y SQL Server)                                             |
| "Remoto Colombia"              | Contacto, Schema.org address                                                                  |

---

## PARTE 4: 📋 PLAN DE IMPLEMENTACIÓN ORDENADO

> 🗓️ **Actualizado:** 2026-04-24 — Fase 1 completa + Usabilidad crítica + SEO restante completados. Ver estado abajo.

### ✅ Sprint 0 — Quick Wins REALIZADOS (15 min)
- [x] Cambiar `<title>` a "Senior Fullstack Engineer · AI-Augmented · Zoho Ecosystem"
- [x] Actualizar `meta description` con keywords upfront
- [x] Actualizar Schema.org con `jobTitle` y `knowsAbout` ampliado
- [x] Alinear Open Graph y Twitter Cards con nuevo título
- [x] Corregir 3 errores ortográficos en footer (obtendidos→obtenidos, tube→tuve, de la casa→propio)
- [x] **FIX LINK CV:** Corregir enlace de descarga CV — quitar atributo `download` del `<a>` que interfería con `FileResponse` de la vista `descargar_cv_real`

### ✅ Sprint 1 — SEO restante COMPLETADO (30 min)
- [x] Reforzar `h1` con keyword: `Hola, soy Jaime Díaz — Senior Fullstack Engineer`
- [x] Crear `robots.txt`
- [x] `sitemap.xml` ya operativo con Django sitemap

### 🔄 Sprint 2 — Usabilidad crítica (70% completado)
- [x] Reducir menú a 6 items máximo (consolidar "Mis números" + "Tecnologías")
- [x] Mover "Reportar Bug" al footer
- [ ] Añadir `poster` a videos de fondo (requiere imagen de fallback)
- [ ] Añadir indicador de scroll en hero (flecha animada)
- [x] Corregir jerarquía de footers (uno solo, claro)

### Sprint 3 — Carrusel GitHub (2-3 horas)
- [ ] Crear `jdGitHubCarousel.js`
- [ ] Crear `github-carousel.css`
- [ ] Insertar sección en `home.html`
- [ ] Integrar en `jdController.js`
- [ ] Probar responsive y performance

### Sprint 4 — Polishing (30 min)
- [ ] Añadir `loading="lazy"` a imágenes below-fold
- [ ] Revisar contraste de chips sobre video
- [ ] Añadir botón de pausa a videos de fondo (accesibilidad)
- [ ] Test en móvil real

---

## PARTE 5: 🧠 ANÁLISIS DE ARCHIVOS JS IMPLICADOS

### 5.1 Flujo de datos actual (GitHub)

```
home.html carga
    ↓
jdController.js (DOMContentLoaded)
    ↓
window.JD_API.GITHUB_REPOS_URL = "{% url 'github_repos_api' %}"
    ↓
jdWelcomeTerminal.js inicializa terminal
    ↓
Terminal ejecuta "ls github_projects/"
    ↓
github.js → loadGitHubData() hace AJAX a la API
    ↓
API Django (github_repos_api) devuelve JSON agrupado
    ↓
github.js formatea para terminal (tree view con ASCII art)
    ↓
Terminal muestra repos animados línea por línea
```

### 5.2 Flujo de datos propuesto (Carrusel)

```
home.html carga
    ↓
jdController.js (DOMContentLoaded)
    ↓
initGitHubCarousel() se ejecuta
    ↓
Reutiliza window.loadGitHubData() (ya cargado por terminal, o lo llama)
    ↓
Obtiene el mismo JSON de la API
    ↓
Formatea para cards (no tree view, sino tarjetas visuales)
    ↓
Renderiza en #github-carousel-track
    ↓
Inicializa Swiper en modo marquee infinito
    ↓
El carrusel se mueve solo, pausa al hover, clic para abrir repo
```

### 5.3 Ventajas de esta arquitectura

✅ **Reutilización máxima**: No se toca la API ni `github.js`, solo se consume la misma data  
✅ **Sin duplicar requests**: Si `loadGitHubData()` ya cargó, el carrusel usa la misma Promise  
✅ **Fallback natural**: Si la API falla, el carrusel muestra el mismo mensaje de error que la terminal  
✅ **Mantenible**: El carrusel es un componente independiente que se puede desactivar fácilmente  

---

## PARTE 6: ✅ CHECKLIST PRE-IMPLEMENTACIÓN

- [x] Revisar que `github_repos_api` esté funcionando actualmente
- [x] Confirmar versión de Swiper.js soporta `freeMode` + `autoplay` juntos
- [x] Verificar que `backdrop-filter` funciona en los navegadores objetivo (reclutadores usan Chrome/Edge/Safari)
- [ ] Hacer backup/commit antes de empezar
- [ ] Preparar imagen de `poster` para videos de fondo (frame estático)

---

> **Nota:** Este plan está diseñado para ser implementado por fases. Cada sprint es independiente y puede desplegarse por separado sin romper lo anterior.

---

## 📊 RESUMEN DE ESTADO

| Sprint                        | Estado            | Items | Tiempo estimado restante |
| ----------------------------- | ----------------- | ----- | ------------------------ |
| Sprint 0 — Quick Wins         | ✅ **COMPLETADO**  | 6/6   | 0 min                    |
| Sprint 1 — SEO restante       | ✅ **COMPLETADO**  | 3/3   | 0 min                    |
| Sprint 2 — Usabilidad crítica | 🔄 **EN PROGRESO** | 3/5   | 15 min                   |
| Sprint 3 — Carrusel GitHub    | 🔲 **PENDIENTE**   | 5/5   | 2-3 h                    |
| Sprint 4 — Polishing          | 🔲 **PENDIENTE**   | 4/4   | 30 min                   |

**Total pendiente:** ~3 horas de trabajo (Carrusel GitHub + Polishing + poster videos).
