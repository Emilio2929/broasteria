import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CajeroService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listarPedidos() {
    return this.http.get<any[]>(`${this.baseUrl}/pedidos`);
  }

  // Cambiar estado de pedido
  cambiarEstadoPedido(idPedido: number, idEstado: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/pedidos/cambiarEstado/${idPedido}/${idEstado}`, {});
  }

  // Buscar pedido por numero
  buscarPedido(idPedido: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/pedidos/buscar/${idPedido}`);
  }

  // Generar boleta o factura
  generarPago(pago: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/pagos/crear`, pago);
  }

  finalizarPedido(idPedido: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/pedidos/finalizar/${idPedido}`, {});
  }

  // Imprimir comprobante (abrir PDF)
  imprimirComprobante(idPedido: number, idTipoComprobante: number, metodoPago: number) {
    return this.http.get(
      `${this.baseUrl}/pagos/imprimir/${idPedido}/${idTipoComprobante}?metodoPago=${metodoPago}`,
      { responseType: 'text' }
    );
  }
}
