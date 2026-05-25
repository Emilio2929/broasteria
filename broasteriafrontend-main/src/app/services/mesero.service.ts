import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { Observable, Subject, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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

    // SONIDO GLOBAL
    private audio = new Audio('/assets/notificacionpedidolisto.mp3');
    private idsListosPrevios: Set<number> = new Set();
    private monitoreoSubscription: Subscription | undefined;
    private esPrimeraCarga: boolean = true;

    constructor(private http: HttpClient, private router: Router) {
        this.iniciarMonitoreoGlobal();
    }
    
    // --- LOGICA GLOBAL DE MONITOREO ---
    iniciarMonitoreoGlobal() {
        if (this.monitoreoSubscription) return;
        this.monitoreoSubscription = interval(1000).pipe(
            switchMap(() => this.listarPedidos()) 
        ).subscribe({
            next: (pedidos) => {
                this.verificarNuevosListos(pedidos);
            },
            error: (err) => console.error("Error en monitoreo global", err)
        });
    }

    private verificarNuevosListos(pedidos: any[]) {
        const listosActuales = pedidos.filter((p: any) => p.estado?.id == 3);
        const listosActualesIds = new Set(listosActuales.map((p: any) => p.id));

        if (this.esPrimeraCarga) {
            this.idsListosPrevios = listosActualesIds;
            this.esPrimeraCarga = false;
            return;
        }

        const esPantallaChef = this.router.url.includes('/chef');

        listosActuales.forEach((pedido: any) => {
            if (!this.idsListosPrevios.has(pedido.id)) {
                
                console.log(` Analizando Pedido #${pedido.id} para notificar:`, pedido);
                console.log(`   - Cliente ID: ${pedido.cliente?.id}`);
                console.log(`   - Empleado ID: ${pedido.empleado?.id}`);

                if (!esPantallaChef && pedido.cliente?.id === 1) {
                    console.log(" ¡Es pedido de Mesero! -> SONANDO ");
                    this.reproducirSonido();
                    this.enviarNotificacionVisual(pedido.id);
                } else {
                    console.log(" Es pedido Web o Chef -> SILENCIO ");
                }
            }
        });

        this.idsListosPrevios = listosActualesIds;
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