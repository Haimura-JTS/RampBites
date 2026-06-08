import { calculateStockCommitments, calculateStockValue, getProductUnitCost } from './calculations.js';
import { getCostReport, getProductionReport, getSalesReport } from './reports.js';

export const CSV_EXPORT_TYPES = {
  PRODUCTS: 'productos',
  STOCK: 'stock',
  PURCHASES: 'compras',
  PRODUCTIONS: 'producciones',
  ORDERS: 'pedidos',
  COSTS: 'costes'
};

export function buildCsvExport(data, type) {
  const exports = createCsvExports(data);
  const selected = exports[type];
  if (!selected) throw new Error(`Export CSV no soportado: ${type}`);
  return selected;
}

export function createCsvExports(data) {
  return {
    [CSV_EXPORT_TYPES.PRODUCTS]: {
      filename: datedFilename('productos'),
      content: productsCsv(data)
    },
    [CSV_EXPORT_TYPES.STOCK]: {
      filename: datedFilename('stock'),
      content: stockCsv(data)
    },
    [CSV_EXPORT_TYPES.PURCHASES]: {
      filename: datedFilename('compras'),
      content: purchasesCsv(data)
    },
    [CSV_EXPORT_TYPES.PRODUCTIONS]: {
      filename: datedFilename('producciones'),
      content: productionsCsv(data)
    },
    [CSV_EXPORT_TYPES.ORDERS]: {
      filename: datedFilename('pedidos'),
      content: ordersCsv(data)
    },
    [CSV_EXPORT_TYPES.COSTS]: {
      filename: datedFilename('reporte-costes'),
      content: costsCsv(data)
    }
  };
}

export function toCsv(rows, columns) {
  const header = columns.map((column) => csvCell(column.header)).join(',');
  const body = rows.map((row) => (
    columns.map((column) => csvCell(resolveValue(row, column))).join(',')
  ));
  return [header, ...body].join('\r\n');
}

function productsCsv(data) {
  return toCsv(data.products, [
    { header: 'id', key: 'id' },
    { header: 'nombre', key: 'name' },
    { header: 'categoria', key: 'category' },
    { header: 'subcategoria', key: 'subcategory' },
    { header: 'unidad', key: 'baseUnit' },
    { header: 'stock_minimo', key: 'stockMinimum' },
    { header: 'coste_actual', key: 'currentUnitCost' },
    { header: 'coste_estimado', key: 'estimatedUnitCost' },
    { header: 'fuente_coste', key: 'costSource' },
    { header: 'ubicacion', key: 'location' },
    { header: 'activo', key: 'active' }
  ]);
}

function stockCsv(data) {
  const commitments = calculateStockCommitments(data.stockMovements);
  const stockValue = calculateStockValue(data.products, commitments.physicalByProduct);
  const rows = data.products.map((product) => {
    const physicalQuantity = Number(commitments.physicalByProduct[product.id] ?? 0);
    const reservedQuantity = Number(commitments.reservedByProduct[product.id] ?? 0);
    const availableQuantity = Number(commitments.availableByProduct[product.id] ?? 0);
    const unitCost = getProductUnitCost(product);
    return {
      id: product.id,
      nombre: product.name,
      categoria: product.category,
      ubicacion: product.location,
      unidad: product.baseUnit,
      stock_fisico: physicalQuantity,
      stock_reservado: reservedQuantity,
      stock_disponible: availableQuantity,
      minimo: product.stockMinimum,
      coste_unitario: unitCost,
      valor: physicalQuantity * unitCost,
      valor_total_stock: stockValue
    };
  });
  return toCsv(rows, [
    { header: 'id', key: 'id' },
    { header: 'nombre', key: 'nombre' },
    { header: 'categoria', key: 'categoria' },
    { header: 'ubicacion', key: 'ubicacion' },
    { header: 'unidad', key: 'unidad' },
    { header: 'stock_fisico', key: 'stock_fisico' },
    { header: 'stock_reservado', key: 'stock_reservado' },
    { header: 'stock_disponible', key: 'stock_disponible' },
    { header: 'minimo', key: 'minimo' },
    { header: 'coste_unitario', key: 'coste_unitario' },
    { header: 'valor', key: 'valor' }
  ]);
}

