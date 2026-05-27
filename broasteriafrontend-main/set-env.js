const fs = require('fs');
const path = require('path');

// Ruta del archivo environments.ts
const targetPath = path.resolve(__dirname, 'src/environments.ts');

// Leer la variable de entorno de Vercel, o usar localhost por defecto
const apiUrl = process.env.API_URL || 'https://broasteria.onrender.com';

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

// Sobrescribir environments.ts
fs.writeFileSync(targetPath, envConfigFile);
console.log(`[set-env.js] environments.ts generado con apiUrl: ${apiUrl}`);
