export interface AppConfig {
  apiBaseUrl: string;
  googleClientId: string;
  googleIdentityServicesUrl: string;
  appName: string;
  environmentName: string;
  enableGoogleSignIn: boolean;
  // Optional tenant identification used by the frontend to route requests to a specific tenant.
  // Provide either tenantId (numeric) or tenantCode (string) in the runtime config.
  tenantId?: number;
  tenantCode?: string;
}

declare global {
  interface Window {
    __env?: AppConfig;
  }
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname === '127.0.0.1'
    || hostname === '0.0.0.0';
}

function getRuntimeConfig(): AppConfig {
  if (!window.__env) {
    throw new Error('Runtime configuration is missing. Run the application using the configured npm scripts.');
  }

  const runtimeConfig = window.__env;
  if (isLocalDevelopmentHost(window.location.hostname.toLowerCase())) {
    return {
      ...runtimeConfig,
      apiBaseUrl: '/api'
    };
  }

  return runtimeConfig;
}

export const appConfig = getRuntimeConfig();
