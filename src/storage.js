/**
 * Storage layer.
 *
 * Etapa 0: contrato conceptual.
 * Etapa 1: implementacion LocalStorage.
 *
 * La UI no debe llamar directamente a localStorage. Mantener esta capa permite
 * migrar despues a IndexedDB, SQLite o backend Node.js.
 */

class Storage {
  async create(collection, data) {
    throw new Error(`Storage.create no implementado en Etapa 0: ${collection}`);
  }

  async read(collection, id) {
    throw new Error(`Storage.read no implementado en Etapa 0: ${collection}/${id}`);
  }

  async update(collection, id, data) {
    throw new Error(`Storage.update no implementado en Etapa 0: ${collection}/${id}`);
  }

  async delete(collection, id) {
    throw new Error(`Storage.delete no implementado en Etapa 0: ${collection}/${id}`);
  }

  async list(collection, filter = {}) {
    throw new Error(`Storage.list no implementado en Etapa 0: ${collection}`);
  }

  async clear(collection = null) {
    throw new Error(`Storage.clear no implementado en Etapa 0: ${collection ?? 'database'}`);
  }

  async backup() {
    throw new Error('Storage.backup no implementado en Etapa 0');
  }

  async restore(jsonData) {
    throw new Error('Storage.restore no implementado en Etapa 0');
  }
}

export default Storage;
