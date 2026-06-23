import { environment } from 'src/environments';
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service'; 

declare var VisanetCheckout: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.html',
  styleUrls: ['./carrito.css'],
})
export class Carrito implements OnInit {

  carrito: any[] = [];
  total = 0;
  guardando = false;

  mostrarModalVaciar = false;
  mostrarModalPago = false;

  mostrarModalNuevaDireccion = false; 

  nuevaDireccionInput: string = "";

  tiposPago: any[] = [];
  tiposComprobante: any[] = [];

  pago: any = { tipoPago: '', tipoComprobante: '' };
  idPedidoTemporal: number = 0;

  direccionesGuardadas: string[] = [];
  direccionSeleccionada: string = "";
  referenciaEntrega: string = "";

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private clienteService: ClienteService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    setTimeout(() => this.cargarCarrito(), 100);
    this.cargarDireccionesCliente();
  }

  // CARGAR DIRECCIONES DEL CLIENTE
  cargarDireccionesCliente() {
    const cliente = JSON.parse(localStorage.getItem('cliente') || '{}');

    this.direccionesGuardadas = [
      cliente.direccion || "Sin dirección registrada",
      "Añadir nueva dirección..."
    ];
  }

  agregarNuevaDireccion() {
    this.nuevaDireccionInput = ""; 
    this.mostrarModalNuevaDireccion = true;
 }
  confirmarNuevaDireccion() {
    const nueva = this.nuevaDireccionInput;

    if (!nueva || nueva.trim() === "") {
        this.notify("Dirección inválida", "Debe escribir una dirección.", "warn");
        return;
    }

    this.direccionesGuardadas.unshift(nueva);
    this.direccionSeleccionada = nueva;

    this.mostrarModalNuevaDireccion = false;
    this.notify("Dirección añadida", "", "success");
  }
  cerrarModalNuevaDireccion() {
    this.mostrarModalNuevaDireccion = false;
}

  // CARRITO

  cargarCarrito() {
    this.carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
    .map((p: any) => ({
      ...p,
      detalleExtra: p.detalleExtra || ''
    }));
    this.calcularTotal();
    this.cdr.detectChanges();
  }

  calcularTotal() {
    this.total = this.carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  }

  eliminarProducto(index: number) {
    this.carrito.splice(index, 1);
    this.actualizarStorage();
    this.notify('Producto eliminado', '', 'warn', 1500);
  }

  actualizarStorage() {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
    this.calcularTotal();
  }

  aumentarCantidad(index: number) {
    this.carrito[index].cantidad++;
    this.actualizarStorage();
  }

  disminuirCantidad(index: number) {
    if (this.carrito[index].cantidad > 1) {
      this.carrito[index].cantidad--;
      this.actualizarStorage();
    }
  }

  // PAGO

  realizarPedido() {
    const cliente = JSON.parse(localStorage.getItem('cliente') || '{}');
    if (!cliente.id) {
      this.notify('Inicia sesión', 'Necesitas iniciar sesión para hacer tu pedido.', 'warn', 2500);
      return;
    }

    if (!this.carrito.length) {
      this.notify('Carrito vacío', 'Agrega productos para continuar.', 'warn', 2200);
      return;
    }

    this.mostrarModalPago = true;
    this.cargarTipos();
  }

  cargarTipos() {
    this.http.get(environment.apiUrl + '/tipos/comprobantes').subscribe({
      next: (res: any) => {
        const tipos = Array.isArray(res) ? res : [];
        this.tiposComprobante = Array.from(
          new Map(
            tipos.map((tipo: any) => [
              String(tipo.nombreTipoComprobante || '').trim().toLowerCase(),
              tipo
            ])
          ).values()
        );
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error tipos/comprobantes', err)
    });
  }

  // VALIDACIÓN COMPLETA ANTES DE PAGAR

  confirmarPago() {

    if (!this.direccionSeleccionada || this.direccionSeleccionada === "Añadir nueva dirección...") {
      this.notify("Falta dirección", "Selecciona o ingresa una dirección.", "warn");
      return;
    }

    if (!this.referenciaEntrega || this.referenciaEntrega.trim() === "") {
      this.notify("Falta referencia", "Ingresa una referencia de entrega.", "warn");
      return;
    }

    if (!this.pago.tipoPago || !this.pago.tipoComprobante) {
      this.notify('Faltan datos', 'Selecciona método de pago y comprobante.', 'warn');
      return;
    }

    const tipoPagoId = Number(this.pago.tipoPago);

    if (tipoPagoId === 1) {
      this.enviarCompraBackend(null, false);
      return;
    }

    if (tipoPagoId === 2) {
      this.enviarCompraBackend(null, true);
    }
  }

  // ENVIAR ORDEN AL BACKEND

  enviarCompraBackend(tokenNiubiz: string | null = null, soloCrearPendiente: boolean = false) {
    const cliente = JSON.parse(localStorage.getItem('cliente') || '{}');

    const compraRequest = {
      idCliente: cliente.id,
      idEmpleado: 1,
      items: this.carrito.map((p: any) => ({
        idProducto: p.idProducto || p.id,
        cantidad: p.cantidad,
        detalleExtra: p.detalleExtra || ''
      })),
      idTipoPago: Number(this.pago.tipoPago),
      idTipoComprobante: Number(this.pago.tipoComprobante),
      direccionEntrega: this.direccionSeleccionada,
      referenciaEntrega: this.referenciaEntrega
    };

    this.guardando = true;

    this.http.post(environment.apiUrl + '/pedidos/crear', compraRequest).subscribe({
      next: (res: any) => {

        this.idPedidoTemporal = res.id || res.idPedido;

        if (soloCrearPendiente) {
          this.abrirPasarelaNiubiz();
        } else {
          this.guardando = false;
          this.finalizarFlow('success', '¡Pedido Recibido!', 'Tu orden ha sido enviada a cocina (Pago Efectivo).');
        }

      },
      error: (err) => {
        this.guardando = false;
        this.notify('No hay stock suficiente', 'realize otro pedido por favor');
      }
    });
  }

  // NIUBIZ

  abrirPasarelaNiubiz() {
    this.mostrarModalPago = false;

    this.clienteService.iniciarPagoNiubiz(this.total).subscribe(
      (response) => {
        this.configurarModalNiubiz(response.sessionKey, response.merchantId);
      },
      () => {
        this.guardando = false;
        this.notify('Error', 'No se pudo conectar con la pasarela.', 'error');
      }
    );
  }

  configurarModalNiubiz(sessionKey: string, merchantId: string) {
    VisanetCheckout.configure({
      sessiontoken: sessionKey,
      channel: 'web',
      merchantid: merchantId,
      purchasenumber: this.idPedidoTemporal,
      amount: this.total,
      expirationminutes: '20',
      timeouturl: 'about:blank',

      merchantlogo: 'https://i.ibb.co/Q7WJB9km/logofastfood.png',

      action: `${environment.apiUrl}/pagos/niubiz/finalizar?idPedidoPropio=${this.idPedidoTemporal}`,

      complete: () => {
        this.carrito = [];
        localStorage.removeItem('carrito');
      }
    });

    VisanetCheckout.open();
  }

  // FINAL FLOW
  private finalizarFlow(tipo: 'success' | 'warn' | 'error', titulo: string, mensaje: string) {
    this.notify(titulo, mensaje, tipo, 3000);
    this.mostrarModalPago = false;
    this.carrito = [];
    localStorage.removeItem('carrito');
    this.router.navigate(['/historial']);
  }

  cerrarModalPago() { this.mostrarModalPago = false; }
  vaciarCarrito() { this.mostrarModalVaciar = true; }
  cerrarModalVaciar() { this.mostrarModalVaciar = false; }

  confirmarVaciarCarrito() {
    this.mostrarModalVaciar = false;
    this.carrito = [];
    localStorage.removeItem('carrito');
    this.cargarCarrito();
    this.notify('Carrito vaciado', '', 'success', 2000);
  }

  inicio(e: Event){ e.preventDefault(); this.router.navigate(['/menu']); }
  carritoLink(e: Event){ e.preventDefault(); this.router.navigate(['/carrito']); }
  historial(e: Event){ e.preventDefault(); this.router.navigate(['/historial']); }
  abrirPerfil(){ this.router.navigate(['/infocliente']); }

  // SISTEMA DE TOASTS

  public notify(title: string, message = '', type: 'success' | 'error' | 'warn' = 'success', timeout = 1800){
    let container = document.querySelector('.app-toasts') as HTMLElement;
    if (!container){
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
        <p class="msg">${message}</p>
      </div>
    `;
    
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 200);
    }, timeout);
  }

}
