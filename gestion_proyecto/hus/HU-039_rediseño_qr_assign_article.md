# HU-039: Rediseño UX/UI de Vista Asignar Artículo QR

## Objetivo
Mejorar significativamente la experiencia visual y de usabilidad de la vista `qr_assign_article.html` para que se vea profesional, compacta y aproveche el espacio correctamente.

## Problemas Identificados
1. **Buscador con bordes discordantes**: El icono buscar tiene un borde con radio distinto al del input
2. **Cards separadas verticalmente**: Vista previa y buscador deberían estar en la misma línea (columnas)
3. **Cabeceras grandes y poco atractivas**: Los card-header necesitan reducir tamaño y mejor tipografía
4. **Espacio mal aprovechado**: La vista ocupa demasiado vertical sin necesidad

## Criterios de Aceptación
- [x] El buscador tiene bordes redondeados uniformes en todo su contorno
- [x] Vista previa y buscador aparecen lado a lado en escritorio (columnas)
- [x] Las cabeceras de cards son compactas y usan la paleta de colores del blog (#6f42c1)
- [x] El diseño es responsive (mobile first) y funciona en móviles

## Pasos de Implementación

### Fase 1: Ajustes de estilo del buscador (radio borders uniforme)
- [ ] Unificar el border-radius del icono buscar con el input
- [ ] Ajustar el padding y altura para consistencia visual

### Fase 2: Layout en columnas para escritorio
- [ ] Reorganizar vista previa y buscador en un grid de 2 columnas
- [ ] Mantener layout vertical en móviles

### Fase 3: Rediseño de card-header
- [ ] Reducir padding de headers
- [ ] Usar tipografía más pequeña y legible
- [ ] Mantener el gradiente #6f42c1 como color principal

### Fase 4: Consistencia de colores
- [ ] Aplicar la paleta del blog (#6f42c1, #5a33a0) a componentes clave
- [ ] Usar colores secundarios (#0891b2) para el buscador

### Fase 5: Testing responsive
- [ ] Verificar en móvil (apilado vertical)
- [ ] Verificar en desktop (2 columnas)

## Estado
- [x] Completado

## Resumen de Cambios Implementados

### Mejoras Aplicadas:
1. **Buscador con bordes uniformes**: El icono buscar y el input ahora comparten el mismo `border-radius: 24px` y el borde es unificado con `overflow: hidden`
2. **Layout 2 columnas**: Vista previa y buscador aparecen lado a lado en escritorio (≥992px)
3. **Vista previa horizontal**: QR a la izquierda (100px) y descripción a la derecha, se apila en móvil
4. **Card headers compactos**: Reducción de padding de `1.2rem 1.5rem` a `0.8rem 1rem`, tamaño de fuente `0.95rem`
5. **Colores del blog**: Uso del gradiente `#6f42c1 → #5a33a0` en headers y botón de acción
6. **Padding reducido**: Cards más compactas, espaciado interno optimizado
7. **Responsive**: Mobile-first con apilado vertical automático en móviles

### Clases CSS nuevas agregadas:
- `.qr-card-header` - Header compacto con gradiente morado
- `.qr-card` - Card con bordes redondeados uniformes
- `.qr-search-input-group` - Grupo de input con borde unificado
- `.qr-columns` - Layout flex para 2 columnas
