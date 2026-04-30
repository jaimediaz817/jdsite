# 🧪 ESCENARIOS DE PRUEBA - HU-005.4
## Sistema de Reacciones a Comentarios del Blog

> Fecha: 29/04/2026
> HU Asociada: HU-005.4
> Versión: 1.0

---

## 🎯 OBJETIVO
Documentar todos los escenarios posibles, casos borde y comportamiento esperado para el sistema de reacciones a comentarios.

---

## 🔴 CASO CRITICO 1: Blog / Comentario eliminado

### ✅ COMPORTAMIENTO ESPERADO ✅
| Acción                                                             | Resultado                                          |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| Un usuario reacciona a un comentario                               | Se guarda correctamente                            |
| El comentario es eliminado permanentemente de la base de datos     | ✅ **NADA PASA**                                    |
| El usuario vuelve a la pagina                                      | ✅ El sistema continua funcionando sin ningun error |
| Se intenta acceder directamente al endpoint del comentario borrado | ✅ Devuelve counts = {}, no hay error 500           |
| Se intenta reaccionar nuevamente a ese comentario                  | ✅ Se guarda la reaccion igual                      |

### ✅ JUSTIFICACION ARQUITECTONICA
✅ El sistema de reacciones **NO TIENE NINGUNA FOREIGN KEY** ni dependencia con el modelo BlogComment.
✅ Solo almacena un numero entero `comment_id`.
✅ Funciona completamente aunque el comentario, el articulo o incluso la app blog dejen de existir.
✅ Nunca habra error de integridad referencial, nunca habra ON DELETE CASCADE.
✅ Este es el comportamiento diseñado y aprobado en el diagnostico de arquitectura.

---

## 📋 LISTADO COMPLETO DE ESCENARIOS

| ID  | Escenario                                                 | Estado      | Comportamiento Esperado                      |
| --- | --------------------------------------------------------- | ----------- | -------------------------------------------- |
| 1   | Usuario reacciona a comentario principal                  | ✅ OK        | Se guarda, contador aumenta                  |
| 2   | Usuario reacciona a respuesta anidada                     | ✅ OK        | Funciona exactamente igual                   |
| 3   | Usuario desactiva la misma reaccion                       | ✅ OK        | Se borra, contador disminuye                 |
| 4   | Usuario cambia de reaccion en el mismo comentario         | ✅ OK        | Se borra la anterior, se activa la nueva     |
| 5   | Refresco de pagina                                        | ✅ OK        | Las reacciones y contadores se mantienen     |
| 6   | Multiples clicks rapidos en la misma reaccion             | ✅ OK        | Debounce 300ms, solo se envia 1 peticion     |
| 7   | Fallo de red / servidor caido                             | ✅ OK        | Optimistic UI se revierte silenciosamente    |
| 8   | Usuario tiene Javascript desactivado                      | ⏳ PENDIENTE | Se guarda mediante POST normal               |
| 9   | Comentario pasa a estado moderado / pendiente             | ✅ OK        | Las reacciones se mantienen                  |
| 10  | Comentario es eliminado permanentemente                   | ✅ OK        | Ningun error, sistema continua funcionando   |
| 11  | Articulo completo es eliminado                            | ✅ OK        | Ningun error                                 |
| 12  | Mismo usuario desde misma IP en dos navegadores distintos | ✅ OK        | Se respeta la regla 1 reaccion por IP        |
| 13  | Crawler / Robot intenta reaccionar                        | ✅ OK        | Middleware RateLimit bloquea automaticamente |
| 14  | 1000 usuarios diferentes reaccionan al mismo comentario   | ✅ OK        | Sistema escala, ningun problema              |

---

## ⚠️ CASOS QUE NO PASAN Y NO SE VAN A ARREGLAR
| Escenario            | Comportamiento               | Justificacion                                                                                                                              |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Usuario cambia de IP | Se puede volver a reaccionar | Es el comportamiento diseñado. No existe forma fiable de identificar usuarios sin registro. Es el balance aceptado entre friccion y abuso. |

---

## ✅ CONCLUSION
✅ El sistema esta diseñado especificamente para fallar de forma silenciosa y gracefully.
✅ Nada se rompe nunca, nada tira error 500.
✅ Todo continua funcionando aunque todo lo demas de alrededor se borre, rompa o desaparezca.