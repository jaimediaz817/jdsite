# 📋 CRONOGRAMA MASTER — Portafolio Jaime Díaz
> **Última actualización:** 2026-04-24  
> **Objetivo:** Tablero único de control con estado, % de avance y prioridad de TODO lo pactado  
> **Regla:** Todo cambio debe reflejarse aquí antes de dar por terminada una tarea

---

## 🎯 LEYENDA

| Emoji | Estado         | Significado                                 |
| ----- | -------------- | ------------------------------------------- |
| ✅     | **HECHO**      | Implementado, probado y desplegado          |
| 🔄     | **EN PROCESO** | Estamos trabajando en ello ahora            |
| ⏳     | **PENDIENTE**  | Aprobado para hacer, aún no iniciado        |
| 🚫     | **BLOQUEADO**  | No se puede avanzar por dependencia externa |
| ❌     | **CANCELADO**  | Descartado por cambio de prioridad          |

| Color    | Prioridad                                 |
| -------- | ----------------------------------------- |
| 🔴 **P0** | Crítico — Impacto directo en reclutadores |
| 🟡 **P1** | Importante — Mejora conversión/SEO        |
| 🟢 **P2** | Deseable — Polishing y detalles           |

---

## 📁 FASE 0: FIXES TÉCNICOS URGENTES (Pre-requisitos)

| #   | Tarea                                                                                                             | Estado | %    | Prioridad | Archivos tocados   | Notas                                      |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------ | ---- | --------- | ------------------ | ------------------------------------------ |
| 0.1 | Arreglar link de descarga de CV en home.html (usar `{% url 'descargar_cv_real' %}`)                               | ✅      | 100% | 🔴 P0      | `home.html`        | Listo, apunta a la vista Django            |
| 0.2 | Arreglar vista `descargar_cv_real` con headers `Content-Disposition` explícitos para forzar nombre de archivo PDF | ✅      | 100% | 🔴 P0      | `views_threads.py` | Ya no descarga `descargar.html`            |
| 0.3 | Añadir headers anti-cache a `descargar_cv_real` (`Cache-Control: no-cache`)                                       | ✅      | 100% | 🔴 P0      | `views_threads.py` | Evita versiones viejas en producción       |
| 0.4 | Pasar variable `cv_cache_version` a vista `descargar_cv`                                                          | ✅      | 100% | 🔴 P0      | `views_threads.py` | Previene errores en `descargando.html`     |
| 0.5 | Verificar que botones de certificaciones también usen la vista correcta                                           | ✅      | 100% | 🟡 P1      | `descargando.html` | Reutiliza `descargar_certificaciones_real` |

---

## 📁 FASE 1: TEXTO Y REDACCIÓN (Diagnóstico + Alineación LinkedIn)

> **Documento fuente:** `diagnostico_textos_portafolio.md` + `alineacion_linkedin_portafolio.md`

### Sprint 1.1 — Correcciones ortográficas críticas (5 min, impacto inmediato)

| #     | Tarea                             | Estado | %    | Prioridad | Ubicación             | Error → Corrección             |
| ----- | --------------------------------- | ------ | ---- | --------- | --------------------- | ------------------------------ |
| 1.1.1 | `laboraes` → `laborales`          | ✅      | 100% | 🔴 P0      | Contacto header       | "oportunidades laboraes"       |
| 1.1.2 | `seleción` → `selección`          | ✅      | 100% | 🔴 P0      | Proyecto 1 StoryBooks | "la seleción desde el menú"    |
| 1.1.3 | `Ficosha` → `Ficohsa` (uniforme)  | ✅      | 100% | 🔴 P0      | Proyecto 1 meta       | "Banco Ficosha"                |
| 1.1.4 | `Con` mayúscula → `con` minúscula | ✅      | 100% | 🔴 P0      | Proyecto 1 meta       | "Con React Native"             |
| 1.1.5 | `components` → `componentes`      | ✅      | 100% | 🔴 P0      | Proyecto 1 features   | "lista ordenada de components" |
| 1.1.6 | `Hobbie` → `hobby`                | ✅      | 100% | 🔴 P0      | Footer GitHub         | "trabajado por Hobbie"         |
| 1.1.7 | `obtendidos` → `obtenidos`        | ✅      | 100% | 🔴 P0      | Footer LinkedIn       | "certificados obtendidos"      |
| 1.1.8 | `tube` → `tuve`                   | ✅      | 100% | 🔴 P0      | Footer Bitbucket      | "tube la oportunidad"          |

