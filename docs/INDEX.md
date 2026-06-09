# Documentation Index

Indice de documentacion para Ramp Bites Control Panel.

## Leer Antes de Cada Etapa

1. `README.md`
2. `CHANGELOG.md`
3. `TODO_NEXT_STAGE.md`

## Documentos Tecnicos

- `docs/ARCHITECTURE.md`: capas actuales, persistencia y estrategia tecnica.
- `docs/DATA_MODEL.md`: entidades y colecciones.
- `docs/BUSINESS_RULES.md`: reglas internas de stock, coste, produccion y pedidos.
- `docs/PRODUCTION_FLOW.md`: flujos operativos.
- `docs/BACKEND_PLAN.md`: ruta futura a Node.js, Express, Prisma, SQLite y PostgreSQL.
- `docs/TECH_STACK_MIGRATION.md`: decision de migracion a React, TypeScript, Vite, Dexie, Zod y Vitest.
- `docs/PROMPTS_2_9_GLOBAL_RULES.md`: reglas obligatorias para prompts posteriores al arranque React/Dexie.
- `docs/ROADMAP.md`: MVP local y crecimiento futuro.
- `docs/QA_CHECKLIST.md`: checklist manual de QA.
- `docs/ETAPA0_COMPLETED.md`: resumen historico de cierre de Etapa 0.

## Estado

Etapas 0 a 16 cerradas. El MVP local esta funcional, probado, instalable como PWA, con backend SQLite local, sincronizacion manual desde Configuracion, sync por coleccion con conflictos basicos, modo API espejo opcional, seguridad local para operaciones sensibles, reservas de stock al confirmar pedidos, control de stock fisico/reservado/disponible y autenticacion backend con roles.

Decision vigente para la siguiente etapa: migrar la base tecnica a React + TypeScript + Vite + Dexie/IndexedDB + Zod + Vitest. LocalStorage no debe seguir siendo la base de datos principal.

Siguiente etapa recomendada: Etapa 17, migracion tecnologica base a React + TypeScript + Vite + Dexie.

No avanzar a nuevas mejoras salvo que se solicite explicitamente.
