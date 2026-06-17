const fs = require('fs');
const path = require('path');

// Ruta del archivo environments.ts
const targetPath = path.resolve(__dirname, 'src/environments.ts');

const apiUrl = process.env.API_URL || 'http://localhost:8080';
const wsUrl = process.env.WS_URL || apiUrl.replace(/^https?:\/\//, apiUrl.startsWith('https') ? 'wss://' : 'ws://');

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}'
};
`;

// Sobrescribir environments.ts
fs.writeFileSync(targetPath, envConfigFile);
console.log(`[set-env.js] environments.ts generado con apiUrl: ${apiUrl} y wsUrl: ${wsUrl}`);