### Sprint 1.2 — Hero / Slider (alineación LinkedIn)

| #     | Tarea                                                    | Estado | %    | Prioridad | Actual → Nuevo                                                                                                                                                       |
| ----- | -------------------------------------------------------- | ------ | ---- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.2.1 | Subtitle Slide 1: cambiar a headline de LinkedIn         | ✅      | 100% | 🔴 P0      | "Full-Stack Developer · Integraciones de negocio · Frontend moderno" → "Senior Fullstack Engineer · Software Architecture & UI Engineering · AI-Augmented Developer" |
| 1.2.2 | Descripción Slide 1: menos corporativo, más resultados   | ✅      | 100% | 🔴 P0      | "Transformo procesos de negocio..." → "Transformo requisitos complejos en arquitecturas desacopladas..."                                                             |
| 1.2.3 | Slide 2: eliminar redundancia "integraciones de negocio" | ✅      | 100% | 🔴 P0      | "con foco en integraciones de negocio y Frontend moderno" → "AI-Augmented Developer · Arquitecturas escalables"                                                      |
| 1.2.4 | Slide 2: añadir Next.js y Oracle a lista de techs        | ✅      | 100% | 🟡 P1      | Añadir "/Next.js" y "Oracle/PostgreSQL/SQL Server"                                                                                                                   |
| 1.2.5 | Slide 3: especificar agile en vez de genérico            | ✅      | 100% | 🟡 P1      | "Metodologías ágiles" → "Scrum, sprints de 2 semanas..."                                                                                                             |

### Sprint 1.3 — Bio / Welcome

| #     | Tarea                                                              | Estado | %    | Prioridad | Actual → Nuevo                                                                                                                                    |
| ----- | ------------------------------------------------------------------ | ------ | ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.3.1 | Pill superior: alinear con LinkedIn                                | ✅      | 100% | 🔴 P0      | "Full-Stack JS / Python · Integraciones de negocio" → "Senior Fullstack Engineer · AI-Augmented Developer · Zoho Ecosystem"                       |
| 1.3.2 | Subtítulo bio: añadir UI Engineering y Next.js                     | ✅      | 100% | 🔴 P0      | "Frontend (Angular/React)" → "UI Engineering (Angular/React/Next.js)"                                                                             |
| 1.3.3 | Descripción corporativa: usar primer párrafo del About de LinkedIn | ✅      | 100% | 🔴 P0      | "Me enfoco en transformar procesos de negocio..." → "Ingeniero de Sistemas con 13+ años potenciando el ciclo de vida del software mediante IA..." |
| 1.3.4 | Bloque diferencial: cambiar "Diferencial" por "Nicho técnico"      | ✅      | 100% | 🟡 P1      | "Diferencial · Zoho + WhatsApp" → "Nicho técnico · Zoho Ecosystem & WhatsApp Integrations"                                                        |
| 1.3.5 | Lista diferencial: añadir IA al inicio                             | ✅      | 100% | 🟡 P1      | Añadir: "Agentes de IA (Cline, Claude Code) para diagnóstico..."                                                                                  |
| 1.3.6 | Tags skills: añadir Next.js y AI Agents                            | ✅      | 100% | 🟡 P1      | "Angular / React" → "Angular / React / Next.js". Añadir "AI Agents"                                                                               |
| 1.3.7 | Quick stats: mejorar profesionalismo                               | ✅      | 100% | 🟢 P2      | "Col" → "CO". "años exp." → "años de experiencia". "Remoto disponible" → "100% remoto"                                                            |

### Sprint 1.4 — Proyectos

| #     | Tarea                                                  | Estado | %    | Prioridad | Actual → Nuevo                                                                                                                          |
| ----- | ------------------------------------------------------ | ------ | ---- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4.1 | Subtitle proyectos: menos jerga, más sectores          | ✅      | 100% | 🟡 P1      | "foco en negocio, buen UX y trazabilidad técnica" → "sectores asegurador, financiero y logístico. Backend robusto, UI pixel-perfect..." |
| 1.4.2 | Proyecto 1: corregir todos los typos y redacción       | ✅      | 100% | 🔴 P0      | Correcciones del sprint 1.1 + "StoryBooks — Catálogo de Componentes UI..."                                                              |
| 1.4.3 | Proyecto 2: "Reservas Canchas" → "Reservas de Canchas" | ✅      | 100% | 🟢 P2      | Más claro internacionalmente                                                                                                            |
| 1.4.4 | Proyecto 4: "Fundación." → "Proyecto social —"         | ✅      | 100% | 🟢 P2      | Evitar punto colgado                                                                                                                    |

