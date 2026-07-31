const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const envPath = path.join(frontendRoot, '.env');
const outputPath = path.join(frontendRoot, 'src', 'assets', 'env.js');
const requiredKeys = [
  'API_BASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_IDENTITY_SERVICES_URL',
  'APP_NAME',
  'ENVIRONMENT_NAME',
  'ENABLE_GOOGLE_SIGN_IN'
];

if (!fs.existsSync(envPath)) {
  throw new Error('Missing frontend/.env. Copy .env.example to .env and provide the runtime configuration.');
}

const values = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const separator = trimmed.indexOf('=');
  if (separator < 1) throw new Error(`Invalid .env entry: ${line}`);
  values[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
}

for (const key of requiredKeys) {
  if (!(key in values)) throw new Error(`Missing ${key} in frontend/.env.`);
}

const runtimeConfig = {
  apiBaseUrl: values.API_BASE_URL,
  googleClientId: values.GOOGLE_CLIENT_ID,
  googleIdentityServicesUrl: values.GOOGLE_IDENTITY_SERVICES_URL,
  appName: values.APP_NAME,
  environmentName: values.ENVIRONMENT_NAME,
  enableGoogleSignIn: values.ENABLE_GOOGLE_SIGN_IN.toLowerCase() === 'true'
};

fs.writeFileSync(
  outputPath,
  `window.__env = ${JSON.stringify(runtimeConfig, null, 2)};\n`,
  'utf8'
);
