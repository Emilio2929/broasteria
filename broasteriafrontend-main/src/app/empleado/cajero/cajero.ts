import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CajeroService } from '../../services/cajero.service';
import { Router } from '@angular/router';
import { EmpleadoService } from '../../services/empleado.service';

@Component({
  selector: 'app-cajero',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cajero.html',
  styleUrls: ['./cajero.css']
})
export class Cajero implements OnInit {
  
  //VARIABLES de estado
  numeroPedido: number | null = null;
  pedido: any = null;
  metodoPago = 1;
  tipoComprobante = 1;
  subtotal = 0;
  igv = 0;
  total = 0;

  // --- VARIABLES DEL MODAL ---
  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  modalAccion: 'cobrar' | 'cerrarSesion' | null = null;

  
  constructor(
    private cajeroService: CajeroService,
    private empleadoService: EmpleadoService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  // ABRIR MODAL
  mostrarAlerta(tipo: 'success' | 'error' | 'confirm', titulo: string, mensaje: string, accion?: 'cobrar' | 'cerrarSesion') {
    this.modalTipo = tipo;
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalAccion = accion || null;
    this.mostrarModal = true;
    this.cd.detectChanges();
  }

  // CERRAR MODAL
  cerrarModal() {
    this.mostrarModal = false;
    this.modalAccion = null;
    this.cd.detectChanges();
  }

  // EJECUTAR ACCIÓN DEL MODAL
  ejecutarAccion() {
    if (this.modalAccion === 'cobrar') {
      this.cerrarModal();
    }

    else if (this.modalAccion === 'cerrarSesion') {
      this.empleadoService.logoutBackend().subscribe({
        next: () => {
          sessionStorage.clear();
          this.router.navigate(['/empleado']);
        },
        error: () => {
          sessionStorage.clear();
          this.router.navigate(['/empleado']);
        }
      });
    }
  }

  ngOnInit(): void {
    const idGuardado = sessionStorage.getItem('idPedidoACobrar');
    if (idGuardado) {
      this.numeroPedido = Number(idGuardado);
      this.buscarPedido();
      sessionStorage.removeItem('idPedidoACobrar');
    }
  }

  buscarPedido() {
    this.cd.detectChanges();

    if (!this.numeroPedido) {
      this.mostrarAlerta('error', 'Error de Búsqueda', 'Ingrese un número de pedido válido');
      return;
    }
    
    this.cajeroService.buscarPedido(this.numeroPedido).subscribe({
      next: (data) => {
        if (data && data.estado && data.estado.id !== 3) {
          this.mostrarAlerta('error', 'Acción Denegada', `ERROR: El pedido #${this.numeroPedido} está en estado "${data.estado.nombre}". Solo se pueden cobrar pedidos en estado LISTO.`);
          this.pedido = null;
        } else if (data) {
          this.pedido = data;
          this.calcularTotales();
        } else {
          this.mostrarAlerta('error', 'Error de Pedido', 'Pedido no encontrado');
          this.pedido = null;
        }
        this.cd.detectChanges();
      },
      error: () => {
        this.mostrarAlerta('error', 'Error de Conexión', 'No se pudo contactar al servidor o el pedido no existe.');
        this.pedido = null;
        this.cd.detectChanges();
      }
    });
  }

  calcularTotales() {
    const totalConIgv = this.pedido.totalPedido || 0;
    this.total = totalConIgv;
    this.subtotal = +(totalConIgv / 1.18).toFixed(2);
    this.igv = +(totalConIgv - this.subtotal).toFixed(2);
  }

  cambiarTipoComprobante(event: any) {
    const tipoSeleccionado = Number(event.target.value);

    if (!this.pedido || !this.pedido.cliente) {
      return;
    }

    if (tipoSeleccionado === 2) { 
      if (this.pedido.cliente.id !== 1) {
         
          if (this.pedido.cliente.tipoDocumento.id !== 2) {
             this.pedido.cliente.numeroDocumento = '20000000001';
             this.pedido.cliente.nombre = 'Cliente Demo S.A.C.';
             this.pedido.cliente.tipoDocumento = { id: 2, nombreDocumento: 'RUC' };
          }
      } else {
          this.pedido.cliente.numeroDocumento = '20000000001';
          this.pedido.cliente.nombre = 'Cliente Demo S.A.C.';
          this.pedido.cliente.tipoDocumento = { id: 2, nombreDocumento: 'RUC' };
      }
    } else {
      if (this.pedido.cliente.id !== 1) {
          if(this.pedido.cliente.tipoDocumento.id !== 1) {
            this.pedido.cliente.numeroDocumento = '00000000';
            this.pedido.cliente.nombre = 'Cliente Web Varios';
            this.pedido.cliente.tipoDocumento = { id: 1, nombreDocumento: 'DNI' };
          }
      } else {
          this.pedido.cliente.numeroDocumento = '00000000';
          this.pedido.cliente.nombre = 'Local';
          this.pedido.cliente.tipoDocumento = { id: 1, nombreDocumento: 'DNI' };
      }
    }
    
    this.cd.detectChanges();
  }

  ListaPedidos(event: Event) {
    event.preventDefault();
    this.router.navigate(['/lista-pedidos']);
  }

  Facturar(event: Event) {
    event.preventDefault();
    this.router.navigate(['/cajero']);
  }

  imprimir() {
    if (!this.pedido) {
      this.mostrarAlerta('error', 'Impresión Fallida', 'Primero busque un pedido para imprimir.');
      return;
    }

    this.cajeroService.imprimirComprobante(
      this.pedido.id,
      this.tipoComprobante,
      this.metodoPago
    ).subscribe({
      next: (pdfUrl: string) => {
        console.log("PDF URL:", pdfUrl);
        window.open(pdfUrl, "_blank");

        // Despues de imprimir → cambiar a COMPLETADO
        this.cajeroService.cambiarEstadoPedido(this.pedido.id, 5).subscribe({
            next: () => {
              this.mostrarAlerta('success', 'Completado', 'El pedido fue marcado como COMPLETADO.');
              this.pedido = null;
              this.numeroPedido = null;
              this.cd.detectChanges();
            },
            error: (err) => {
              console.error("Error cambiando estado del pedido:", err);
              this.mostrarAlerta('error', 'Error', 'No se pudo actualizar el estado del pedido.');
            }
          });
      },
      error: (err) => {
        console.error("Error al imprimir:", err);
        this.mostrarAlerta('error', 'Error', 'No se pudo generar el comprobante.');
      }
    });
  }

  limpiar() {
    this.numeroPedido = null;
    this.pedido = null;
    this.cd.detectChanges();
  }

  CerrarSesion(event: Event) {
    event.preventDefault();
    this.mostrarAlerta(
      'confirm',
      'Confirmar Cierre',
      '¿Estás seguro de que deseas cerrar sesión?',
      'cerrarSesion'
    );
  }

}