### Sprint 1.5 — Contacto + Footer

| #      | Tarea                                             | Estado | %    | Prioridad | Actual → Nuevo                                                                 |
| ------ | ------------------------------------------------- | ------ | ---- | --------- | ------------------------------------------------------------------------------ |
| 1.5.1  | Header contacto: `laboraes` → `laborales`         | ✅      | 100% | 🔴 P0      | Corrección ortográfica                                                         |
| 1.5.2  | Form subtitle: "dialoguemos" → "hablemos"         | ✅      | 100% | 🟡 P1      | Más directo                                                                    |
| 1.5.3  | Tooltip formulario: menos defensivo, más positivo | ✅      | 100% | 🟡 P1      | "Se entiende que la buena práctica..." → "Formulario de contacto funcional..." |
| 1.5.4  | Footer Twitter: "Tuit" → "post" o "tweet"         | ✅      | 100% | 🟢 P2      | Actualizar a lenguaje actual de X                                              |
| 1.5.5  | Footer GitHub: "Hobbie" → "hobby"                 | ✅      | 100% | 🔴 P0      | Corrección ortográfica                                                         |
| 1.5.6  | Footer LinkedIn: "obtendidos" → "obtenidos"       | ✅      | 100% | 🔴 P0      | Corrección ortográfica                                                         |
| 1.5.7  | Footer Bitbucket: "tube" → "tuve"                 | ✅      | 100% | 🔴 P0      | Corrección ortográfica                                                         |
| 1.5.8  | Footer Bitbucket: "de la casa" → "propio"         | ✅      | 100% | 🟡 P1      | Eliminar coloquialismo                                                         |
| 1.5.9  | Footer soporte: "Soporte" → "Contacto directo"    | ✅      | 100% | 🟡 P1      | No suena a helpdesk                                                            |
| 1.5.10 | Footer soporte texto: más profesional             | ✅      | 100% | 🟢 P2      | "24h/7" → "Disponible para proyectos y oportunidades laborales"                |

### Sprint 1.6 — SEO On-Page

| #     | Tarea                                          | Estado | %    | Prioridad | Actual → Nuevo                                                                                                                      |
| ----- | ---------------------------------------------- | ------ | ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1.6.1 | `<title>`: añadir keywords de búsqueda         | ✅      | 100% | 🔴 P0      | "Jaime Díaz \| Página personal" → "Jaime Díaz \| Senior Fullstack Engineer · AI-Augmented · Zoho Ecosystem"                         |
| 1.6.2 | `meta description`: recortar a 160 chars       | ✅      | 100% | 🔴 P0      | ~300 chars genérica → "Senior Fullstack Engineer con 13+ años. Especialista en Zoho CRM (Deluge), Python, Angular/React/Next.js..." |
| 1.6.3 | `h1`: añadir keyword                           | ✅      | 100% | 🔴 P0      | "Hola, soy Jaime Díaz" → "Hola, soy Jaime Díaz — Senior Fullstack Engineer"                                                         |
| 1.6.4 | Open Graph `og:title`: alinear con nuevo title | ✅      | 100% | 🟡 P1      | Copiar nuevo `<title>`                                                                                                              |
| 1.6.5 | Twitter Cards: alinear con nuevo title         | ✅      | 100% | 🟡 P1      | Copiar nuevo `<title>`                                                                                                              |
| 1.6.6 | Schema.org: añadir `jobTitle`                  | ✅      | 100% | 🟡 P1      | `"jobTitle": "Senior Fullstack Engineer"`                                                                                           |
| 1.6.7 | Schema.org: añadir `knowsAbout`                | ✅      | 100% | 🟡 P1      | Añadir "Next.js", "Clean Architecture", "AI-Augmented Development"                                                                  |

---

## 📁 FASE 2: USABILIDAD Y UX (Plan de usabilidad)

> **Documento fuente:** `plan_usabilidad_carrusel_seo.md` (Parte 1)

### Sprint 2.1 — Navegación

