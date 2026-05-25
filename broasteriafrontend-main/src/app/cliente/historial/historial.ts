import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { Subscription, interval } from 'rxjs';
import { environment } from 'src/environments';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.css'],
})
export class Historial implements OnInit, OnDestroy {
  
  //Variables
  mostrarModalCancelar = false;
  pedidoACancelar: number | null = null; 
  idPedidoReal: number | null = null; 
  pedidos: any[] = []; 
  cargando: boolean = true; 

  private updateSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
 
    // DETECTAR SI VENIMOS DE UN PAGO EXITOSO NIUBIZ

    const limpiar = this.route.snapshot.queryParamMap.get('limpiar');

    if (limpiar === 'true') {
        console.log('Retorno de Niubiz detectado. Limpiando...');
        
        // Borrar el carrito visualmente
        localStorage.removeItem('carrito');
        
        // Notificar éxito
        this.notify('¡Pago Procesado!', 'Tu pedido ha sido enviado a cocina correctamente.', 'success', 5000);

        // LIMPIEZA SILENCIOSA
        window.history.replaceState({}, document.title, '/historial');
    }

    // CARGAR LA LISTA DE PEDIDOS 
    setTimeout(() => {
        this.cargarHistorial(true);
    }, 100);

    this.updateSubscription = interval(5000).subscribe(() => {
        this.cargarHistorial(false);
    });
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  cargarHistorial(mostrarLoading: boolean = false) {
    const clienteStr = localStorage.getItem('cliente'); 

    if (!clienteStr) {
      if (this.updateSubscription) this.updateSubscription.unsubscribe();
      this.router.navigate(['/ini-cliente']);
      return;
    }

    const cliente = JSON.parse(clienteStr);
    
    if(mostrarLoading) this.cargando = true;

    this.http.get<any[]>(`${environment.apiUrl}/pedidos/historial/${cliente.id}`).subscribe({
      next: (data) => {
        // Ordenar por fecha (más reciente primero)
        this.pedidos = data.sort((a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime());
        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.cargando = false;
        
        // Solo redirigir si es error de autenticación real
        if(err.status === 403 || err.status === 401) {
             console.warn('Sesión expirada o inválida. Redirigiendo...');
             localStorage.clear();
             this.router.navigate(['/ini-cliente']);
        }
      },
    });
  }

  // Helpers para Estilos
  getClassEstado(nombre: string): string {
    switch (nombre) {
      case 'Pendiente': return 'status-pendiente';
      case 'Preparando': return 'status-preparando';
      case 'Listo': return 'status-listo';
      case 'Completado': return 'status-completado';
      case 'Cancelado': return 'status-cancelado';
      case 'En camino': return 'status-encamino';
      default: return 'status-pendiente';
    }
  }

  getIconEstado(nombre: string): string {
    switch (nombre) {
      case 'Pendiente': return 'bi-hourglass-split';
      case 'Preparando': return 'bi-fire';
      case 'Listo': return 'bi-check-circle-fill';
      case 'Completado': return 'bi-bag-check-fill';
      case 'Cancelado': return 'bi-x-octagon-fill';
      case 'En camino': return 'bi-geo-alt-fill';
      default: return 'bi-circle';
    }
  }

  confirmarCancelacion(idPedido: number) {
    const pedido = this.pedidos.find((p) => p.id === idPedido);
    this.pedidoACancelar = pedido ? pedido.numeroPedidoCliente : idPedido; 
    this.idPedidoReal = idPedido; 
    this.mostrarModalCancelar = true;
  }

  cerrarModalCancelacion() {
    this.mostrarModalCancelar = false;
    this.pedidoACancelar = null;
    this.idPedidoReal = null;
  }

  ejecutarCancelacionPedido() {
    if (this.idPedidoReal === null) return;

    const idPedido = this.idPedidoReal;
    const pedido = this.pedidos.find((p) => p.id === idPedido);
    const numeroCliente = pedido ? pedido.numeroPedidoCliente : idPedido;

    this.cerrarModalCancelacion();

    this.http.put(`${environment.apiUrl}/pedidos/cancelar/${idPedido}`, {}).subscribe({
      next: () => {
        this.notify('Pedido Cancelado', `El pedido #${numeroCliente} ha sido cancelado.`, 'success', 2500);
        this.cargarHistorial(true);
      },
      error: (err) => {
        console.error('Error al cancelar:', err);
        this.notify('Error', 'No se pudo cancelar el pedido.', 'error', 3000);
      },
    });
  }

  // --- Navegación ---
  inicio(event: Event) { event.preventDefault(); this.router.navigate(['/']); }
  carrito(event: Event) { event.preventDefault(); this.router.navigate(['/carrito']); }
  historial(event: Event) { event.preventDefault(); this.router.navigate(['/historial']); }
  abrirPerfil() { this.router.navigate(['/infocliente']); }

  // --- Notificaciones ---
  private notify(title: string, message = '', type: 'success' | 'error' | 'warn' = 'success', timeout = 1800) {
    let container = document.querySelector('.app-toasts') as HTMLElement;
    if (!container) {
      container = document.createElement('div');
      container.className = 'app-toasts';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    toast.innerHTML = `
      <div class="icon">${type === 'success' ? '✓' : type === 'warn' ? '!' : '×'}</div>
      <div>
        <p class="title">${title}</p>
        ${message ? `<p class="msg">${message}</p>` : ''}
      </div>
      <button class="close">×</button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const hide = () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 200);
    };
    toast.querySelector('.close')?.addEventListener('click', hide);
    setTimeout(hide, timeout);
  }
}