import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { Observable, Subject, Subscription } from 'rxjs';
import { PedidoRealtimeService } from './pedido-realtime.service';

@Injectable({
  providedIn: 'root'
})
export class MeseroService {
    
    private baseUrl = environment.apiUrl;

    // MEMORIA DE OCULTOS
    private idsOcultosMemoria: Set<number> = new Set();

    // SISTEMA DE NOTIFICACION GLOBAL
    private notificacionSource = new Subject<any>();
    notificacion$ = this.notificacionSource.asObservable();

    private audio = new Audio('/assets/notificacionpedidolisto.mp3');
    private monitoreoSubscription: Subscription | undefined;

    constructor(
      private http: HttpClient,
      private router: Router,
      private pedidoRealtime: PedidoRealtimeService
    ) {
        this.iniciarMonitoreoGlobal();
    }
    
    iniciarMonitoreoGlobal() {
        if (this.monitoreoSubscription) return;
        this.monitoreoSubscription = this.pedidoRealtime.escuchar('mesero').subscribe((evento) => {
            if (evento.estadoId !== 3 || this.router.url.includes('/chef')) {
                return;
            }

            this.reproducirSonido();
            this.enviarNotificacionVisual(evento.pedidoId);
        });
    }

    private reproducirSonido() {
        this.audio.load();
        this.audio.volume = 1.0;
        this.audio.play().catch(e => console.warn("Audio bloqueado", e));
    }

    private enviarNotificacionVisual(idPedido: number) {
        this.notificacionSource.next({
            id: Date.now(),
            mensaje: `¡El pedido #${idPedido} está LISTO!`
        });
    }
    
    getIdsOcultos(): Set<number> { return this.idsOcultosMemoria; }
    agregarIdOculto(id: number) { this.idsOcultosMemoria.add(id); }
    limpiarIdsOcultos() { this.idsOcultosMemoria.clear(); }


    listarPedidos(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/pedidos`);
    }
    listarTodosLosPedidos() {
    return this.http.get<any[]>(`${this.baseUrl}/pedidos/ListPedidos`);
    }

    obtenerPedidosPorEmpleado(idEmpleado: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/pedidos/empleado/${idEmpleado}`);
    }
    
    crearPedidoMesero(pedidoData: any): Observable<any> {
      return this.http.post<any>(`${this.baseUrl}/pedidos/crearMesero`, pedidoData);
    }

    buscarPedidoId(id:number): Observable<any>{
      return this.http.get<any>(`${this.baseUrl}/pedidos/buscarPe/${id}`);
    }

    cambiarEstadoPedido(idPedido: number, idEstado: number) {
        return this.http.put(`${this.baseUrl}/pedidos/cambiarEstado/${idPedido}/${idEstado}`, {});
    }

    listarCategorias(): Observable<any[]>{
      return this.http.get<any[]>(`${this.baseUrl}/categorias/listarCategoria`);
    }

    listarProductosPorCategoria(idCategoria: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/productos/categoria/${idCategoria}`);
    }
}