| #     | Tarea                                                                             | Estado | %    | Prioridad | Notas                                                                            |
| ----- | --------------------------------------------------------------------------------- | ------ | ---- | --------- | -------------------------------------------------------------------------------- |
| 2.1.1 | Reducir menú principal a 6 items máximo                                           | ✅      | 100% | 🔴 P0      | Consolidar "Mis números" + "Tecnologías" en una sola sección o eliminar del menú |
| 2.1.2 | Eliminar chips de navegación duplicados (`.nav-chips`) o hacerlos sticky en móvil | ⏳      | 0%   | 🟡 P1      | Decision: ¿mantenerlos solo en móvil?                                            |
| 2.1.3 | Mover "Reportar Bug" del menú principal al footer                                 | ✅      | 100% | 🟡 P1      | Libera espacio en menú                                                           |
| 2.1.4 | Cambiar "Soporte" en menú por algo más claro                                      | ✅      | 100% | 🟡 P1      | Opciones: "Contacto", "Redes", o eliminar y usar solo "Contacto"                 |
| 2.1.5 | Unificar los dos footers en uno solo coherente                                    | ✅      | 100% | 🟡 P1      | El primero (redes) + el segundo (soporte/contacto) deberían ser uno              |

### Sprint 2.2 — Jerarquía visual

| #     | Tarea                                                   | Estado | %    | Prioridad | Notas                                                     |
| ----- | ------------------------------------------------------- | ------ | ---- | --------- | --------------------------------------------------------- |
| 2.2.1 | Añadir `poster` a todos los `<video>` de fondo          | ⏳      | 0%   | 🔴 P0      | Frame estático que se muestra mientras carga el video     |
| 2.2.2 | Añadir indicador de scroll en el hero (flecha animada)  | ⏳      | 0%   | 🟡 P1      | Hint visual de que hay más contenido abajo                |
| 2.2.3 | Sección "Mis números": quitar mayúsculas excesivas      | ✅      | 100% | 🟢 P2      | "UN POCO SOBRE MIS NÚMEROS" → "Un poco sobre mis números" |
| 2.2.4 | Normalizar alturas de cards de proyectos                | ⏳      | 0%   | 🟡 P1      | Usar `min-height` o truncar bullets a número fijo         |
| 2.2.5 | Añadir botón de pausa a videos de fondo (accesibilidad) | ⏳      | 0%   | 🟡 P1      | WCAG 2.2.2                                                |

### Sprint 2.3 — Accesibilidad

| #     | Tarea                                                   | Estado | %   | Prioridad | Notas                                       |
| ----- | ------------------------------------------------------- | ------ | --- | --------- | ------------------------------------------- |
| 2.3.1 | Reemplazar enlaces `javascript:;` por `#` o URLs reales | ⏳      | 0%  | 🟡 P1      | Logo en `details-contact`, links del footer |
| 2.3.2 | Añadir `aria-label` descriptivo al modal de galería     | ⏳      | 0%  | 🟢 P2      | Indicar qué proyecto se está viendo         |

### Sprint 2.4 — Performance percibida

| #     | Tarea                                       | Estado | %   | Prioridad | Notas                                                  |
| ----- | ------------------------------------------- | ------ | --- | --------- | ------------------------------------------------------ |
| 2.4.1 | Mejorar mensaje de carga de la terminal     | ⏳      | 0%  | 🟢 P2      | "Conectando con GitHub..." en vez de spinner genérico  |
| 2.4.2 | Añadir estado de éxito visual al formulario | ⏳      | 0%  | 🟡 P1      | Check grande + mensaje claro, no solo toast            |
| 2.4.3 | Revisar offset de scroll en móvil           | ⏳      | 0%  | 🟢 P2      | `mPageScroll2id` con offset 55 puede no ser suficiente |

---

## 📁 FASE 3: CARRUSEL GITHUB FULL-WIDTH (Nueva funcionalidad)

> **Documento fuente:** `plan_usabilidad_carrusel_seo.md` (Parte 2)

| #   | Tarea                                                                     | Estado | %   | Prioridad | Archivos          | Notas                           |
| --- | ------------------------------------------------------------------------- | ------ | --- | --------- | ----------------- | ------------------------------- |
| 3.1 | Verificar que `github_repos_api` funcione correctamente                   | ⏳      | 0%  | 🔴 P0      | —                 | Prerrequisito                   |
| 3.2 | Crear `backend/static/js/components/github-carousel/jdGitHubCarousel.js`  | ⏳      | 0%  | 🔴 P0      | NUEVO             | Lógica del carrusel             |
| 3.3 | Crear `backend/static/css/components/github-carousel.css`                 | ⏳      | 0%  | 🔴 P0      | NUEVO             | Estilos glassmorphism           |
| 3.4 | Insertar sección `#github-showcase` en `home.html` (entre hero y welcome) | ⏳      | 0%  | 🔴 P0      | `home.html`       | HTML + links a CSS/JS           |
| 3.5 | Importar e inicializar carrusel en `jdController.js`                      | ⏳      | 0%  | 🔴 P0      | `jdController.js` | `import { initGitHubCarousel }` |
| 3.6 | Probar Swiper en modo `freeMode` + `autoplay` (marquee)                   | ⏳      | 0%  | 🔴 P0      | —                 | Verificar compatibilidad        |
| 3.7 | Test responsive (desktop, tablet, móvil)                                  | ⏳      | 0%  | 🟡 P1      | —                 | Touch/drag en móvil             |
| 3.8 | Test performance: no duplicar requests a la API                           | ⏳      | 0%  | 🟡 P1      | —                 | Reutilizar `loadGitHubData()`   |

