# Business Rules

Reglas internas de negocio para Ramp Bites Control Panel.

La app ayuda a organizar produccion, stock, costes y pedidos. No certifica ni afirma cumplimiento legal alimentario.

## Lineas de Producto

- Cerdo: linea principal activa.
- Pollo: segunda linea activa.
- Ternera: standby/premium por coste alto.

La ternera no debe aparecer como producto base activo por defecto.

## Stock

El stock debe derivarse de movimientos trazables por lote.

La app distingue:

- `stock_fisico`: inventario real antes de reservas; ignora movimientos `reserva` y `liberacion_reserva`.
- `stock_reservado`: reserva neta activa de pedidos confirmados, en produccion o listos.
- `stock_disponible`: fisico menos reservado; se usa para simular, producir, vender, ajustar o descartar.

Las alertas de stock bajo usan `stock_disponible`. El valor estimado de inventario usa `stock_fisico`.

Tipos de stock:

- `raw`: carne cruda.
- `cooked_neutral`: carne cocida neutra.
- `flavored`: carne saborizada.
- `frozen`: producto congelado.
- `refrigerated`: producto refrigerado.
- `dry`: insumos secos.
- `packaging`: bolsas, envases y otros materiales.

Reglas:

- Cada compra crea entrada de stock y lote.
- Cada tanda consume lote crudo o insumos mediante movimientos.
- Cada tanda completada crea lote cocido neutro.
- Una tanda pendiente no crea stock vendible.
- Cada saborizado debe enlazar lote neutro origen y lote saborizado destino.
- Merma, descarte, consumo propio, regalo y prueba se registran como movimientos separados.
- Los ajustes manuales deben requerir motivo.
- No se debe borrar trazabilidad historica al corregir stock.
- No se debe descartar un lote con reserva activa.

## Produccion

Flujo base:

1. Comprar carne cruda.
2. Registrar corte, peso, precio, proveedor y fecha.
3. Cocinar con agua, caldo y pimienta.
4. Retirar carne.
5. Desmechar.
6. Pesar escurrida si aplica.
7. Reducir caldo.
8. Reintegrar caldo.
9. Pesar carne final hidratada.
10. Guardar como base neutra.
11. Separar por sabores segun pedidos.
12. Guardar sobrante como neutro cuando sea posible.

Reglas:

- No producir mas carne de la proyectada para 2 dias.
- La carne base actual usa 100 g por burrito.
- Produccion real 2 debe seguir como pendiente hasta cargar peso final.
- El sistema debe registrar fecha de coccion y fecha limite de uso.
- El sistema debe alertar productos proximos a vencer.

## Sabores

Sabores iniciales:

- BBQ.
- Mostaza-miel.
- Picante.
- Yogur/cremoso.

La carne saborizada se debe producir preferentemente bajo demanda o prevision cercana.

## Costes

Formulas obligatorias:

```txt
precio_unitario = precio_total / cantidad
precio_kg = precio_total / cantidad_kg
rendimiento = peso_final / peso_crudo
merma = peso_crudo - peso_final
merma_porcentaje = merma / peso_crudo
coste_por_gramo_final = coste_total_produccion / peso_final
coste_100g = coste_por_gramo_final * 100
```

Coste de receta:

```txt
coste_receta = suma de coste de cada ingrediente segun unidad
```

Para gramos:

```txt
coste = gramos * coste_por_gramo
```

Para mililitros:

```txt
coste = ml * coste_por_ml
```

Para unidades:

```txt
coste = unidades * coste_unitario
```

## Precios y Margenes

Multiplicadores configurables iniciales:

- Minimo: coste total x 2.
- Sano: coste total x 2.5.
- Premium: coste total x 3.

La app debe indicar si vender a 5 EUR es viable o no para cada receta. No debe asumir 5 EUR como precio universal.

## Burritos Posibles

Para cada ingrediente:

```txt
posibles_por_ingrediente = floor(stock_disponible / cantidad_requerida)
```

Resultado:

```txt
burritos_posibles = minimo de todos los posibles_por_ingrediente
ingrediente_limitante = ingrediente con menor cantidad posible
```

## Pedidos

Flujo base:

1. Registrar cliente.
2. Crear pedido.
3. Seleccionar recetas y cantidades.
4. Calcular coste real.
5. Evaluar precio recomendado y viabilidad.
6. Comprobar stock.
7. Mostrar ingrediente limitante.
8. Reservar stock cuando el pedido se confirme.
9. Descontar stock cuando el pedido se entregue.
10. Generar necesidades de compra o produccion si falta stock.

Estados sugeridos:

- `draft`
- `confirmed`
- `in_production`
- `ready`
- `delivered`
- `cancelled`

## Caducidad y Conservacion

El sistema debe registrar:

- Fecha de compra.
- Fecha de coccion.
- Fecha limite de uso.
- Estado de conservacion: refrigerado, congelado, seco o ambiente.
- Estado de lote: activo, reservado, consumido, vencido o descartado.

Las duraciones por defecto deben ser configurables. La app puede alertar, pero no debe sustituir criterio sanitario profesional.

## Alergenos

Alergenos iniciales:

- Gluten.
- Lactosa.
- Huevo.
- Soja.
- Frutos secos.
- Sesamo.
- Mostaza.
- Apio.
- Sulfitos.

Productos y recetas pueden tener alergenos asociados.

## Datos Reales Iniciales

La compra real de cuello de cerdo sin hueso debe crear:

- Entrada de 2385 g.
- Coste total de 26.21 EUR.
- Precio/kg de 10.99 EUR/kg.
- Proveedor `Carniceria local 1`.

Produccion real 1:

- Consume 1053 g.
- Genera 800 g finales.
- Rendimiento aproximado de 75.9%.
- Resultado: cerdo desmechado neutro.

Produccion real 2:

- Consume 1318 g.
- Usa 2 caldos secos de carne por 1.70 EUR.
- Queda pendiente hasta cargar resultado final.

Stock crudo teorico:

```txt
2385 g - 1053 g - 1318 g = 14 g
```

Ese resultado debe salir de movimientos, no de un numero escrito a mano.
