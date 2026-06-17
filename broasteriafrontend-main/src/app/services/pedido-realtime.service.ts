import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';
import { environment } from 'src/environments';

export interface PedidoEvento {
  tipo: string;
  pedidoId: number;
  estadoId?: number;
  clienteId?: number;
  pedidoLocal?: boolean;
  fecha?: string;
}

interface RealtimeConnection {
  socket: WebSocket;
  role: string;
  clienteId?: number;
  reconnectTimer?: ReturnType<typeof setTimeout>;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoRealtimeService implements OnDestroy {
  private eventosSubject = new Subject<PedidoEvento>();
  private conexiones = new Map<string, RealtimeConnection>();

  eventos$ = this.eventosSubject.asObservable();

  constructor(private zone: NgZone) {}

  escuchar(role: string, clienteId?: number): Observable<PedidoEvento> {
    this.conectar(role, clienteId);

    return this.eventos$.pipe(
      filter((evento) => this.coincideConRol(evento, role, clienteId))
    );
  }

  ngOnDestroy(): void {
    this.conexiones.forEach((conexion) => {
      if (conexion.reconnectTimer) {
        clearTimeout(conexion.reconnectTimer);
      }
      conexion.socket.close();
    });
    this.conexiones.clear();
  }

  private conectar(role: string, clienteId?: number): void {
    const key = this.getKey(role, clienteId);
    const existente = this.conexiones.get(key);

    if (existente && existente.socket.readyState !== WebSocket.CLOSED) {
      return;
    }

    const socket = new WebSocket(this.crearUrl(role, clienteId));
    const conexion: RealtimeConnection = { socket, role, clienteId };
    this.conexiones.set(key, conexion);

    socket.onmessage = (message) => {
      this.zone.run(() => {
        this.eventosSubject.next(JSON.parse(message.data) as PedidoEvento);
      });
    };

    socket.onclose = () => {
      const actual = this.conexiones.get(key);
      if (!actual || actual.socket !== socket) {
        return;
      }

      actual.reconnectTimer = setTimeout(() => {
        this.conexiones.delete(key);
        this.conectar(role, clienteId);
      }, 3000);
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  private crearUrl(role: string, clienteId?: number): string {
    const params = new URLSearchParams({ role });

    if (clienteId !== undefined) {
      params.set('clienteId', clienteId.toString());
    }

    return `${environment.wsUrl}/ws/pedidos?${params.toString()}`;
  }

  private coincideConRol(evento: PedidoEvento, role: string, clienteId?: number): boolean {
    switch (role) {
      case 'chef':
      case 'cajero':
        return true;
      case 'mesero':
        return evento.pedidoLocal === true;
      case 'delivery':
        return evento.pedidoLocal !== true;
      case 'cliente':
        return clienteId !== undefined && evento.clienteId === clienteId;
      default:
        return true;
    }
  }

  private getKey(role: string, clienteId?: number): string {
    return `${role}:${clienteId ?? 'all'}`;
  }
}
