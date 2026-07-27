/**
 * Runtime configuration. In a real build these are swapped per environment via
 * Angular's fileReplacements. Points at the shared NestJS API.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:4000/api/v1',
  socketUrl: 'http://localhost:4000',
}
