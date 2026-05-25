const fs = require('fs');
const path = require('path');

const files = [
  "src/app/services/mesero.service.ts",
  "src/app/services/gerente.service.ts",
  "src/app/services/empleado.service.ts",
  "src/app/services/delivery.service.ts",
  "src/app/services/cliente.service.ts",
  "src/app/services/chef.service.ts",
  "src/app/services/cajero.service.ts",
  "src/app/recuperar-contrasena/validar-codigo/validar-codigo.ts",
  "src/app/recuperar-contrasena/solicitar-correo/solicitar-correo.ts",
  "src/app/recuperar-contrasena/cambiar-contrasena/cambiar-contrasena.ts",
  "src/app/components/chatbot/chatbot.ts",
  "src/app/cliente/registrar/registrar.ts",
  "src/app/cliente/historial/historial.ts",
  "src/app/cliente/infocliente/infocliente.ts",
  "src/app/cliente/carrito/carrito.ts"
];

files.forEach(relativePath => {
  const filePath = path.join(__dirname, relativePath);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Archivo no encontrado: ${relativePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Reemplazar endpoints con variables de entorno
  content = content.replace(/'http:\/\/localhost:8080'/g, 'environment.apiUrl');
  content = content.replace(/"http:\/\/localhost:8080"/g, 'environment.apiUrl');
  content = content.replace(/'http:\/\/localhost:8080/g, "environment.apiUrl + '");
  content = content.replace(/"http:\/\/localhost:8080/g, 'environment.apiUrl + "');
  
  if (content !== originalContent) {
    // Agregar el import de environment si no está presente
    if (!content.includes('import { environment }')) {
      content = `import { environment } from 'src/environments';\n` + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado: ${relativePath}`);
  } else {
    console.log(`ℹ️ Sin cambios: ${relativePath}`);
  }
});

console.log("\n¡Refactorización completa! Todos los archivos ahora usan environment.apiUrl.");
