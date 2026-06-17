const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, 'src/environments.ts');
const isVercel = process.env.VERCEL === '1';
const configuredApiUrl = process.env.API_URL?.trim();

if (isVercel && !configuredApiUrl) {
  throw new Error('Falta API_URL en las variables de entorno de Vercel.');
}

const apiUrl = (configuredApiUrl || 'http://localhost:8080').replace(/\/+$/, '');

if (!/^https?:\/\//.test(apiUrl)) {
  throw new Error('API_URL debe comenzar con http:// o https://.');
}

if (isVercel && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(apiUrl)) {
  throw new Error('API_URL no puede apuntar a localhost durante un despliegue en Vercel.');
}

const configuredWsUrl = process.env.WS_URL?.trim();
const wsUrl = (configuredWsUrl || apiUrl.replace(/^http/, 'ws')).replace(/\/+$/, '');

if (!/^wss?:\/\//.test(wsUrl)) {
  throw new Error('WS_URL debe comenzar con ws:// o wss://.');
}

if (isVercel && /^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(wsUrl)) {
  throw new Error('WS_URL no puede apuntar a localhost durante un despliegue en Vercel.');
}

const envConfigFile = `export const environment = {
  production: ${isVercel},
  apiUrl: ${JSON.stringify(apiUrl)},
  wsUrl: ${JSON.stringify(wsUrl)}
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`[set-env.js] environments.ts generado con apiUrl: ${apiUrl} y wsUrl: ${wsUrl}`);
