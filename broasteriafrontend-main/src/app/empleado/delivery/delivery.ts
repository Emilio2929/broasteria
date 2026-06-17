import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PedidoRealtimeService } from '../../services/pedido-realtime.service';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './delivery.html',
  styleUrls: ['./delivery.css'],
})
export class Delivery implements OnInit, OnDestroy {

  notificaciones: any[] = [];
  private notifId = 1;

  pedidos: any[] = [];
  cargando = true;
  private updateSubscription: Subscription | undefined;

  sidebarAbierto: boolean = false;
  isMobile: boolean = false;

  mostrarModal: boolean = false;
  documentoIngresado: string = '';
  pedidoSeleccionado: any = null;

  modalIcono: 'success' | 'error' | 'warning' = 'success';
  modalTitulo: string = '';
  modalMensaje: string = '';
  isModalVisible: boolean = false;

  constructor(
    private router: Router,
    private deliveryService: DeliveryService,
    private pedidoRealtime: PedidoRealtimeService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 768;
    window.onresize = () => {
      this.isMobile = window.innerWidth < 768;
    };

    this.cargarPedidos();

    this.updateSubscription = this.pedidoRealtime.escuchar('delivery').subscribe(() => {
      this.cargarPedidos(false);
    });
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) this.updateSubscription.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  mostrarNotificacion(mensaje: string) {
    const id = this.notifId++;
    const noti = { id, mensaje, closing: false };
    this.notificaciones.unshift(noti);
    this.cd.detectChanges();

    setTimeout(() => this.cerrarNotificacion(id), 3000);
  }

  cerrarNotificacion(id: number) {
    const index = this.notificaciones.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notificaciones[index].closing = true;
      this.cd.detectChanges();

      setTimeout(() => {
        this.notificaciones = this.notificaciones.filter(n => n.id !== id);
        this.cd.detectChanges();
      }, 350);
    }
  }

  // Modal de Mensaje
  mostrarModalMensaje(
    icono: 'success' | 'error' | 'warning',
    titulo: string,
    mensaje: string
  ) {
    this.modalIcono = icono;
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.isModalVisible = true;
  }

  cerrarModalMensaje() {
    this.isModalVisible = false;
  }

  cargarPedidos(mostrarCarga: boolean = true) {
    if (mostrarCarga) this.cargando = true;

    this.deliveryService.getPedidosDelivery().subscribe({
      next: (data) => {

        this.pedidos = (data || [])
          .map(p => this.normalizarPedido(p))
          .filter(p => p.cliente?.id !== 1);

        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.mostrarNotificacion("Error al cargar pedidos");
      }
    });
  }

  CargarPedidos(event?: Event) {
    if (event) event.preventDefault();
    this.cargarPedidos();
  }

  enCamino(idPedido: number) {
    this.deliveryService.marcarEnCamino(idPedido).subscribe({
      next: (pedidoActualizado) => {
        this.mostrarNotificacion("Pedido marcado como EN CAMINO");
        this.pedidos = this.pedidos.map(pedido =>
          pedido.id === pedidoActualizado.id ? this.normalizarPedido(pedidoActualizado) : pedido
        );
        this.cd.detectChanges();
      },
      error: () => {
        this.mostrarNotificacion("Error al marcar en camino");
        this.cd.detectChanges();
      }
    });
  }

  abrirModalDocumento(pedido: any) {
    this.pedidoSeleccionado = pedido;
    this.documentoIngresado = '';
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.documentoIngresado = '';
  }

  confirmarDocumento() {
    if (!this.esDocumentoValido(this.documentoIngresado)) {
      this.mostrarModalMensaje(
        'warning',
        'Documento Inválido',
        "Ingrese un DNI válido (8 dígitos) o un CE válido (9–12 caracteres)."
      );
      this.cd.detectChanges();
      return;
    }

    this.deliveryService.validarDNIEntrega(
      this.pedidoSeleccionado.id,
      this.documentoIngresado
    ).subscribe({
      next: (pedidoActualizado) => {
        this.mostrarModalMensaje(
          'success',
          'Éxito',
          "Documento correcto. Pedido completado."
        );
        this.mostrarModal = false;
        this.pedidos = this.pedidos.filter(pedido => pedido.id !== pedidoActualizado.id);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.mostrarModalMensaje(
          'error',
          'Error',
          err.error || "El documento no coincide."
        );
        this.cd.detectChanges();
      }
    });
  }

  esDocumentoValido(doc: string): boolean {
    if (!doc) return false;

    const dniRegex = /^[0-9]{8}$/;
    const ceRegex = /^[A-Za-z0-9]{9,12}$/;

    return dniRegex.test(doc) || ceRegex.test(doc);
  }

  private normalizarPedido(pedido: any) {
    return {
      ...pedido,
      metodoPago: pedido.metodoPago || 1
    };
  }

  CerrarSesion(event: Event) {
    event.preventDefault();
    localStorage.clear();
    this.router.navigate(['/empleado']);
  }
}
