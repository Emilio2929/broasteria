import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChefService {

  private baseUrl = environment.apiUrl + '/pedidos';

  constructor(private http: HttpClient) { }

  // Trae todos los pedidos globales
  listarPedidosGlobales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chef`);
  }
  
  // Metodo para cambiar estado
  cambiarEstadoPedido(idPedido: number, idEstado: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cambiarEstado/${idPedido}/${idEstado}`, {});
  }
}