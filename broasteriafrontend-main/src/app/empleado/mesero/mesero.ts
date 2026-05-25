import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MeseroService } from '../../services/mesero.service';
import { EmpleadoService } from '../../services/empleado.service';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-mesero',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './mesero.html',
  styleUrls: ['./mesero.css'],
})
export class Mesero implements OnInit, OnDestroy {

  notificaciones: any[] = [];
  pedidosTodos: any[] = [];
  pedidosVisuales: any[] = [];
  isLoading: boolean = true;
  idsOcultos: Set<number> = new Set();
  idPedidoBuscar: number | null = null;
  ordenInvertido: boolean = false;

  //modales 
  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  modalAccion: 'cerrarSesion' | null = null;

  private updateSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private meseroService: MeseroService,
    private empleadoService: EmpleadoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.idsOcultos = this.meseroService.getIdsOcultos();
    this.isLoading = true;

    // Cargamos TODOS los pedidos del sistema
    this.cargarTodosLosPedidos(); 

    this.meseroService.notificacion$.subscribe((noti: any) => {
      this.mostrarNotificacion(noti);
    });

    this.updateSubscription = interval(1000).subscribe(() => {
      this.cargarTodosLosPedidos(false);
    });
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  // --- NOTIFICACIONES ---
  mostrarNotificacion(noti: any) {
    this.notificaciones.push(noti);
    this.cd.detectChanges();
    setTimeout(() => {
      this.cerrarNotificacion(noti.id);
      this.cd.detectChanges();
    }, 4000);
  }

  cerrarNotificacion(id: number) {
    const notiIndex = this.notificaciones.findIndex(n => n.id === id);
    
    if (notiIndex !== -1) {
      this.notificaciones[notiIndex].closing = true;
      this.cd.detectChanges(); 
      setTimeout(() => {
        this.notificaciones = this.notificaciones.filter((n) => n.id !== id);
        this.cd.detectChanges();
      }, 400); 
    }
  }
  // --- PEDIDOS ---
  cargarTodosLosPedidos(mostrarCarga: boolean = true) {
    if (mostrarCarga) this.isLoading = true;

    this.meseroService.listarTodosLosPedidos().subscribe({
      next: (data) => {
        this.pedidosTodos = data || [];
        this.actualizarVista(); 
        if (mostrarCarga) this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.isLoading = false;
        this.cd.detectChanges();
      },
    });
  }

  actualizarVista() {
    if (this.idPedidoBuscar) return;
    
    let filtrados = this.pedidosTodos.filter(
      (p) =>
        !this.idsOcultos.has(p.id) &&
        p.estado?.id != 4 && 
        p.estado?.id != 5 && 
        p.cliente?.id === 1 
    );

    filtrados.sort((a, b) => {
      const estadoA = a.estado?.id || 99;
      const estadoB = b.estado?.id || 99;
      if (estadoA !== estadoB) return estadoA - estadoB;
      return b.id - a.id;
    });

    if (this.ordenInvertido) filtrados.reverse();
    this.pedidosVisuales = [...filtrados];
  }

  ocultarPedido(id: number) {
    this.meseroService.agregarIdOculto(id);
    this.actualizarVista();
  }

  limpiarListos() {
    // Solo limpiamos de la vista los que son locales
    const listos = this.pedidosTodos.filter((p) => p.estado?.id == 3 && p.cliente?.id === 1);
    listos.forEach((p) => this.meseroService.agregarIdOculto(p.id));
    this.actualizarVista();
  }

  verTodos() {
    this.meseroService.limpiarIdsOcultos();
    this.idsOcultos.clear();
    this.idPedidoBuscar = null;
    this.actualizarVista();
  }

  cancelarBusqueda() {
    this.idPedidoBuscar = null;
    this.actualizarVista();
    this.cd.detectChanges();
  }

  RegresarOrden() {
    this.ordenInvertido = !this.ordenInvertido;
    this.actualizarVista();
  }

  buscarPedido(): void {
    const idBuscado = Number(this.idPedidoBuscar);

    if (!idBuscado || idBuscado <= 0) {
      this.cancelarBusqueda();
      return;
    }

    this.isLoading = true;

    // Buscamos en la lista
    const pedidoEncontrado = this.pedidosTodos.find(
      (p) => p.numeroPedidoCliente === idBuscado && p.cliente?.id === 1
    );

    if (pedidoEncontrado) {
      this.pedidosVisuales = [pedidoEncontrado];
    } else {
      alert(`Pedido local #${idBuscado.toString()} no encontrado.`);
      this.cancelarBusqueda();
    }

    this.isLoading = false;
    this.cd.detectChanges();
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

  // --- NAVEGACION ---
  RegisPedido() { this.router.navigate(['/registrarMesero']); }
  RegisPedidoObli(event: Event) { event.preventDefault(); this.router.navigate(['/registrarMesero']); }
  ListPedidos(event: Event) { event.preventDefault(); this.cancelarBusqueda(); }
}