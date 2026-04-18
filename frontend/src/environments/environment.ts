// Production defaults. Served when the Angular app is built via
// `ng build` (configuration: production). The nginx container proxies
// /api/ to the Django backend, so a relative URL is correct.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
