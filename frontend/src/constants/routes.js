// constants/routes.js — centralized route path strings.
// Never write route paths as raw strings inside components.
// Always import from here so renaming a route is a single change.

export const ROUTES = {
  LOGIN:        '/login',
  DASHBOARD:    '/dashboard',
  USERS:        '/users',
  PRODUCTS:     '/products',
  SHOPS:        '/shops',
  ORDERS:       '/orders',
  ORDER_DETAIL: '/orders/:id',
  VOICE_ORDER:  '/voice-order',
  PROFILE:      '/profile',
  UNAUTHORIZED: '/unauthorized',
};

// Helper to build dynamic routes
export const buildRoute = {
  orderDetail: (id) => `/orders/${id}`,
};
