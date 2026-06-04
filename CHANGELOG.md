# CHANGELOG

## [Unreleased - Etapa 0] - 2026-06-04

### Added

- Documentacion base del proyecto Ramp Bites Control Panel.
- Identificacion de entidades principales.
- Diseno del modelo de datos inicial para LocalStorage.
- Definicion de reglas de stock, movimientos y trazabilidad por lote.
- Definicion de reglas de coste, rendimiento, merma, recetas y precios recomendados.
- Definicion del flujo de produccion artesanal.
- Definicion del flujo de pedidos.
- Plan de etapas de desarrollo.
- Checkpoint para continuar en Etapa 1.
- Documento tecnico `docs/ARCHITECTURE.md`.
- Documento tecnico `docs/DATA_MODEL.md`.
- Documento tecnico `docs/BUSINESS_RULES.md`.
- Documento tecnico `docs/PRODUCTION_FLOW.md`.
- Documento tecnico `docs/ROADMAP.md`.
- Documento tecnico `docs/BACKEND_PLAN.md`.
- Indice de documentacion `docs/INDEX.md`.
- Resumen de cierre `docs/ETAPA0_COMPLETED.md`.
- Skeleton conceptual en `src/main.js`, `src/storage.js`, `src/constants.js` y `src/models.js`.
- Pantalla estatica de cierre en `index.html`.
- Archivo `src/styles/theme.css` para completar los estilos enlazados.

### Changed

- Se reescribio `README.md` para corregir problemas de codificacion y dejar la Etapa 0 cerrada con alcance claro.
- Se reescribio `docs/DATA_MODEL.md` para alinearlo con el modelo de Etapa 0.
- Se reescribio `docs/BUSINESS_RULES.md` para consolidar reglas internas sin contradicciones.
- Se reescribio `docs/PRODUCTION_FLOW.md` para compactar el flujo operativo.
- Se reescribio `docs/ROADMAP.md` para dejar etapas futuras accionables.
- Se normalizaron documentos y comentarios existentes para evitar problemas de codificacion.
- Se normalizo `index.html` para evitar texto roto y enlaces a recursos ausentes.

### Not Implemented Yet

- No se implemento UI funcional.
- No se implemento persistencia real.
- No se implementaron calculos en codigo.
- No se crearon tests ejecutables.

## Politica de Versionado

Durante el desarrollo inicial se usara version `0.x`.

- `0.1.0`: skeleton funcional y almacenamiento local.
- `0.2.0`: productos, proveedores y compras.
- `0.3.0`: stock, lotes y produccion.
- `0.4.0`: recetas, simulador y pedidos basicos.
- `1.0.0`: primera version interna usable con exportacion/importacion y reportes basicos.
