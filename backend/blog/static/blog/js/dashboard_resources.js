(function() {
  // Filtros
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) {
        b.classList.remove('active-filter');
      });
      this.classList.add('active-filter');
      var filter = this.dataset.filter;
      document.querySelectorAll('.resource-row').forEach(function(row) {
        if (filter === 'all' || row.dataset.status === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // Select all checkboxes
  var selectAll = document.getElementById('select-all');
  if (selectAll) {
    selectAll.addEventListener('change', function() {
      var checked = this.checked;
      document.querySelectorAll('.orphan-checkbox').forEach(function(cb) {
        cb.checked = checked;
      });
      updateDeleteButton();
    });
  }

  // Individual checkboxes
  document.querySelectorAll('.orphan-checkbox').forEach(function(cb) {
    cb.addEventListener('change', updateDeleteButton);
  });

  function updateDeleteButton() {
    // Contar cualquier checkbox marcado dentro del dashboard (incluye orphan y select-all)
    var checked = document.querySelectorAll('input[type="checkbox"]:checked');
      var btn = document.getElementById('btn-delete-selected');
      if (btn) {
        btn.disabled = checked.length === 0;
        btn.textContent = checked.length > 0
          ? '🗑️ Eliminar ' + checked.length + ' seleccionados'
          : '🗑️ Eliminar seleccionados';
      }
      
    // Mostrar/ocultar botón "Ir arriba" según haya al menos un checkbox marcado
    var goTopBtn = document.getElementById('go-top-btn');
    if (goTopBtn) {
      if (checked.length > 0) {
        goTopBtn.classList.add('show');
        goTopBtn.classList.remove('hide');
      } else {
        goTopBtn.classList.remove('show');
        goTopBtn.classList.add('hide');
      }
    }
  }

  // Delete selected
  var deleteBtn = document.getElementById('btn-delete-selected');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      var checked = document.querySelectorAll('.orphan-checkbox:checked');
      if (checked.length === 0) return;
      var folders = [];
      // Cada checkbox tiene el atributo data-folder con el nombre de la carpeta
      checked.forEach(function(cb) { folders.push(cb.getAttribute('data-folder')); });
      if (!confirm('¿Eliminar permanentemente ' + folders.length + ' carpeta(s)?')) return;

      fetch(DELETE_FILE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': CSRF_TOKEN
        },
        body: JSON.stringify({folder: folders})
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          alert('✅ ' + (data.message || 'Carpetas eliminadas correctamente'));
          location.reload();
        } else {
          alert('❌ Error: ' + (data.message || data.error || 'Error desconocido'));
        }
      })
      .catch(function(err) {
        alert('Error de red: ' + err);
      });
    });
  }

  // -----------------------------------------------------------------
  // Acción del botón "Ir arriba" (scroll suave)
  // -----------------------------------------------------------------
  var goTopBtn = document.getElementById('go-top-btn');
  if (goTopBtn) {
  goTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    // Scroll suave al top usando la API de scroll del window
    if ('scrollTo' in window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Fallback para navegadores que no soporten scrollTo con options
    document.body.scrollTop = 0; // Safari
    document.documentElement.scrollTop = 0; // Chrome, Firefox, IE
    // Asegurarse de que el elemento raíz también haga scroll suave
    if (document.documentElement && typeof document.documentElement.scrollIntoView === 'function') {
      document.documentElement.scrollIntoView({ behavior: 'smooth' });
    }
    // Opcional: ocultar el botón tras un breve retardo
    setTimeout(function() {
      goTopBtn.classList.remove('show');
      goTopBtn.classList.add('hide');
    }, 800);
  });
  }

  // Toggle orphan section visibility (expand/contract)
  var toggleOrphansBtn = document.getElementById('toggle-orphans');
  var orphansContent = document.getElementById('orphans-content');
  if (toggleOrphansBtn && orphansContent) {
    toggleOrphansBtn.addEventListener('click', function () {
      var isHidden = orphansContent.style.display === 'none' || orphansContent.style.display === '';
      orphansContent.style.display = isHidden ? 'block' : 'none';
      this.innerHTML = isHidden ? '<i class="fas fa-chevron-up me-1"></i>Ocultar' : '<i class="fas fa-chevron-down me-1"></i>Mostrar';
    });
  }

  // Select/Deselect all orphan checkboxes inside the collapsible table
  var selectAllOrphans = document.getElementById('select-all-orphans');
  if (selectAllOrphans) {
    selectAllOrphans.addEventListener('change', function () {
      var checked = this.checked;
      document.querySelectorAll('.orphan-checkbox').forEach(function (cb) {
        cb.checked = checked;
      });
      updateDeleteButton();
    });
  }

  // -----------------------------------------------------------------
  // Mejorar la zona clicable de los checkboxes: al hacer click en el nombre
  // completo del recurso se marca/desmarca el checkbox correspondiente.
  // -----------------------------------------------------------------
  // Tabla de compilación (resource rows)
  document.querySelectorAll('.resource-row').forEach(function (row) {
    var nameCell = row.querySelector('td code');
    var checkbox = row.querySelector('input.orphan-checkbox');
    if (nameCell && checkbox) {
      nameCell.style.cursor = 'pointer';
      nameCell.addEventListener('click', function (e) {
        // Evitar que el click se propague a otros manejadores que puedan interferir
        e.stopPropagation();
        checkbox.checked = !checkbox.checked;
        // Disparar el evento change para actualizar el botón eliminar
        var event = new Event('change');
        checkbox.dispatchEvent(event);
      });
    }
  });

  // Tabla de huérfanos
  document.querySelectorAll('.orphan-row').forEach(function (row) {
    var nameCell = row.querySelector('td code');
    var checkbox = row.querySelector('input.orphan-checkbox');
    if (nameCell && checkbox) {
      nameCell.style.cursor = 'pointer';
      nameCell.addEventListener('click', function (e) {
        e.stopPropagation();
        checkbox.checked = !checkbox.checked;
        var event = new Event('change');
        checkbox.dispatchEvent(event);
      });
    }
  });

  // Toggle compilation section visibility (expand/contract)
  // Toggle compilation section visibility (expand/contract)
  var toggleCompilationBtn = document.getElementById('toggle-compilation');
  var compilationContent = document.getElementById('compilation-content');
  if (toggleCompilationBtn && compilationContent) {
    toggleCompilationBtn.addEventListener('click', function () {
      // Determine current visibility: if display is 'none' it's hidden, otherwise visible
      var isHidden = compilationContent.style.display === 'none';
      // Toggle visibility
      compilationContent.style.display = isHidden ? 'block' : 'none';
      // Update button label accordingly
      this.innerHTML = isHidden ? '<i class="fas fa-chevron-up me-1"></i>Ocultar' : '<i class="fas fa-chevron-down me-1"></i>Mostrar';
    });
  }
})();
  // -----------------------------------------------------
  // Ver archivos del registro (popup) - Bootstrap 5 vanilla JS
  // -----------------------------------------------------
  document.querySelectorAll('.view-files-btn').forEach(function(btn) {
    btn.addEventListener('click', function () {
      window._currentFolderSlug = this.dataset.folder || '';
      var filesData = this.dataset.files;
      var files = [];
      if (filesData) {
        try {
          // Intentamos parsear directamente; debería ser JSON válido.
          files = JSON.parse(filesData);
        } catch (e) {
          // Si falla (por ejemplo, comillas simples), hacemos una sustitución rápida.
          try {
            var jsonStr = filesData.replace(/'/g, '"');
            files = JSON.parse(jsonStr);
          } catch (e2) {
            console.warn('Error parsing files data', e2);
            files = [];
          }
        }
      }
      // Asegurarnos de que siempre sea un array antes de usar forEach
      if (!Array.isArray(files)) {
        files = [];
      }
      var listEl = document.getElementById('filesList');
      if (!listEl) return;
      listEl.innerHTML = '';
      if (files.length === 0) {
        var li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = 'No hay archivos asociados.';
        listEl.appendChild(li);
      } else {
          files.forEach(function(f) {
            var li = document.createElement('li');
            li.className = 'list-group-item d-flex align-items-center justify-content-between';
            // Detectar si el archivo es una imagen para mostrar miniatura
            var isImage = false;
            if (f.url) {
              var ext = f.url.split('.').pop().toLowerCase();
              isImage = ['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext);
            }
            if (isImage) {
              var img = document.createElement('img');
              img.src = f.url;
              img.alt = f.filename || '';
              img.className = 'img-thumbnail me-2';
              img.style.maxWidth = '80px';
              li.appendChild(img);
            }
            var nameSpan = document.createElement('span');
            nameSpan.textContent = f.filename || f;
            nameSpan.className = 'flex-grow-1';
            li.appendChild(nameSpan);
            var viewBtn = document.createElement('button');
            viewBtn.type = 'button';
            viewBtn.className = 'btn btn-sm btn-primary ms-2';
            viewBtn.textContent = 'Ver';
            viewBtn.setAttribute('data-url', f.url || '');
            viewBtn.setAttribute('data-type', f.type || (isImage ? 'image' : 'other'));
            viewBtn.setAttribute('data-filename', f.filename || '');
            viewBtn.addEventListener('click', function () {
              var previewEl = document.getElementById('filePreview');
              var contentEl = document.getElementById('filePreviewContent');
              if (!previewEl || !contentEl) return;
              contentEl.innerHTML = '';
              var url = this.getAttribute('data-url');
              var type = this.getAttribute('data-type');
              var fname = this.getAttribute('data-filename');
              if (type === 'image') {
                var img = document.createElement('img');
                img.src = url;
                img.alt = fname;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '400px';
                img.style.borderRadius = '8px';
                img.style.boxShadow = '0 2px 12px rgba(0,0,0,.15)';
                contentEl.appendChild(img);
              } else if (type === 'video') {
                var vid = document.createElement('video');
                vid.src = url;
                vid.controls = true;
                vid.style.maxWidth = '100%';
                vid.style.maxHeight = '400px';
                vid.style.borderRadius = '8px';
                contentEl.appendChild(vid);
              } else {
                var link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.className = 'btn btn-outline-primary';
                link.textContent = 'Abrir archivo: ' + fname;
                contentEl.appendChild(link);
              }
              previewEl.style.display = 'block';
            });
            li.appendChild(viewBtn);
            var delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'btn btn-sm btn-danger ms-2';
            delBtn.textContent = '🗑️';
            delBtn.title = 'Eliminar archivo';
            delBtn.setAttribute('data-folder', '');
            delBtn.setAttribute('data-filename', f.filename || '');
            delBtn.addEventListener('click', function () {
              var folder = this.getAttribute('data-folder') || window._currentFolderSlug || '';
              var fname = this.getAttribute('data-filename');
              if (!folder || !fname) return;
              if (!confirm('¿Eliminar permanentemente "' + fname + '"?')) return;
              var self = this;
              self.disabled = true;
              self.textContent = '⏳';
              fetch(typeof DELETE_FILE_URL !== 'undefined' ? DELETE_FILE_URL : '', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': CSRF_TOKEN
                },
                body: JSON.stringify({ folder: folder, filename: fname })
              })
              .then(function(r) { return r.json(); })
              .then(function(data) {
                if (data.success) {
                  self.closest('li').remove();
                  alert('✅ ' + (data.message || 'Archivo eliminado'));
                  location.reload();
                } else {
                  alert('❌ ' + (data.message || data.error || 'Error al eliminar'));
                  self.disabled = false;
                  self.textContent = '🗑️';
                }
              })
              .catch(function(err) {
                alert('Error de red: ' + err);
                self.disabled = false;
                self.textContent = '🗑️';
              });
            });
            li.appendChild(delBtn);
            listEl.appendChild(li);
          });
      }
  // Abrir modal usando Bootstrap 4 (jQuery) API
      // Guardamos la referencia globalmente para poder cerrarla después
      window._filesModalInstance = $('#filesModal');
      window._filesModalInstance.modal('show');
    });
  });

  // Función auxiliar para cerrar modal de forma robusta
  // MÉTODO PRIMARIO: manipulación DOM directa (evita conflicto jQuery 3.2.1 + Bootstrap 5)
  function closeFilesModal() {
      if (window._filesModalInstance && typeof window._filesModalInstance.modal === 'function') {
        window._filesModalInstance.modal('hide');
      }
      window._filesModalInstance = null;
    }

  // Handler directo en el botón de cerrar del modal
  var closeBtnEl = document.getElementById('filesModalCloseBtn');
  if (closeBtnEl) {
    closeBtnEl.addEventListener('click', function (e) {
      e.preventDefault();
      closeFilesModal();
    });
  }

  // Delegación de eventos para clic fuera del modal y compatibilidad
  document.addEventListener('click', function (e) {
    if (e.target.id === 'filesModal' || e.target.classList.contains('modal')) {
      closeFilesModal();
    }
  });

  // Cerrar modal con tecla Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      var modalEl = document.getElementById('filesModal');
      if (modalEl && modalEl.classList.contains('show')) {
        closeFilesModal();
      }
    }
  });

  // ── Eliminación individual de huérfanos (botón por fila) ──
  document.querySelectorAll('.delete-single-orphan').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var folder = this.getAttribute('data-folder');
      if (!folder) return;

      if (!confirm('¿Eliminar permanentemente la carpeta huérfana "' + folder + '"?\n\nEsta acción no se puede deshacer.')) return;

      var self = this;
      self.disabled = true;
      self.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>...';

      fetch(DELETE_FILE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': CSRF_TOKEN
        },
        body: JSON.stringify({ folder: folder })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          alert('✅ ' + (data.message || 'Carpeta "' + folder + '" eliminada correctamente'));
          // Eliminar la fila de la tabla
          var row = document.getElementById('orphan-row-' + folder);
          if (row) row.remove();
          // Actualizar contador de huérfanos
          var badge = document.querySelector('.card-header.bg-danger .badge');
          if (badge) {
            var currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = Math.max(0, currentCount - 1);
          }
        } else {
          alert('❌ ' + (data.message || data.error || 'Error al eliminar la carpeta'));
          self.disabled = false;
          self.innerHTML = '<i class="fas fa-trash me-1"></i>Eliminar';
        }
      })
      .catch(function(err) {
        alert('❌ Error de red: ' + err);
        self.disabled = false;
        self.innerHTML = '<i class="fas fa-trash me-1"></i>Eliminar';
      });
    });
  });
