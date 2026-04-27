# HISTORIA DE USUARIO HU-006 v2.0
## MEJORA UI/UX PROFESIONAL PARA SISTEMA DE BLOG

---

### 🎯 IDENTIFICACION
| Campo                    | Valor                               |
| ------------------------ | ----------------------------------- |
| **ID**                   | HU-006                              |
| **Nombre**               | Mejora visual profesional del blog  |
| **Fecha creación**       | 26/04/2026                          |
| **Actualización**        | Actualizada con diagnóstico V2      |
| **Autor**                | Jaime Díaz                          |
| **Prioridad**            | ALTA                                |
| **Epic**                 | Sistema de Blog                     |
| **Estado**               | ✅ EN PROGRESO (ACTUALIZACION)       |
| **Avance actual**        | 🔄 ACTUALIZACION CON NUEVOS FEATURES |
| **Ultima actualizacion** | 27/04/2026                          |
| **Puntos historia**      | 8                                   |

---

### 📋 DESCRIPCIÓN
Como **usuario lector del blog**
Quiero **leer articulos con diseño profesional, buena legibilidad y ritmo visual**
Para **poder leer articulos completos sin cansancio, y percibir el contenido como de alta calidad**

---

### ✅ CRITERIOS DE ACEPTACIÓN

#### 🔴 BLOQUE 1: PRIORIDAD ALTA - LEGIBILIDAD
- [x] El ancho maximo del contenido del blog no supere los 720px (≈70 caracteres por linea)
- [x] Exista jerarquia visual clara y diferenciada entre H1, H2, H3, parrafos, citas y codigo
- [x] Los margenes verticales sean variables segun la importancia del elemento
- [x] Se utilicen dos familias tipograficas complementarias: una para titulos y otra para cuerpo
- [x] Implementar Sistema de Layout Dual: `.container-narrow` para texto, `.container-fluid` para elementos visuales
- [x] Botones de reacciones tienen significado claro con tooltips y etiquetas
- [x] Todos los avatares mantienen proporcion circular 1:1 en todo momento
- [x] Enlace "Volver al listado" tiene peso visual suficiente y es visible
- [x] No se usan emojis nativos, solo iconos uniformes de Font Awesome
- [x] El tiempo medio de lectura por articulo se incremente en al menos un 40%

#### 🟠 BLOQUE 2: PRIORIDAD MEDIA - EXPERIENCIA
- [x] Todos los links y elementos interactivos tengan transiciones suaves de 200ms
- [x] El espaciado entre parrafos sea mayor a 1.5rem
- [x] El texto este justificado unicamente en pantallas mayores a 768px
- [x] Los botones de reacciones ya se encuentren maquetados visualmente (sin funcionalidad)
- [x] La seccion de comentarios ya se encuentren maquetada visualmente (sin funcionalidad)
- [x] Crear plantilla estandar Markdown obligatoria con todos los campos SEO
- [x] Carrusel 100% ancho de pantalla con articulos relacionados al final del articulo
- [x] Barra de progreso de lectura fija en la parte superior
- [x] Botones de reacciones tienen estado activo visual claro
- [x] Mostrar tiempo de lectura estimado en la cabecera

#### 🟡 BLOQUE 3: PRIORIDAD BAJA - DETALLES PROFESIONALES
- [x] El separador `<hr>` tenga un estilo personalizado con identidad visual
- [x] Existan puntos de acento de color cada 3 secciones
- [x] Las listas tengan estilos personalizados no por defecto del navegador
- [x] Todas las imagenes tengan efecto de escala suave al pasar el cursor
- [x] Botones de compartir para LinkedIn, Twitter y correo
- [x] Cada H2 y H3 tiene boton de copiar enlace
- [x] Mostrar numero total de comentarios
- [x] Barra lateral flotante de reacciones con logica scroll
- [x] Aumentar ancho contenedor articulo para mayor respiracion
- [x] Fondo blanco con sombra para separar contenido visualmente
- [ ] ✨ SISTEMA GALERIA POPUP MODAL
- [ ] Botones de navegacion posicionados correctamente en extremos
- [ ] Boton cierre X estandar en esquina superior derecha
- [ ] Zonas de tacto segun estandar WCAG 48px minimo
- [ ] Backdrop blur y profundidad visual
- [ ] Responsividad mobile adaptativa: botones en zona inferior pulgar
- [ ] Badge contador de imagenes flotante sobre miniatura
- [ ] Navegacion por teclado y tecla escape
- [ ] Animaciones suaves sin distraccion
- [ ] Contador de posicion de imagen

---

### 🎨 ESPECIFICACIONES UI/UX
| Elemento                | Especificacion                      |
| ----------------------- | ----------------------------------- |
| **Fuente Titulos**      | Inter 700                           |
| **Fuente Cuerpo**       | Inter 400                           |
| **Altura linea cuerpo** | 1.8                                 |
| **Ritmo vertical**      | Patron 2 / 4 / 8 rem segun elemento |
| **Transiciones**        | Todas `ease-out 200ms`              |
| **Radio esquinas**      | `6px` para todos los elementos      |
| **Sombra elementos**    | `0 2px 12px rgba(0,0,0,0.06)`       |

---

### 📏 METRICAS DE EXITO
- ✅ Puntuacion legibilidad: > 85/100
- ✅ Tiempo permanencia medio: > 3:15 minutos
- ✅ Tasa finalizacion lectura: > 65%
- ✅ Puntuacion Lighthouse Accesibilidad: > 95
- ✅ Cumplimiento WCAG Nivel AA 100%

---

### ⚠️ RESTRICCIONES TECNICAS ACTUALIZADAS 27/04
- ❌ NO SE MODIFICARA NADA DEL SISTEMA DE IMPORTACION DE MARKDOWN
- ⚠️ SI SE MODIFICARA JAVASCRIPT NECESARIO PARA FUNCIONALIDAD POPUP
- ✅ SE AGREGA SISTEMA GALERIA POPUP NATIVO SIN DEPENDENCIAS EXTERNAS
- ✅ TODAS LAS MEJORAS MANTIENEN COMPATIBILIDAD RETROACTIVA
- ✅ EL CAMBIO SERA 100% TRANSPARENTE PARA TODO EL RESTO DEL SISTEMA

---

### 🚀 PROXIMOS PASOS
1. ✅ Esta Historia de Usuario
2. 🔜 Crear Plan de Accion con tareas desglosadas
3. 🔜 Implementar por bloques de prioridad
4. 🔜 Medir metricas antes y despues
5. 🔜 Ajustar segun resultados