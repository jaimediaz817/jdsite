# HU-20_C_V1: Agregar video en editor con data-mtp "video"

**Estado:** ✅ Pendiente
**Prioridad:** Media
**Dependencias:** HU-011.8_barra_herramientas_mtp_editor, HU-20_B.5_estilo_widget_mtp

---

## 🎯 Objetivo

Incorporar en la barra de herramientas MTP (ubicada en el *aside* derecho del editor) un nuevo botón que permita insertar rápidamente un bloque de video en el contenido markdown. El botón debe usar el atributo `data-mtp="video"` y comportarse de forma idéntica a los botones existentes (por ejemplo, el de **imagen**).

---

## ✅ Criterios de Aceptación

1. **Botón visible** en la barra MTP con un ícono representativo de video.
2. El botón lleva el atributo `data-mtp="video"` y está etiquetado como **MTP** al igual que el botón de imagen.
3. Al hacer clic, se inserta en la posición del cursor la plantilla:
   ```html
   <video src="" controls></video>
   ```
   (o el bloque MTP equivalente `:::video` si se prefiere).
4. La lógica de inserción se implementa en un **archivo separado** (`video-widget.js`) y es importada desde `mtp-toolbar.js`.
5. No se introducen dependencias nuevas; se reutilizan las librerías y estilos ya presentes en el proyecto.
6. Las pruebas manuales confirman que el editor sigue guardando y renderizando correctamente el contenido después de insertar el bloque de video.
7. Al hacer clic en el botón **Video** (data-mtp="video"), se abre un **modal simple** con un campo de texto para ingresar la URL de YouTube. Al confirmar, el video se inserta en el editor con la plantilla `<video src="{URL}" controls></video>`.
8. El bloque de video insertado debe estar **bordado** con un color de borde, **radio de 4px**, y conservar el **sello MTP** (clase o atributo que identifica el bloque como MTP), de forma similar al manejo de imágenes.
9. Se incluye un **dropdown** y un **icono informativo** junto al botón, que muestra instrucciones sobre cómo agregar un video y recuerda que el archivo debe estar guardado localmente antes de subirlo.
10. Al pulsar el botón **Video**, se abre un **modal** que permite al usuario **explorar archivos locales** (input type="file" con `accept="video/*"`) para seleccionar un archivo MP4 (u otro formato soportado). Al confirmar, el archivo se sube al servidor (reutilizando la lógica existente de subida de archivos) y se inserta en el editor la plantilla `<video src="{ruta_local}" controls></video>`.
11. El mismo modal ofrece una **opción alternativa** para insertar un video de YouTube: un campo de texto donde el usuario pega la URL del video. Al aceptar, se inserta en el editor el bloque de mosaico interactivo:
    ```html
    <div class="youtube-mosaic compact" onclick="window.open('{URL}', '_blank')">
      <img src="https://img.youtube.com/vi/{ID}/0.jpg" alt="Miniatura del video" />
      <div class="play-overlay"><i class="fas fa-play play-icon"></i></div>
      <div class="caption">Ver tutorial en YouTube</div>
    </div>
    ```
    donde `{ID}` es el identificador del video extraído de la URL.
12. El modal incluye **validaciones**: si se selecciona un archivo local, se verifica que sea un video permitido; si se ingresa una URL de YouTube, se valida que coincida con el patrón `https?://(www\.)?youtube\.com/watch\?v=...` o `https?://youtu.be/...`. En caso de error, se muestra un mensaje descriptivo.
13. Además del modal, el editor debe permitir **arrastrar y soltar** archivos de video desde el explorador del sistema, de forma idéntica a la funcionalidad existente para imágenes. Al soltar el archivo, se sube automáticamente y se inserta el bloque `<video src="{ruta_local}" controls></video>` con los estilos y sello MTP.
14. Al pasar el cursor sobre el botón **Video** (o sobre el área de arrastre) el puntero debe cambiar a un cursor de "arrastrar" (por ejemplo `cursor: move;` o `cursor: grab;`) para indicar la interacción de arrastre.

