# QA Checklist

Checklist manual para validar Ramp Bites Control Panel antes de usarlo con datos reales.

## Arranque

- Ejecutar `npm.cmd test`.
- Ejecutar `npm.cmd run dev`.
- Abrir `http://localhost:5173`.
- Confirmar que no hay errores visibles de carga.
- Confirmar que la navegacion cambia de vista.

## Productos

- Crear producto.
- Editar producto.
- Desactivar producto.
- Filtrar por categoria, ubicacion y activo/inactivo.
- Confirmar que producto sin nombre no se guarda.

## Proveedores

- Crear proveedor.
- Editar proveedor.
- Desactivar proveedor.
- Ver compras asociadas.

## Compras y Stock

- Registrar compra con varios items.
- Confirmar que stock aumenta.
- Confirmar que coste unitario actual se actualiza.
- Revisar historial de precios.
- Registrar merma/consumo propio/regalo.
- Intentar salida mayor que stock disponible y confirmar error.

## Produccion

- Crear tanda con lote crudo.
- Registrar peso final y coste.
- Confirmar lote cocido creado.
- Confirmar consumo de carne cruda.
- Completar produccion pendiente.
- Intentar usar lote de otro producto y confirmar error.

## Lotes y Caducidad

- Revisar lotes activos.
- Revisar vencidos/por vencer/sin fecha.
- Descartar lote y confirmar movimiento trazable.

## Recetas y Simulador

- Crear receta.
- Editar receta.
- Duplicar receta.
- Activar/prueba/standby/retirar.
- Simular unidades.
- Seleccionar extra.
- Quitar ingrediente.
- Revisar ingrediente limitante.
- Confirmar alerta de precio.

## Clientes y Pedidos

- Crear cliente.
- Editar cliente.
- Crear pedido completo.
- Crear pedido rapido.
- Agregar extras y quitar ingredientes.
- Cambiar estados.
- Confirmar pedido y comprobar movimiento `reserva`.
- Cancelar pedido confirmado y comprobar movimiento `liberacion_reserva`.
- Marcar pagado.
- Entregar pedido y confirmar conversion de reserva en `venta`.
- Intentar entregar sin stock y confirmar error.
- Registrar feedback.

## Reportes y Backups

- Revisar dashboard avanzado.
- Revisar reportes de produccion, ventas, precios y costes.
- Exportar JSON.
- Crear backup manual.
- Exportar CSV.
- Importar JSON valido.
- Intentar importar JSON invalido y confirmar error claro.
- Restaurar backup.
- Reset demo con confirmacion.

## Responsive y Accesibilidad

- Probar vista estrecha tipo movil.
- Confirmar que tablas tienen scroll horizontal si hace falta.
- Navegar con teclado por menu y formularios.
- Usar enlace "Saltar al contenido".
- Confirmar foco visible.
- Confirmar mensajes de error visibles.

## Riesgos Aceptados en MVP

- No hay control de concurrencia multiusuario para reservas.
- LocalStorage puede borrarse desde el navegador.
- Backup restaurable vive en el mismo navegador.
- No sustituye cumplimiento legal alimentario.
