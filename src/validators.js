export function validateRequired(value, label = 'Campo') {
  const valid = value !== null && value !== undefined && String(value).trim() !== '';
  return result(valid, valid ? [] : [`${label} es obligatorio.`]);
}

export function validateString(value, label = 'Texto', minLength = 1, maxLength = 1000) {
  const errors = [];
  const text = String(value ?? '').trim();

  if (text.length < minLength) errors.push(`${label} debe tener al menos ${minLength} caracteres.`);
  if (text.length > maxLength) errors.push(`${label} no puede superar ${maxLength} caracteres.`);

  return result(errors.length === 0, errors);
}

export function validateNumber(value, label = 'Numero', min = -Infinity, max = Infinity) {
  const errors = [];
  const number = Number(value);

  if (!Number.isFinite(number)) errors.push(`${label} debe ser un numero.`);
  if (number < min) errors.push(`${label} debe ser mayor o igual que ${min}.`);
  if (number > max) errors.push(`${label} debe ser menor o igual que ${max}.`);

  return result(errors.length === 0, errors);
}

export function validateEmail(email) {
  if (!email) return result(true, []);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return result(valid, valid ? [] : ['Email invalido.']);
}

export function validateCurrency(value, label = 'Importe') {
  const numberValidation = validateNumber(value, label, 0);
  if (!numberValidation.valid) return numberValidation;

  const decimals = String(value).split('.')[1]?.length ?? 0;
  const errors = decimals > 2 ? [`${label} no puede tener mas de 2 decimales.`] : [];
  return result(errors.length === 0, errors);
}

export function validateProduct(data) {
  return combine([
    validateString(data?.name, 'Nombre de producto'),
    validateRequired(data?.category, 'Categoria'),
    validateRequired(data?.baseUnit, 'Unidad base'),
    validateNumber(data?.stockMinimum ?? 0, 'Stock minimo', 0)
  ]);
}

export function validateSupplier(data) {
  return combine([
    validateString(data?.name, 'Nombre de proveedor'),
    validateRequired(data?.type, 'Tipo de proveedor')
  ]);
}

export function validatePurchase(data) {
  const validations = [
    validateRequired(data?.supplierId, 'Proveedor'),
    validateRequired(data?.date, 'Fecha')
  ];

  if (!Array.isArray(data?.items) || data.items.length === 0) {
    validations.push(result(false, ['La compra debe tener al menos un item.']));
  }

  for (const item of data?.items ?? []) {
    validations.push(validateRequired(item.productId, 'Producto'));
    validations.push(validateNumber(item.quantity, 'Cantidad', 0.000001));
    validations.push(validateCurrency(item.totalPrice, 'Precio total'));
    validations.push(validateRequired(item.unit, 'Unidad'));
  }

  return combine(validations);
}

export function validateUnitCompatibility(item, product) {
  if (!product) return result(false, ['Producto no encontrado.']);
  if (!product.baseUnit) return result(false, [`${product.name} no tiene unidad base.`]);
  if (item.unit !== product.baseUnit) {
    return result(false, [`Unidad incompatible para ${product.name}: ${item.unit} vs ${product.baseUnit}.`]);
  }

  return result(true, []);
}

export function validateProduction(data) {
  return combine([
    validateRequired(data?.rawProductId, 'Carne cruda'),
    validateNumber(data?.rawWeightUsed, 'Peso crudo usado', 0.000001)
  ]);
}

export function validateRecipe(data) {
  const validations = [
    validateString(data?.name, 'Nombre de receta'),
    validateRequired(data?.category, 'Categoria de receta'),
    validateRequired(data?.status, 'Estado de receta')
  ];
  if (!Array.isArray(data?.ingredients) || data.ingredients.length === 0) {
    validations.push(result(false, ['La receta debe tener ingredientes.']));
  }

  for (const item of data?.ingredients ?? []) {
    validations.push(validateRequired(item.productId, 'Producto de ingrediente'));
    validations.push(validateNumber(item.quantity, 'Cantidad de ingrediente', 0.000001));
    validations.push(validateRequired(item.unit, 'Unidad de ingrediente'));
  }

  return combine(validations);
}

export function validateClient(data) {
  const validations = [
    validateString(data?.name, 'Nombre de cliente'),
    validateRequired(data?.channel ?? 'otro', 'Canal')
  ];
  const emailValidation = validateEmail(data?.email);
  validations.push(emailValidation);
  return combine(validations);
}

export function validateOrder(data) {
  const validations = [
    validateRequired(data?.clientId, 'Cliente'),
    validateRequired(data?.orderDate ?? data?.date, 'Fecha de pedido'),
    validateRequired(data?.status, 'Estado de pedido'),
    validateNumber(data?.discount ?? 0, 'Descuento', 0)
  ];
  if (!Array.isArray(data?.items) || data.items.length === 0) {
    validations.push(result(false, ['El pedido debe tener al menos una linea.']));
  }
  for (const item of data?.items ?? []) {
    validations.push(validateRequired(item.recipeId, 'Receta'));
    validations.push(validateNumber(item.quantity, 'Cantidad de pedido', 0.000001));
    validations.push(validateCurrency(item.unitPrice ?? 0, 'Precio unitario'));
  }
  return combine(validations);
}

function combine(validations) {
  const errors = validations.flatMap((validation) => validation.errors);
  return result(errors.length === 0, errors);
}

function result(valid, errors) {
  return { valid, errors };
}
