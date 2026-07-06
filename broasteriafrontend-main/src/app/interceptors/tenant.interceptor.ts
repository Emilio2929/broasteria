import { HttpInterceptorFn } from '@angular/common/http';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Extraer el subdominio de la URL actual
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Extraer la primera parte (ej: juan-broasteria -> juan-broasteria)
  let rawSubdomain = (parts.length > 2 && parts[0] !== 'www') ? parts[0] : 'default_brosteria';
  
  // HACK PARA VERCEL: Como Vercel obliga a usar guiones (juan-broasteria.vercel.app)
  // Cortamos por el guion y tomamos solo la primera parte ("juan")
  if (rawSubdomain.includes('-')) {
      rawSubdomain = rawSubdomain.split('-')[0];
  }
  
  const subdomain = rawSubdomain;

  // Clonar de forma inmutable la petición HTTP y adjuntar la cabecera X-Tenant-ID
  const tenantReq = req.clone({
    setHeaders: {
      'X-Tenant-ID': subdomain
    }
  });
  
  return next(tenantReq);
};
