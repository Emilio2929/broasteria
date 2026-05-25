import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {

    private baseUrl = environment.apiUrl + '/pedidos';

    constructor(private http: HttpClient) {}

    //Obtener pedidos para delivery
    getPedidosDelivery(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/delivery`);
    }

    // Cambiar estado a "En camino"
    marcarEnCamino(idPedido: number): Observable<any> {
        return this.http.put(`${this.baseUrl}/en-camino/${idPedido}`, {});
    }

    // Cambiar estado a "Completado"
    completarPedido(idPedido: number): Observable<any> {
        return this.http.put(`${this.baseUrl}/completar-delivery/${idPedido}`, {}); 
    }

    validarDNIEntrega(idPedido: number, dni: string): Observable<any> {
    return this.http.put(
        `${this.baseUrl}/validar-dni-delivery/${idPedido}`,
        {},
        { params: { dniIngresado: dni } }
    );
    }
}