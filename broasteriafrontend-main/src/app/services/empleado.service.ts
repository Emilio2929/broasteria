import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Rol {
  idRol: number;
  nombreRol: string;
}

export interface EstadoEmpleado {
  idEstadoEmpleado: number;
  nombreEstadoEmpleado: string;
}

export interface Empleado {
  idEmpleado?: number;
  nombre: string;
  apellido: string;
  usuarioLogin: string;
  contrasenaHash: string;
  rol: Rol;
  estado: EstadoEmpleado;
  online: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private baseUrl = environment.apiUrl + '/empleados';

  constructor(private http: HttpClient) {}

  // CRUD
  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.baseUrl);
  }

  obtenerEmpleadoPorId(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.baseUrl}/${id}`);
  }

  eliminarEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // LOGIN
  login(usuarioLogin: string, contrasenaHash: string): Observable<any> {
    const body = { usuarioLogin, contrasenaHash };

    return this.http.post(`${this.baseUrl}/login`, body).pipe(
      tap((resp: any) => {

        const token = resp.token;

        if (token) {
          sessionStorage.setItem('token', token);

          const payload = JSON.parse(atob(token.split('.')[1]));

          sessionStorage.setItem('usuarioLogin', payload.sub);
          sessionStorage.setItem('rolEmpleado', payload.rol);
          sessionStorage.setItem('idEmpleado', payload.idEmpleado);
        }
      })
    );
  }

  getEmpleadoPorUsuarioLogin(usuarioLogin: string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.baseUrl}/por-usuario/${usuarioLogin}`);
  }

  getEmpleadoDesdeToken(): string | null {
    const token = sessionStorage.getItem('token');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  }

  logoutBackend(): Observable<any> {
    const id = sessionStorage.getItem('idEmpleado');
    return this.http.post(`${this.baseUrl}/logout/${id}`, {});
  }

  logout(): void {
    const id = sessionStorage.getItem('idEmpleado');

    if (id) {
      this.logoutBackend().subscribe({
        next: () => console.log("Backend marcó offline correctamente"),
        error: (err) => console.error("Error marcando offline", err),
        complete: () => {
          console.log("Sesión limpiada");
          sessionStorage.clear();
        }
      });
    } else {
      sessionStorage.clear();
    }
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }

  getRol(): string | null {
    return sessionStorage.getItem('rolEmpleado');
  }

  getUsuario(): string | null {
    return sessionStorage.getItem('usuarioLogin');
  }
}
