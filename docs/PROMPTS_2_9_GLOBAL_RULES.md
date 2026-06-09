# Prompts 2 a 9 - Instruccion Global

Esta instruccion aplica a todos los prompts posteriores del proyecto Ramp Bites Control Panel, desde Prompt 2 hasta Prompt 9.

## Stack Obligatorio

Todas las etapas deben continuar usando:

- React.
- TypeScript.
- Vite.
- Dexie.js / IndexedDB.
- Zod.
- Vitest.

No volver a HTML/CSS/JavaScript puro como arquitectura principal.

No usar LocalStorage como almacenamiento principal. Usar Dexie/IndexedDB para los datos importantes.

## Arquitectura Obligatoria

Cada nueva funcionalidad debe respetar esta separacion:

```txt
/types       -> tipos TypeScript
/schemas     -> validaciones Zod
/services    -> logica de negocio y acceso a datos
/pages       -> pantallas
/components  -> componentes reutilizables
/utils       -> calculos, fechas, formatos, IDs
/db          -> Dexie, seed y migraciones
/test        -> pruebas
/docs        -> documentacion
```

## Reglas Para Cada Etapa

1. Crear o actualizar tipos TypeScript.
2. Crear o actualizar schemas Zod.
3. Crear o actualizar servicios.
4. Crear o actualizar pagina correspondiente.
5. Guardar y leer datos desde Dexie.
6. No duplicar logica de calculo en componentes.
7. Mantener calculos en `src/utils/calculations.ts`.
8. Agregar tests si la etapa toca calculos, stock, recetas, pedidos o produccion.
9. Actualizar documentacion.
10. No avanzar a la siguiente etapa.

## Reglas de Datos

Toda entidad debe tener:

```ts
id: string;
createdAt: string;
updatedAt: string;
```

Cuando aplique:

```ts
active: boolean;
notes?: string;
```

Usar borrado logico por defecto. No borrar definitivamente salvo confirmacion explicita del usuario.

## Validaciones Obligatorias

Validar con Zod antes de guardar:

- productos,
- proveedores,
- compras,
- producciones,
- recetas,
- clientes,
- pedidos,
- ajustes de stock.

Validar:

- cantidades positivas,
- precios no negativos,
- unidades validas,
- fechas validas,
- estados validos,
- referencias existentes,
- stock suficiente cuando corresponda.

## Reglas de Stock

Todo cambio de stock debe generar un `StockMovement`.

No modificar stock directamente sin movimiento asociado.

Tipos de movimiento:

- compra
- produccion_consumo
- produccion_resultado
- saborizacion_consumo
- saborizacion_resultado
- venta
- ajuste
- merma
- consumo_propio
- regalo
- vencimiento
- devolucion

## Reglas de Produccion

Toda produccion debe:

- consumir stock crudo,
- consumir insumos usados,
- crear lote final,
- crear stock cocido,
- calcular rendimiento,
- calcular merma,
- calcular coste por gramo,
- calcular coste por 100 g,
- guardar ubicacion: nevera / congelador,
- guardar fecha limite de uso.

## Reglas de Recetas y Pedidos

Toda receta debe calcular:

- coste total,
- coste por grupo,
- precio minimo,
- precio sano,
- precio premium,
- margen a precio actual,
- alergenos.

Todo pedido debe calcular:

- subtotal,
- coste estimado,
- ganancia estimada,
- estado,
- pago,
- stock necesario,
- faltantes.

## Tests Obligatorios

Mantener o crear tests para:

- coste unitario,
- precio por kg,
- rendimiento,
- merma,
- coste por 100 g,
- coste de receta,
- burritos posibles,
- ingrediente limitante,
- precio sugerido,
- coste de pedido,
- movimientos de stock.

## Documentacion Obligatoria

Al terminar cada etapa, actualizar:

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`

Si se modifica arquitectura, actualizar:

- `docs/ARCHITECTURE.md`
- `docs/BACKEND_PLAN.md`
- `docs/ROADMAP.md`
