/**
 * Router - Navegación entre vistas
 * 
 * Responsabilidades:
 * - Mantener vista actual
 * - Manejar cambios de vista
 * - Renderizar vistas
 * - Pasar parámetros entre vistas
 * 
 * ETAPA 0: Estructura definida
 * ETAPA 1: Será implementado (router simple, no SPA router complejo)
 */

class Router {
  constructor() {
    this.currentView = 'dashboard';
    this.viewParams = {};
  }

  navigate(viewName, params = {}) {
    // TODO: Implementar en ETAPA 1
    // - Guardar vista actual
    // - Cambiar a nueva vista
    // - Pasar parámetros
    // - Llamar a render
    this.currentView = viewName;
    this.viewParams = params;
    this.render();
  }

  render() {
    // TODO: Implementar en ETAPA 1
    // - Limpiar DOM principal
    // - Cargar vista actual
    // - Pasar parámetros
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('App container not found');
      return;
    }

    // appContainer.innerHTML = '';
    // const viewComponent = getViewComponent(this.currentView);
    // viewComponent.render(appContainer, this.viewParams);
  }

  back() {
    // TODO: Implementar historial en ETAPA 1
    console.log('Back button pressed');
  }

  getRoutes() {
    // TODO: Retornar todas las rutas disponibles
    return [
      { name: 'dashboard', label: '📊 Dashboard', icon: 'dashboard' },
      { name: 'products', label: '📦 Productos', icon: 'box' },
      { name: 'suppliers', label: '🏪 Proveedores', icon: 'store' },
      { name: 'purchases', label: '💳 Compras', icon: 'cart' },
      { name: 'stock', label: '📍 Stock', icon: 'layers' },
      { name: 'production', label: '🍲 Producción', icon: 'fire' },
      { name: 'lots', label: '📋 Lotes', icon: 'clipboard' },
      { name: 'expiry', label: '⏰ Caducidad', icon: 'timer' },
      { name: 'recipes', label: '👨‍🍳 Recetas', icon: 'utensils' },
      { name: 'simulator', label: '🎯 Simulador', icon: 'target' },
      { name: 'clients', label: '👥 Clientes', icon: 'users' },
      { name: 'orders', label: '📝 Órdenes', icon: 'clipboard-list' },
      { name: 'reports', label: '📈 Reportes', icon: 'chart-bar' },
      { name: 'settings', label: '⚙️ Configuración', icon: 'cog' },
      { name: 'backup', label: '💾 Backup', icon: 'save' }
    ];
  }
}

export default new Router();
