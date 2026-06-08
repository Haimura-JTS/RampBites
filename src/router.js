import { ROUTES } from './constants.js';
import { renderClients } from './views/clientsView.js';
import { renderDashboard } from './views/dashboardView.js';
import { renderOrders } from './views/ordersView.js';
import { renderPriceHistory } from './views/priceHistoryView.js';
import { renderProducts } from './views/productsView.js';
import { renderProduction } from './views/productionView.js';
import { renderPurchases } from './views/purchasesView.js';
import { renderRecipes } from './views/recipesView.js';
import { renderReports } from './views/reportsView.js';
import { renderPlaceholder } from './views/placeholderView.js';
import { renderSettings } from './views/settingsView.js';
import { renderSimulator } from './views/simulatorView.js';
import { renderExpiry } from './views/expiryView.js';
import { renderLots } from './views/lotsView.js';
import { renderKitchen } from './views/kitchenView.js';
import { renderStock } from './views/stockView.js';
import { renderSuppliers } from './views/suppliersView.js';

const routeRenderers = {
  dashboard: renderDashboard,
  products: renderProducts,
  suppliers: renderSuppliers,
  purchases: renderPurchases,
  priceHistory: renderPriceHistory,
  stock: renderStock,
  production: renderProduction,
  lots: renderLots,
  expiry: renderExpiry,
  recipes: renderRecipes,
  simulator: renderSimulator,
  kitchen: renderKitchen,
  clients: renderClients,
  orders: renderOrders,
  reports: renderReports,
  settings: renderSettings
};

export class Router {
  constructor() {
    this.mainElement = null;
    this.navElement = null;
    this.context = {};
    this.currentRoute = 'dashboard';
  }

  init({ mainElement, navElement, context }) {
    this.mainElement = mainElement;
    this.navElement = navElement;
    this.context = context;
    this.renderNav();

    window.addEventListener('hashchange', () => this.renderFromHash());
    this.renderFromHash();
  }

  navigate(routeName) {
    window.location.hash = routeName;
  }

  renderFromHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const [routeName, queryString = ''] = hash.split('?');
    const route = ROUTES.find((item) => item.name === routeName) ?? ROUTES[0];
    this.currentRoute = route.name;
    this.renderNav();
    this.renderRoute({
      ...route,
      params: new URLSearchParams(queryString)
    });
  }

  renderNav() {
    if (!this.navElement) return;

    this.navElement.innerHTML = ROUTES.map((route) => `
      <a class="nav-link ${route.name === this.currentRoute ? 'is-active' : ''}" href="#${route.name}"${route.name === this.currentRoute ? ' aria-current="page"' : ''}>
        ${route.label}
      </a>
    `).join('');
  }

  renderRoute(route) {
    if (!this.mainElement) return;

    const renderer = routeRenderers[route.name] ?? renderPlaceholder;
    this.mainElement.innerHTML = renderer({
      route,
      data: this.context.getData(),
      actions: this.context.actions
    });

    if (typeof this.context.afterRender === 'function') {
      this.context.afterRender(route.name);
    }
  }
}

export const router = new Router();
