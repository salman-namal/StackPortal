export interface AppConfig {
  apiBaseUrl: string;
  googleClientId: string;
  googleIdentityServicesUrl: string;
  appName: string;
  environmentName: string;
  enableGoogleSignIn: boolean;
}

declare global {
  interface Window {
    __env?: AppConfig;
  }
}

function getRuntimeConfig(): AppConfig {
  if (!window.__env) {
    throw new Error('Runtime configuration is missing. Run the application using the configured npm scripts.');
  }

  return window.__env;
}

export const appConfig = getRuntimeConfig();
