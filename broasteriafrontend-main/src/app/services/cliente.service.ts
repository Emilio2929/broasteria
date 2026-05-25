import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface TipoDocumento {
  id: number;
  nombreDocumento?: string;
}

export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  direccion: string;
  telefono: number;
  numeroDocumento: number;
  correo: string;
  contrasena: string;
  tipoDocumento: TipoDocumento;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private baseUrl = environment.apiUrl + '/clientes';
  private apiUrlPagos = environment.apiUrl + '/pagos';

  // Inicializa basado en si existe el token
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {}
  
  private hasToken(): boolean {
    return !!localStorage.getItem('token'); 
  }

  estaLogueado(): boolean {
    return this.hasToken();
  }

  logout() {
    localStorage.removeItem('token');   
    localStorage.removeItem('cliente'); 
    localStorage.removeItem('usuario'); 
    this.isLoggedInSubject.next(false); 
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.baseUrl);
  }

  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.baseUrl}/crear`, cliente);
  }

  obtenerClientePorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  actualizarCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, cliente);
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  login(datosLogin: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, datosLogin).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('cliente', JSON.stringify(response.cliente)); 
          this.isLoggedInSubject.next(true);
        }
      })
    );
  }

  // METODOS PARA PEDIDOS
  obtenerHistorial(idCliente: number): Observable<any[]> {
     return this.http.get<any[]>(`${environment.apiUrl}/pedidos/historial/${idCliente}`);
  }

  cancelarPedido(idPedido: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/pedidos/cancelar/${idPedido}`, {});
  }

  // METODOS NIUBIZ
  iniciarPagoNiubiz(monto: number): Observable<any> {
    return this.http.get(`${this.apiUrlPagos}/niubiz/iniciar/${monto}`);
  }

  confirmarPagoNiubiz(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrlPagos}/niubiz/confirmar`, payload);
  }

  // Para cambiar contraseña
  cambiarContrasenaPerfil(datos: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/cambiar-contrasena-perfil`, datos, { responseType: 'text' });
  }

  // --- NUEVO MÉTODO PARA VALIDAR SESIÓN ---
  validarSesion(): Observable<any> {
    return this.http.get(`${this.baseUrl}/perfil`); 
  }
}