# QA Checklist

Checklist manual para validar Ramp Bites Control Panel antes de usarlo con datos reales.

## Arranque

- Ejecutar `npm.cmd test`.
- Ejecutar `npm.cmd run dev`.
- Abrir `http://localhost:5173`.
- Confirmar que no hay errores visibles de carga.
- Confirmar que la navegacion cambia de vista.

## Migracion React/Dexie

- Confirmar que la nueva etapa usa React + TypeScript + Vite.
- Confirmar que la persistencia principal esta en IndexedDB mediante Dexie.
- Confirmar que LocalStorage solo guarda preferencias simples, configuracion visual, ultimo backup temporal, flags de UI y modo demo.
- Confirmar que los formularios principales validan con Zod antes de guardar.
- Confirmar que los calculos corren con Vitest.
- Confirmar que export/import JSON funciona desde Dexie.
- Confirmar que el seed inicial es reproducible.

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
- Confirmar que Stock muestra fisico, reservado y disponible.

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
- Confirmar que Lotes muestra fisico, reservado y disponible.
- Intentar descartar un lote reservado y confirmar error claro.

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
- Confirmar que Stock disponible baja y Stock fisico se mantiene al reservar.
- Cancelar pedido confirmado y comprobar movimiento `liberacion_reserva`.
- Confirmar que la reserva desaparece al cancelar.
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

## Backend y Auth

- Arrancar `npm.cmd run backend`.
- En Configuracion, comprobar API.
- Comprobar estado de autenticacion backend.
- Crear primer admin con contrasena de al menos 6 caracteres.
- Cerrar sesion backend y confirmar que acciones protegidas fallan sin login.
- Iniciar sesion backend con admin.
- Crear usuario `viewer` y confirmar que puede leer pero no crear datos.
- Crear usuario `operator` y confirmar que puede crear clientes/pedidos pero no ejecutar seed/import.
- Confirmar que no se puede desactivar el ultimo admin activo.
- Ejecutar `Sync colecciones` con admin y confirmar resumen de subidos, traidos y conflictos.
- Confirmar que un usuario `operator` no puede llamar a sync por coleccion en backend protegido.
- Si se usa `api_mirror`, confirmar que hay sesion backend antes de sincronizar.

## Responsive y Accesibilidad

- Probar vista estrecha tipo movil.
- Confirmar que tablas tienen scroll horizontal si hace falta.
- Navegar con teclado por menu y formularios.
- Usar enlace "Saltar al contenido".
- Confirmar foco visible.
- Confirmar mensajes de error visibles.

## Riesgos Aceptados en MVP

- No hay control de concurrencia multiusuario para reservas.
- Hay roles backend y conflictos basicos local-first, pero aun no hay resolucion manual multiusuario.
- La sync por coleccion aun no propaga borrados.
- LocalStorage puede borrarse desde el navegador.
- Backup restaurable vive en el mismo navegador.
- No sustituye cumplimiento legal alimentario.