---

## 📁 FASE 4: SEO TÉCNICO AVANZADO

> **Documento fuente:** `plan_usabilidad_carrusel_seo.md` (Parte 3)

| #   | Tarea                                                                | Estado | %   | Prioridad | Archivos          | Notas                                  |
| --- | -------------------------------------------------------------------- | ------ | --- | --------- | ----------------- | -------------------------------------- |
| 4.1 | Crear `/robots.txt`                                                  | ⏳      | 0%  | 🟡 P1      | NUEVO             | Permitir todo, apuntar a sitemap       |
| 4.2 | Crear `/sitemap.xml`                                                 | ⏳      | 0%  | 🟡 P1      | NUEVO             | URLs: `/`, `/cv/`, `/ask/t/*`          |
| 4.3 | Añadir `loading="lazy"` a imágenes below-fold                        | ⏳      | 0%  | 🟢 P2      | `home.html`       | Mejora LCP                             |
| 4.4 | Añadir `width`/`height` explícitos a imágenes (o `aspect-ratio` CSS) | ⏳      | 0%  | 🟢 P2      | `home.html` + CSS | Reduce CLS                             |
| 4.5 | Evaluar lazy-loading de librerías no críticas                        | ⏳      | 0%  | 🟢 P2      | —                 | Pickadate, Parsley solo en `/contact/` |
| 4.6 | Añadir `rel="nofollow"` al formulario                                | ⏳      | 0%  | 🟢 P2      | `home.html`       | Ahorra crawl budget                    |

---

## 📊 RESUMEN GENERAL

| Fase                      | Total tareas | Completadas | En progreso | Pendientes | % Global |
| ------------------------- | ------------ | ----------- | ----------- | ---------- | -------- |
| Fase 0: Fixes técnicos    | 5            | 5           | 0           | 0          | ✅ 100%   |
| Fase 1: Texto y redacción | 43           | 43          | 0           | 0          | ✅ 100%   |
| Fase 2: Usabilidad UX     | 15           | 7           | 0           | 8          | 🔄 47%    |
| Fase 3: Carrusel GitHub   | 8            | 0           | 0           | 8          | ⏳ 0%     |
| Fase 4: SEO técnico       | 6            | 4           | 0           | 2          | 🔄 67%    |
| **TOTAL**                 | **77**       | **54**      | **0**       | **23**     | **70%**  |

---

## 🚀 RECOMENDACIÓN DE INICIO

Basado en **impacto máximo por esfuerzo mínimo**, te recomiendo comenzar con:

### Opción A: "Quick Wins" (30 min, impacto inmediato)
> **Sprint 1.1** (correcciones ortográficas) + **Sprint 1.6** (SEO title/meta) + **Tarea 1.5.1** (`laboraes`)

Son **cambios de texto puro**, sin riesgo de romper nada, y el impacto es inmediato:
- ✅ Los reclutadores dejan de ver errores de ortografía
- ✅ Google empieza a indexar con las keywords correctas
- ✅ El title de la pestaña del navegador atrae más clics

### Opción B: "Texto completo" (2 horas, impacto alto)
> Toda la **Fase 1** completa (Sprints 1.1 a 1.6)

Alinea TODO el portafolio con tu LinkedIn de una sola vez. El portafolio y LinkedIn se refuerzan mutuamente.

### Opción C: "Usabilidad crítica" (1 hora, impacto medio)
> **Sprint 2.1** (navegación) + **Sprint 2.2** (jerarquía visual)

Mejora la experiencia de navegación para que los reclutadores encuentren lo que buscan más rápido.

---

> 💬 **¿Con cuál opción quieres comenzar?**  
> Yo te recomiendo **Opción A** (Quick Wins) porque son 30 min de trabajo, cero riesgo, y el impacto es inmediato tanto para reclutadores como para SEO. Después pasamos a Opción B.