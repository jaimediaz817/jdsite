# 🏗️ ARQUITECTURA: Sistema de Reacciones como Componente Independiente
> Decision de diseño aprobada 27/04/2026
> Cero acoplamiento, 100% portable, backup friendly

---

## ✅ DECISION FINAL DE ARQUITECTURA
**NO PONDREMOS ESTE CODIGO DENTRO DE LA APP `blog`**

✅ **Crearemos una app Django NUEVA E INDEPENDIENTE llamada `reactions`**
✅ **CERO DEPENDENCIAS CON NINGUNA OTRA APP DEL PROYECTO**
✅ **NUNCA HABRA NINGUN FOREIGN KEY HACIA NINGUN OTRO MODELO**

---

## 🎯 POR QUÉ ESTA ARQUITECTURA
✅ **Nunca te cargaras las reacciones al actualizar, importar o modificar blogs**
✅ **Puedes borrar toda la app blog, reinstalarla, importar todo de nuevo y las reacciones se quedan intactas**
✅ **Puedes hacer backup SOLAMENTE de la tabla de reacciones sin tocar nada mas**
✅ **Puedes mover este sistema a cualquier otro proyecto en 5 minutos**
✅ **Puedes borrar, crear, renombrar blogs y las reacciones siguen funcionando**
✅ **Si algun dia cambias todo el sistema de blogs, no tienes que tocar nada de reacciones**

---

## 🧱 ESTRUCTURA DE LA APP
```
backend/
└── reactions/                ✅ NUEVA APP COMPLETAMENTE SEPARADA
    ├── __init__.py
    ├── models.py             ✅ Solo el modelo BlogReaction, NADA MAS
    ├── services.py           ✅ Toda la logica de negocio
    ├── views.py              ✅ Endpoints API
    ├── urls.py               ✅ Rutas propias
    ├── middleware.py         ✅ Rate limit y deteccion robots
    ├── admin.py
    └── migrations/

✅ La app blog NO SABE NADA de la app reactions
✅ La app reactions NO SABE NADA de la app blog
✅ Solo se comunican por `slug` como unico identificador de texto
✅ No hay ninguna importacion cruzada
```

---

## 🔒 REGLA DE ORO INQUEBRANTABLE
> 🔴 EL UNICO PUNTO DE CONTACTO ENTRE AMBAS ES UN STRING: EL SLUG

Nada mas. Ninguna otra relacion, ninguna otra dependencia, ningun otro enlace.

Si tu borras un blog, las reacciones se quedan. Si tu creas el mismo blog nuevamente con el mismo slug, las reacciones aparecen automaticamente. Si tu cambias el slug de un blog, pierdes las reacciones (comportamiento deseado e intencional).

---

## ✅ VENTAJAS PARA PRODUCCION DIGITAL OCEAN
1. ✅ Puedes deployar la funcionalidad de reacciones sin tocar absolutamente nada del blog existente
2. ✅ Si algo sale mal, solo desactivas esta app y todo sigue funcionando igual
3. ✅ Backup independiente: `pg_dump --table=reactions_blogreaction`
4. ✅ Puedes mover esta tabla a otra base de datos por separado cuando haya mucho trafico
5. ✅ Cero riesgo al desplegar. Si no funciona, borras la app y no pasa nada.
6. ✅ Puedes activar y desactivar la funcionalidad con una sola linea en INSTALLED_APPS

---

## ❌ COSAS QUE NUNCA HAREMOS
- ❌ Nunca ForeignKey a Blog
- ❌ Nunca importaremos nada de blog dentro de reactions
- ❌ Nunca modificaremos ningun archivo dentro de la app blog
- ❌ Nunca agregaremos campos ni logica al modelo Blog
- ❌ Nunca habra ninguna dependencia en ningun sentido

---

> ✅ Esta es la arquitectura mas limpia, segura y mantenible posible para esta funcionalidad. Cumpliendo esto nunca tendras problemas al llevarlo a produccion, nunca perderas datos, nunca te cargaras nada al actualizar el resto del sistema.