function purchasesCsv(data) {
  const suppliers = Object.fromEntries(data.suppliers.map((supplier) => [supplier.id, supplier]));
  const products = Object.fromEntries(data.products.map((product) => [product.id, product]));
  const rows = data.purchases.flatMap((purchase) => (
    (purchase.items ?? []).map((item) => ({
      compra_id: purchase.id,
      fecha: purchase.date,
      proveedor: suppliers[purchase.supplierId]?.name ?? purchase.supplierId,
      producto: products[item.productId]?.name ?? item.productId,
      cantidad: item.quantity,
      unidad: item.unit,
      precio_total: item.totalPrice,
      coste_unitario: item.unitCost,
      total_ticket: purchase.ticketTotal,
      diferencia: purchase.difference,
      notas: item.notes || purchase.notes || ''
    }))
  ));
  return toCsv(rows, [
    { header: 'compra_id', key: 'compra_id' },
    { header: 'fecha', key: 'fecha' },
    { header: 'proveedor', key: 'proveedor' },
    { header: 'producto', key: 'producto' },
    { header: 'cantidad', key: 'cantidad' },
    { header: 'unidad', key: 'unidad' },
    { header: 'precio_total', key: 'precio_total' },
    { header: 'coste_unitario', key: 'coste_unitario' },
    { header: 'total_ticket', key: 'total_ticket' },
    { header: 'diferencia', key: 'diferencia' },
    { header: 'notas', key: 'notas' }
  ]);
}

function productionsCsv(data) {
  return toCsv(getProductionReport(data).rows, [
    { header: 'fecha', key: 'date' },
    { header: 'lote', key: 'lotCode' },
    { header: 'tanda', key: 'batchCode' },
    { header: 'carne', key: 'meat' },
    { header: 'corte', key: 'cut' },
    { header: 'peso_crudo', key: 'rawWeight' },
    { header: 'peso_final', key: 'finalWeight' },
    { header: 'rendimiento', key: 'yieldRatio' },
    { header: 'coste_total', key: 'totalCost' },
    { header: 'coste_100g', key: 'costPer100g' },
    { header: 'tiempo_min', key: 'durationMinutes' },
    { header: 'observaciones', key: 'notes' }
  ]);
}

function ordersCsv(data) {
  return toCsv(getSalesReport(data).rows, [
    { header: 'pedido', key: 'orderNumber' },
    { header: 'cliente', key: 'clientName' },
    { header: 'fecha', key: 'date' },
    { header: 'productos', key: 'items' },
    { header: 'total_venta', key: 'total' },
    { header: 'coste_estimado', key: 'estimatedCost' },
    { header: 'ganancia', key: 'grossProfit' },
    { header: 'margen', key: 'marginPercentage' },
    { header: 'estado', key: 'status' },
    { header: 'pagado', key: 'paid' },
    { header: 'metodo_pago', key: 'paymentMethod' }
  ]);
}

function costsCsv(data) {
  return toCsv(getCostReport(data), [
    { header: 'receta', key: 'recipeName' },
    { header: 'estado', key: 'status' },
    { header: 'coste', key: 'cost' },
    { header: 'precio_actual', key: 'salePrice' },
    { header: 'ganancia', key: 'grossProfit' },
    { header: 'margen', key: 'marginPercentage' },
    { header: 'burritos_posibles', key: 'possibleUnits' },
    { header: 'alerta_precio', key: 'priceStatus' }
  ]);
}

function resolveValue(row, column) {
  if (typeof column.value === 'function') return column.value(row);
  return row[column.key];
}

function csvCell(value) {
  const normalized = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function datedFilename(name) {
  return `ramp-bites-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
}
