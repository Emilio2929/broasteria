import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token'); 
  
  let reqClone = req;
  const url = req.url.toLowerCase();

  // Excluir Login
  if (url.includes('/auth/login') || url.includes('/clientes/login') || url.includes('/empleados/login')) {
    return next(req);
  }

  if (token) {
    reqClone = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else {
    // Solo para que veas en consola si funcionó
    // console.warn('Interceptor: No encontré token en Storage');
  }

  return next(reqClone).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401 || error.status === 403) {

        if (!url.includes('login')) {
            console.error('Error 401/403. Token inválido o expirado.');

            localStorage.clear(); 
            sessionStorage.clear();
            router.navigate(['/']); 
        }
      }

      return throwError(() => error);
    })
  );
};