/**
 * Validadores
 * 
 * Funciones de validación para:
 * - Strings (longitud, formato)
 * - Numbers (rango, precision)
 * - Emails
 * - Fechas
 * - Estructuras de datos (Product, Purchase, etc.)
 * 
 * Devuelven: { valid: boolean, errors: string[] }
 * 
 * ETAPA 0: Estructura definida en BUSINESS_RULES.md (sección 10)
 * ETAPA 1: Será implementado aquí
 */

export function validateRequired(value) {
  // TODO: Implementar en ETAPA 1
  return { valid: value !== null && value !== undefined && value !== '', errors: [] };
}

export function validateString(value, minLen = 1, maxLen = 1000) {
  // TODO: Implementar en ETAPA 1
  const errors = [];
  if (!value || value.length < minLen) {
    errors.push(`Mínimo ${minLen} caracteres`);
  }
  if (value && value.length > maxLen) {
    errors.push(`Máximo ${maxLen} caracteres`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateNumber(value, min = -Infinity, max = Infinity) {
  // TODO: Implementar en ETAPA 1
  const errors = [];
  if (isNaN(value)) {
    errors.push('Debe ser un número');
  }
  if (value < min) {
    errors.push(`Mínimo: ${min}`);
  }
  if (value > max) {
    errors.push(`Máximo: ${max}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateEmail(email) {
  // TODO: Implementar en ETAPA 1
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = regex.test(email);
  return { valid, errors: valid ? [] : ['Email inválido'] };
}

export function validateCurrency(value) {
  // TODO: Implementar en ETAPA 1
  // Debe ser número >= 0 con máx 2 decimales
  const errors = [];
  if (isNaN(value)) {
    errors.push('Debe ser un número');
  }
  if (value < 0) {
    errors.push('No puede ser negativo');
  }
  return { valid: errors.length === 0, errors };
}

export function validateProduct(data) {
  // TODO: Implementar en ETAPA 1
  // Ver BUSINESS_RULES.md sección 10.1
  const errors = [];
  // Validar: name, category, unit, allergens
  return { valid: errors.length === 0, errors };
}

export function validatePurchase(data) {
  // TODO: Implementar en ETAPA 1
  // Ver BUSINESS_RULES.md sección 10.2
  const errors = [];
  // Validar: productId, supplierId, quantity, priceTotal, date
  return { valid: errors.length === 0, errors };
}

export function validateProduction(data) {
  // TODO: Implementar en ETAPA 1
  // Ver BUSINESS_RULES.md sección 10.3
  const errors = [];
  // Validar: inputMeat, outputMeat, yield, timestamps
  return { valid: errors.length === 0, errors };
}

export function validateRecipe(data) {
  // TODO: Implementar en ETAPA 1
  const errors = [];
  // Validar: name, ingredients, allergens
  return { valid: errors.length === 0, errors };
}

export function validateOrder(data) {
  // TODO: Implementar en ETAPA 1
  const errors = [];
  // Validar: clientId, items, total, deliveryDate
  return { valid: errors.length === 0, errors };
}
