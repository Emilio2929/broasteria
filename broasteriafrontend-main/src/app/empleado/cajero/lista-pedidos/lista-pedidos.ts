import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CajeroService } from '../../../services/cajero.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { EmpleadoService } from '../../../services/empleado.service';

@Component({
  selector: 'app-lista-pedidos',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './lista-pedidos.html',
  styleUrls: ['./lista-pedidos.css']
})
export class ListaPedidos implements OnInit, OnDestroy {
  
  pedidos: any[] = [];
  isLoading = true;
  private updateSubscription: Subscription | undefined;

  
  //modales 
  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  

  modalAccion: 'cerrarSesion' | 'confirmarPago' | 'entregarPedido' | null = null;
  pedidoSeleccionado: any = null;

  constructor(
    private cajeroService: CajeroService, 
    private router: Router,
    private cd: ChangeDetectorRef,
    private empleadoService: EmpleadoService
    
  ) {}

  ngOnInit() {
    this.cargarPedidos(true);
    this.updateSubscription = interval(1000).subscribe(() => {
      this.cargarPedidos(false);
    });
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  cargarPedidos(mostrarSpinner: boolean = true) {
    if (mostrarSpinner) this.isLoading = true;
    
    this.cajeroService.listarPedidos().subscribe({
      next: (data) => {
        this.pedidos = data || [];
        this.pedidos.sort((a: any, b: any) => {
            if (a.estado?.id === 3 && b.estado?.id !== 3) return -1;
            if (a.estado?.id !== 3 && b.estado?.id === 3) return 1;
            return b.id - a.id;
        });
        if (mostrarSpinner) this.isLoading = false;
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error("Error cargando pedidos:", err);
        if (mostrarSpinner) this.isLoading = false;
        this.cd.detectChanges(); 
      }
    });
  }

  irACobrar(idPedido: number) {
    sessionStorage.setItem('idPedidoACobrar', idPedido.toString());
    this.router.navigate(['/cajero']);
  }

  confirmarPagoEfectivo(p: any) {
    this.pedidoSeleccionado = p;
    this.modalAccion = 'confirmarPago';
    this.modalTitulo = 'Confirmar Pago';
    this.modalMensaje = `¿Confirmas que el cliente pagó S/ ${p.totalPedido} en efectivo?`;
    this.modalTipo = 'confirm';
    this.mostrarModal = true;
  }
  
  entregarPedidoWeb(p: any) {
    this.pedidoSeleccionado = p;
    this.modalAccion = 'entregarPedido';
    this.modalTitulo = 'Confirmar Entrega';
    this.modalMensaje = 'Pedido ya pagado. ¿Marcar como entregado?';
    this.modalTipo = 'confirm';
    this.mostrarModal = true;
  }

  esLocal(p: any): boolean {
    return p.cliente?.id === 1;
  }

  esWebEfectivo(p: any): boolean {
    if (this.esLocal(p)) return false;
    if (p.pagos && p.pagos.length > 0) {
        const ultimoPago = p.pagos[p.pagos.length - 1];
        const metodo = ultimoPago.tipoPago?.nombreTipoPago?.toLowerCase() || '';
        return metodo === 'efectivo';
    }
    return false;
  }

  esWebPagadoOnline(p: any): boolean {
    if (this.esLocal(p)) return false;

    if (p.pagos && p.pagos.length > 0) {
        const ultimoPago = p.pagos[p.pagos.length - 1];
        const metodo = ultimoPago.tipoPago?.nombreTipoPago?.toLowerCase() || '';
        return metodo !== 'efectivo';
    }
    return false;
  }


  //FUNCIONES DE MODAL

  mostrarAlertaCerrarSesion() {
    this.modalTipo = 'confirm';
    this.modalTitulo = 'Confirmar Cierre';
    this.modalMensaje = '¿Estás seguro de que deseas cerrar sesión?';
    this.modalAccion = 'cerrarSesion';
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modalAccion = null;
  }

  ejecutarAccion() {
    if (this.modalAccion === 'cerrarSesion') {
      if ((this.empleadoService as any).logoutBackend) {
         (this.empleadoService as any).logoutBackend().subscribe({
           next: () => this.finalizarLogout(),
           error: () => this.finalizarLogout()
         });
      } else {
         this.finalizarLogout();
      }
    } 
    else if (this.modalAccion === 'confirmarPago' && this.pedidoSeleccionado) {
       this.cajeroService.cambiarEstadoPedido(this.pedidoSeleccionado.id, 5).subscribe({
        next: () => {
          this.cargarPedidos(false);
          this.cerrarModal();
        },
        error: () => this.cerrarModal()
      });
    } 
    else if (this.modalAccion === 'entregarPedido' && this.pedidoSeleccionado) {
       this.cajeroService.cambiarEstadoPedido(this.pedidoSeleccionado.id, 5).subscribe({
        next: () => {
          this.cargarPedidos(false);
          this.cerrarModal();
        },
        error: () => this.cerrarModal()
      });
    }
  }

  finalizarLogout() {
    this.empleadoService.logout();
    this.cerrarModal();
    this.router.navigate(['/empleado']);
  }

  CerrarSesion(event: Event) {
    event.preventDefault();
    this.mostrarAlertaCerrarSesion();
  }

  

  // --- Menu ---
  ListaPedidos(e:Event){ e.preventDefault(); this.cargarPedidos(false); }
  Facturar(e:Event){ e.preventDefault(); this.router.navigate(['/cajero']); }
}