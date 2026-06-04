# Production Flow

Flujos operativos previstos para Ramp Bites Control Panel.

## Compra

1. Identificar necesidad de compra por stock bajo, pedidos confirmados o produccion prevista.
2. Seleccionar producto y proveedor.
3. Registrar cantidad comprada, unidad, precio total, fecha y notas.
4. Calcular precio unitario y precio/kg si aplica.
5. Crear lote de stock.
6. Crear movimiento `purchase`.

Ejemplo real inicial:

```txt
Producto: cuello de cerdo sin hueso / coll sense os
Cantidad: 2385 g
Precio total: 26.21 EUR
Precio/kg: 10.99 EUR/kg
Proveedor: carniceria local 1
```

## Produccion de Carne Neutra

1. Crear tanda con estado `draft` o `pending`.
2. Seleccionar lote crudo origen.
3. Registrar peso crudo usado.
4. Registrar liquidos, caldos, condimentos base y coste de insumos.
5. Registrar hora de inicio, hora fin, duracion y fuego.
6. Registrar peso escurrido si existe.
7. Registrar caldo sobrante y caldo reintegrado.
8. Registrar peso final hidratado.
9. Calcular rendimiento, merma y costes.
10. Crear movimiento `production_consume` para cada input.
11. Crear lote cocido neutro.
12. Crear movimiento `production_output`.
13. Cambiar tanda a `completed`.

Regla clave: una tanda pendiente no crea stock vendible.

## Produccion Real 1

```txt
Carne usada: 1053 g
Coste carne aproximado: 11.57 EUR
Liquido inicial: 534 ml
Caldo total usado: 550 ml aprox.
Caldo sobrante: 450 ml aprox.
Coccion: 21:00 a 00:30
Duracion: 3 h 30 min
Fuego: bajo
Peso hidratado final: 750 g
Peso final con caldo reintegrado: 800 g
Rendimiento aprox.: 75.9%
Resultado: cerdo desmechado neutro
Estado: completada
```

## Produccion Real 2

```txt
Carne usada: 1318 g
Coste carne aproximado: 14.49 EUR
Inicio coccion: 18:00
Insumos iniciales: 2 caldos secos de carne
Coste caldos: 1.70 EUR
Caldo liquido restante agregado posteriormente
Resultado: pendiente de cargar
Estado: pendiente
```

Esta tanda debe consumir stock crudo, pero no debe generar lote final hasta que se registre peso final.

## Saborizado

1. Seleccionar lote cocido neutro.
2. Elegir sabor: BBQ, mostaza-miel, picante o yogur/cremoso.
3. Registrar cantidad de carne neutra usada.
4. Registrar ingredientes de sabor y costes.
5. Crear movimiento `flavoring` de salida del lote neutro.
6. Crear lote saborizado destino.

Regla: saborizar preferentemente segun pedidos o prevision cercana. El sobrante debe mantenerse neutro cuando sea posible.

## Conservacion

Cada lote debe guardar:

- Estado de conservacion: refrigerado, congelado, seco o ambiente.
- Fecha de coccion o recepcion.
- Fecha limite de uso si aplica.
- Estado: activo, reservado, consumido, vencido o descartado.

La app debe alertar vencimientos, sin presentar esas alertas como certificacion legal.

## Pedido

1. Crear o seleccionar cliente.
2. Crear pedido en estado `draft`.
3. Agregar recetas y cantidades.
4. Calcular coste por receta.
5. Calcular precio recomendado.
6. Evaluar si 5 EUR es viable.
7. Calcular stock disponible por ingrediente.
8. Mostrar burritos posibles e ingrediente limitante.
9. Al confirmar, reservar stock.
10. Al entregar, descontar stock y registrar movimientos `sale`.

## Lista de Compra

La lista de compra futura debe generarse desde:

- Pedidos confirmados.
- Recetas seleccionadas.
- Stock disponible.
- Stock reservado.
- Minimos configurables.
- Produccion maxima recomendada para 2 dias.

## Reportes

Reportes previstos:

- Coste por burrito.
- Margen estimado por receta.
- Rendimiento por tanda.
- Merma por tanda.
- Stock por categoria.
- Productos proximos a vencer.
- Compras por proveedor.
- Precio historico por producto.
