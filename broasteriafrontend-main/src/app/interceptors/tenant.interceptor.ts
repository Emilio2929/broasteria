import { HttpInterceptorFn } from '@angular/common/http';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Extraer el subdominio de la URL actual (ej: juan.tusistema.com -> juan)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Fallback automatizado para entornos de desarrollo local (localhost)
  const subdomain = (parts.length > 2 && parts[0] !== 'www') ? parts[0] : 'default_brosteria';
  
  // Clonar de forma inmutable la petición HTTP y adjuntar la cabecera X-Tenant-ID
  const tenantReq = req.clone({
    setHeaders: {
      'X-Tenant-ID': subdomain
    }
  });
  
  return next(tenantReq);
};
