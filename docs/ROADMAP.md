# Roadmap

Plan por etapas para construir Ramp Bites Control Panel sin romper continuidad.

## Etapa 0 - Analisis y Planificacion

Estado: completada.

Entregables:

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/BUSINESS_RULES.md`
- `docs/PRODUCTION_FLOW.md`
- `docs/ROADMAP.md`
- `docs/BACKEND_PLAN.md`

## Etapa 1 - Infraestructura Base

Objetivo: crear una app local-first minima, navegable y sin logica compleja.

Alcance:

- `index.html`.
- `package.json` si se usa Vite.
- Estructura `/src`.
- Router simple.
- Storage adapter para LocalStorage.
- Seed inicial versionado.
- Layout administrativo responsive.
- Vistas placeholder.
- Dashboard basico con resumen seed.

No incluir todavia CRUD completo ni calculos avanzados.

## Etapa 2 - Productos, Proveedores y Compras

Objetivo: registrar catalogo inicial y compras.

Alcance:

- CRUD de productos.
- CRUD de proveedores.
- Registro de compras.
- Lineas de compra.
- Calculo de precio unitario y precio/kg.
- Creacion inicial de lotes y movimientos por compra.

## Etapa 3 - Stock, Lotes y Movimientos

Objetivo: hacer visible la trazabilidad.

Alcance:

- Vista de lotes.
- Vista de movimientos.
- Stock disponible derivado.
- Filtros por producto, tipo, estado y conservacion.
- Registro de descarte, merma, consumo propio, regalo, prueba y ajuste.

## Etapa 4 - Produccion por Tandas

Objetivo: registrar produccion real de carne.

Alcance:

- Crear y completar tandas.
- Consumir stock crudo e insumos.
- Registrar peso final.
- Calcular rendimiento, merma, coste por gramo final y coste por 100 g.
- Crear lotes cocidos neutros.
- Mantener producciones pendientes sin stock vendible.

## Etapa 5 - Recetas y Costes

Objetivo: calcular coste real por burrito.

Alcance:

- CRUD de recetas.
- Ingredientes por gramos, ml y unidades.
- Coste receta.
- Precio recomendado configurable.
- Evaluacion de viabilidad de venta a 5 EUR.
- Alergenos por receta.

## Etapa 6 - Simulador y Lista de Compra

Objetivo: saber cuantos burritos se pueden producir.

Alcance:

- Burritos posibles por receta.
- Ingrediente limitante.
- Necesidades de compra.
- Necesidades de produccion.
- Alerta de sobreproduccion para mas de 2 dias.

## Etapa 7 - Clientes y Pedidos

Objetivo: gestionar pedidos reales.

Alcance:

- CRUD de clientes.
- Crear pedidos.
- Lineas de pedido.
- Estados de pedido.
- Reserva de stock.
- Salida de stock al entregar.

## Etapa 8 - Caducidad, Conservacion y Alergenos

Objetivo: ordenar seguridad operativa interna.

Alcance:

- Alertas de vencimiento.
- Filtros por refrigerado, congelado, seco y packaging.
- Alergenos en productos y recetas.
- Avisos claros sin afirmar cumplimiento legal.

## Etapa 9 - Reportes y Feedback

Objetivo: mejorar decisiones de negocio.

Alcance:

- Margenes por receta.
- Rendimiento por tanda.
- Merma historica.
- Compras por proveedor.
- Precio historico.
- Feedback de clientes.

## Etapa 10 - Exportacion, Importacion y Backups

Objetivo: proteger datos locales.

Alcance:

- Exportar JSON.
- Importar JSON validado.
- Backup con metadata.
- Reset controlado de datos.
- Validacion de schema.

## Etapa 11+ - Backend Futuro

Objetivo: evolucionar a multiusuario o almacenamiento mas robusto.

Opciones:

- IndexedDB local.
- SQLite local.
- Backend Node.js.
- Autenticacion.
- API REST o RPC simple.
- Sincronizacion y auditoria.
