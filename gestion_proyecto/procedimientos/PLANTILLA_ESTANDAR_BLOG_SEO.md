# 📝 PLANTILLA ESTANDAR BLOG SEO v1.0
## 🎯 Objetivo: Estandarizacion 100% de todos los articulos del blog

> ✅ Esta plantilla es OBLIGATORIA para TODO articulo nuevo.
> ✅ Cumplimiento 100% con las buenas practicas de Google 2026
> ✅ Optimizacion para posicionamiento organico
> ✅ Alineada con la voz y tono profesional de LinkedIn

---

## 📋 ESTRUCTURA OBLIGATORIA DEL ARCHIVO blog.md

```markdown
---
# ✅ CAMPOS METADATOS OBLIGATORIOS
title: "Titulo del articulo. Maximo 60 caracteres. Incluir palabra clave principal"
slug: titulo-del-articulo-palabra-clave-principal
meta_title: "Titulo SEO optimizado. Maximo 55 caracteres"
meta_description: "Descripcion del articulo. Maximo 155 caracteres. Incluir llamado a la accion"
author: Jaime Díaz
publish_date: 2026-04-26
tags: ["etiqueta1", "etiqueta2", "etiqueta3", "maximo 5 etiquetas"]
category: Categoria Principal
image: ./portada.jpg
tiempo_lectura: 7
palabra_clave_principal: "palabra clave objetivo"
---

# ✅ CONTENIDO DEL ARTICULO

## 🎯 Introduccion (1 parrafo maximo 3 lineas)
Comenzar directamente con el problema que resuelve este articulo.
No perder el tiempo con introducciones genericas.
El usuario tiene que saber en los primeros 3 segundos que va a ganar leyendo esto.

## 📌 Seccion 1 (H2)
Contenido de la seccion. Minimo 2 parrafos.
Maximo 5 lineas por parrafo.

## 📌 Seccion 2 (H2)
Contenido de la seccion.

### 📍 Subseccion (H3)
Contenido de la subseccion.

---

## ✅ CONCLUSION
1 parrafo resumiendo los puntos clave.
Terminar SIEMPRE con una pregunta abierta para incentivar comentarios.

---

## 📊 METRICAS Y LONGITUDES OBLIGATORIAS
| Elemento          | Longitud minima | Longitud maxima | Ideal |
| ----------------- | --------------- | --------------- | ----- |
| Titulo H1         | 40 caracteres   | 60 caracteres   | 52    |
| Meta Title        | 45 caracteres   | 55 caracteres   | 50    |
| Meta Description  | 120 caracteres  | 155 caracteres  | 145   |
| Contenido total   | 800 palabras    | 2500 palabras   | 1200  |
| Cantidad H2       | 3               | 7               | 5     |
| Cantidad imagenes | 2               | 5               | 3     |

---

## ✅ REGLAS DE CONTENIDO OBLIGATORIAS
1. ❌ NUNCA usar emojis nativos. Usar solo iconos Font Awesome
2. ❌ NUNCA usar lenguaje informal ni modismos
3. ❌ NUNCA usar IA para generar parrafos completos
4. ✅ Siempre agregar al menos un ejemplo practico
5. ✅ Siempre mencionar una experiencia personal real
6. ✅ Siempre terminar con una pregunta
7. ✅ Cada 3 parrafos agregar un punto de ruptura visual

--- 

## 📌 REGLAS ADICIONALES DE SEO

1. ✅ **Meta Title**: máximo 55 caracteres, incluir palabra clave principal al inicio.  
2. ✅ **Meta Description**: máximo 155 caracteres, resumir el contenido y contener una llamada a la acción.  
3. ✅ **Alt de imágenes**: describir brevemente la imagen, incluir palabra clave cuando sea relevante.  
4. ✅ **Enlaces internos**: al menos 2 enlaces a otros artículos del blog relacionados.  
5. ✅ **Uso de encabezados**: H2 para secciones principales, H3 para subsecciones, sin saltar niveles.  
6. ✅ **Longitud de párrafo**: no más de 5 líneas visibles; si supera, dividir en párrafos más cortos.  
7. ✅ **Formato de listas**: usar listas con viñetas o numeración para mejorar escaneabilidad.  

--- 

## 📝 FORMATO DE PÁRRAFOS (NORMALIZACIÓN AUTOMÁTICA)

El sistema ahora normaliza automáticamente los párrafos durante la importación:

### ✅ CÓMO ESCRIBIR PÁRRAFOS GRANDES:

```markdown
## Mi Sección

Esta es la primera línea de mi párrafo.
Esta es la segunda línea del mismo párrafo.
Y esta es la tercera línea.
Todo esto sigue siendo un solo párrafo.

Nueva línea vacía = nuevo párrafo.
```

**Resultado:** Las líneas consecutivas se unen automáticamente en un solo `<p>`.

### ❌ NO HACER ESTO (líneas vacías innecesarias):

```markdown
## Mi Sección

Esta es la primera línea de mi párrafo.

Esta es la segunda línea del mismo párrafo.

Esto generaría 3 párrafos separados innecesariamente.
```

### 📌 RESUMEN:
- **Líneas consecutivas** (sin línea vacía) = mismo párrafo → se unen con espacios
- **Línea vacía entre líneas** = nuevo párrafo

---

## 📝 FORMATO DE PÁRRAFOS (NORMALIZACIÓN AUTOMÁTICA)

El sistema ahora normaliza automáticamente los párrafos durante la importación:

### ✅ CÓMO ESCRIBIR PÁRRAFOS GRANDES:

```markdown
## Mi Sección

Esta es la primera línea de mi párrafo.
Esta es la segunda línea del mismo párrafo.
Y esta es la tercera línea.
Todo esto sigue siendo un solo párrafo.

Nueva línea vacía = nuevo párrafo.
```

**Resultado:** Las líneas consecutivas se unen automáticamente en un solo `<p>`.

### ❌ NO HACER ESTO (líneas vacías innecesarias):

```markdown
## Mi Sección

Esta es la primera línea de mi párrafo.

Esta es la segunda línea del mismo párrafo.

Esto generaría 3 párrafos separados innecesariamente.
```

### 📌 RESUMEN:
- **Líneas consecutivas** (sin línea vacía) = mismo párrafo → se unen con espacios
- **Línea vacía entre líneas** = nuevo párrafo

---

## ✅ EJEMPLO REAL APLICADO
```markdown
---
title: "Por que las integraciones Zoho fallan y como solucionarlas"
slug: por-que-las-integraciones-zoho-fallan
meta_title: "Por que fallan las integraciones Zoho | Jaime Díaz"
meta_description: "Aprende las 5 causas mas comunes por las que tus integraciones Zoho fallan y como solucionarlas definitivamente. Guia practica 2026."
author: Jaime Díaz
publish_date: 2026-04-24
tags: ["Zoho", "Integraciones", "CRM", "Desarrollo"]
category: Tecnologia
image: ./portada.jpg
tiempo_lectura: 8
palabra_clave_principal: "integraciones zoho fallan"
---
```

---

> 📌 Ultima actualizacion: 26/04/2026
> 📌 Aplicable desde HU-006