---

## 📐 Diseño

```
<aside class="mtp-toolbar">
  ...
  <button type="button" class="mtp-btn" data-mtp="video" title="Video">
    <i class="fa fa-video"></i>
  </button>
  ...
</aside>
```

El botón sigue el mismo estilo que los demás botones de la barra (clase `mtp-btn`, tooltip, etc.).

## 📋 Ejemplo de uso

**Video local (MP4 u otro formato soportado)**

```markdown
![Video de prueba: Mejoras UI/UX](20260528-2051-02.4027044.mp4)
```

Al insertar este markdown, el editor lo renderizará como:

```html
<video src="/media/blog_editor_temp/<user_id>/20260528-2051-02.4027044.mp4" controls></video>
```

**Video de YouTube (alternativa)**

```markdown
<div class="youtube-mosaic compact" onclick="window.open('https://www.youtube.com/watch?v=ydvR27eZEj4', '_blank')">
  <img src="https://img.youtube.com/vi/ydvR27eZEj4/0.jpg" alt="Miniatura del video tutorial de UI/UX" />
  <div class="play-overlay"><i class="fas fa-play play-icon"></i></div>
  <div class="caption">Ver tutorial en YouTube - Cursor Composer 2.5</div>
</div>
```

El modal permite al usuario elegir entre subir un archivo local o pegar la URL de YouTube; en ambos casos se inserta el bloque correspondiente en el editor.

---

## 🔧 Implementación

### Archivos a crear / modificar

| Archivo                                                   | Acción                                                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `backend/blog/static/blog/js/blog_editor/video-widget.js` | **Crear**: función `insertVideoTemplate()` que usa `easyMDE.codemirror.replaceSelection()` para insertar la plantilla de video. |
| `backend/blog/static/blog/js/blog_editor/mtp-toolbar.js`  | **Actualizar**: importar `video-widget.js` y registrar el nuevo botón con `data-mtp="video"`.                                   |
| `backend/blog/static/blog/css/blog_editor.css`            | **Actualizar**: estilos para el nuevo botón (icono, hover, etc.).                                                               |

### Pasos de implementación granular (máximo 20 min cada uno)

1. **Crear `video-widget.js`** con la función de inserción.
2. **Añadir botón al HTML** de la barra MTP (en `blog_editor.html`).
3. **Modificar `mtp-toolbar.js`** para que, al detectar `data-mtp="video"`, invoque la función del paso 1.
4. **Estilizar botón** en `blog_editor.css`.
6. **Implementar drag‑and‑drop** para videos en `video-widget.js` (reutilizando la lógica de `image-selector.js`).
7. **Añadir estilo de cursor** (`cursor: move;` o `cursor: grab;`) al botón/área de arrastre en `blog_editor.css`.
5. **Pruebas manuales**: abrir el editor, pulsar el botón y verificar que la plantilla se inserta y se renderiza.

---

## 🧪 Pruebas

1. Abrir `/blog/editor/` en el navegador.
2. Click en el nuevo botón **Video**.
3. Confirmar que se inserta `<video src="" controls></video>` en la posición del cursor.
4. Guardar y visualizar la publicación; el video debe mostrarse correctamente (aunque sin `src`).
5. Verificar que los demás botones (imagen, slides, etc.) siguen funcionando.

---

## 📦 Fases de Implementación

| Fase | Descripción                                                     |
| ---- | --------------------------------------------------------------- |
| 1    | Creación del widget JavaScript (`video-widget.js`).             |
| 2    | Integración del botón en la barra MTP y conexión con el widget. |
| 3    | Estilos y ajustes visuales.                                     |
| 4    | Pruebas y validación.                                           |

---

## 📄 Referencias

* HU-011.8: Barra de herramientas MTP.
* HU-20_B.5: Estilo widget MTP.
