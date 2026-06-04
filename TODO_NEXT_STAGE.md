# TODO NEXT STAGE

## Checkpoint Actual

Etapa cerrada: **ETAPA 0 - Analisis, planificacion y diseno tecnico**.

Fecha: 2026-06-04.

## Completado

- Se reviso el estado actual del proyecto.
- Se leyeron `README.md` y `CHANGELOG.md`.
- Se detecto que `TODO_NEXT_STAGE.md` no existia.
- Se corrigio la documentacion base para evitar problemas de codificacion visibles.
- Se identificaron entidades principales.
- Se definio el modelo de datos inicial.
- Se actualizo `docs/DATA_MODEL.md` para mantener un unico modelo coherente.
- Se definieron reglas de stock y movimientos.
- Se definieron reglas de coste obligatorias.
- Se actualizo `docs/BUSINESS_RULES.md` con reglas internas consolidadas.
- Se definio el flujo de produccion.
- Se definio el flujo de pedido.
- Se actualizo `docs/PRODUCTION_FLOW.md`.
- Se actualizo `docs/ROADMAP.md`.
- Se creo `docs/BACKEND_PLAN.md`.
- Se normalizaron `docs/INDEX.md` y `docs/ETAPA0_COMPLETED.md`.
- Se normalizo el skeleton conceptual existente en `src/`.
- Se normalizo `index.html` como pantalla estatica de Etapa 0.
- Se creo `src/styles/theme.css` para completar los estilos enlazados.
- Se preparo una arquitectura modular para LocalStorage con migracion futura.

## Archivos Modificados

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/BUSINESS_RULES.md`
- `docs/PRODUCTION_FLOW.md`
- `docs/ROADMAP.md`
- `docs/BACKEND_PLAN.md`
- `docs/INDEX.md`
- `docs/ETAPA0_COMPLETED.md`
- `index.html`
- `src/main.js`
- `src/storage.js`
- `src/constants.js`
- `src/models.js`
- `src/styles/theme.css`

## Etapa Siguiente

**ETAPA 1 - Infraestructura base**

Implementar solo:

- `package.json` si se decide usar Vite.
- Revisar y evolucionar `index.html`.
- Estructura `/src`.
- `src/main.js`.
- `src/storage.js`.
- `src/constants.js`.
- `src/models.js`.
- `src/seed.js`.
- `src/router.js`.
- Revisar y completar estilos base en `/src/styles`.
- Layout responsive inicial tipo panel administrativo.
- Navegacion entre modulos con vistas placeholder.
- Inicializacion de datos seed editables en LocalStorage.
- Utilidad de reset de datos local.
- Primer dashboard basico con resumen de datos seed.

## Criterios de Aceptacion de Etapa 1

- La app abre localmente sin errores de consola.
- La UI esta en espanol.
- Hay navegacion visible entre modulos principales.
- LocalStorage guarda un objeto versionado.
- Los datos seed reales iniciales quedan cargados una sola vez.
- Existe separacion entre almacenamiento, constantes, modelos, router y vistas.
- No se implementa aun la logica completa de compras, produccion o pedidos.

## Proximos Pasos Exactos

1. Leer `README.md`, `CHANGELOG.md` y este archivo.
2. Crear estructura de carpetas.
3. Decidir si Etapa 1 usara Vite o HTML directo con modulos ES.
4. Crear shell visual de la app.
5. Crear adaptador de LocalStorage.
6. Crear seed inicial con los datos reales catalogados.
7. Renderizar dashboard y placeholders de modulos.
8. Probar en navegador y revisar consola.
9. Actualizar `README.md`, `CHANGELOG.md` y `TODO_NEXT_STAGE.md`.

## Riesgos o Bugs Pendientes

- Hay que validar con cuidado fechas reales de coccion/caducidad cuando se implementen lotes.
- Produccion real 2 esta incompleta; debe quedar como `pendiente` hasta que se cargue peso final.
- El stock crudo teorico deja solo 14 g; cualquier redondeo debe conservar trazabilidad.
- No conviene calcular stock desde campos editables; debe derivarse de movimientos.
- Ternera debe existir como standby/premium, no como base activa.
