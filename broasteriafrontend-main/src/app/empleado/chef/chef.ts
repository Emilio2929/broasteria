import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { EmpleadoService } from '../../services/empleado.service';
import { ChefService } from '../../services/chef.service'; 
import { Subscription } from 'rxjs';
import { PedidoRealtimeService } from '../../services/pedido-realtime.service';

@Component({
  selector: 'app-chef',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './chef.html',
  styleUrls: ['./chef.css']
})
export class Chef implements OnInit, OnDestroy {
  
  pedidos: any[] = [];
  isLoading: boolean = true;

  // Modal
  mostrarModalCompletar = false;
  pedidoSeleccionado: any = null;

  
  //modales 
  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  modalAccion: 'cerrarSesion' | null = null;

  private updateSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private chefService: ChefService,
    private empleadoService: EmpleadoService,
    private pedidoRealtime: PedidoRealtimeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.cargarPedidos();
    this.updateSubscription = this.pedidoRealtime.escuchar('chef').subscribe(() => {
      this.cargarPedidos(false);
    });
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  cargarPedidos(mostrarCarga: boolean = true) {
    if (mostrarCarga) this.isLoading = true;

    this.chefService.listarPedidosGlobales().subscribe({
      next: (data) => {
        this.pedidos = data.filter(p => p.estado.id === 1 || p.estado.id === 2);
        if (mostrarCarga) this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando pedidos', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  empezarCoccion(pedido: any) {
    
    this.chefService.cambiarEstadoPedido(pedido.id, 2).subscribe({
      next: () => {
        this.cargarPedidos(false); 
      },
      error: (e) => alert("Error al iniciar cocción")
    });
  }

  confirmarTerminar(pedido: any) {
    this.pedidoSeleccionado = pedido;
    this.mostrarModalCompletar = true;
    this.cdr.detectChanges(); 
  }

  cerrarModalCompletar() {
    this.mostrarModalCompletar = false;
    this.pedidoSeleccionado = null;
    this.cdr.detectChanges();
  }

  ejecutarTerminarPedido() {
    if (!this.pedidoSeleccionado) return;

    const id = this.pedidoSeleccionado.id;

    this.chefService.cambiarEstadoPedido(id, 3).subscribe({
      next: () => {
        this.cerrarModalCompletar();
        this.cargarPedidos(false); 
      },
      error: (e) => {
        alert("Error al finalizar pedido");
        this.cerrarModalCompletar();
      }
    });
  }

  chef(event?: Event) {
    event?.preventDefault(); 
    this.cargarPedidos();
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
}
