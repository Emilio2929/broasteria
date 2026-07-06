import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core'; 
import { Router } from '@angular/router';
import { MeseroService } from '../../../services/mesero.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; 
import { EmpleadoService } from '../../../services/empleado.service';


@Component({
  selector: 'app-registrar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-pedido.html',
  styleUrl: './registrar-pedido.css',
})
export class RegistrarPedido implements OnInit, OnDestroy {
  
  // Categorias y Productos
  categorias: any[] = [];
  productos: any[] = [];
  categoriaSeleccionada: number | null = null;
  
  // Pedido Temporal
  pedidoTemporal: any[] = [];
  detallePedido: string = "";
  
  notificaciones: any[] = []; 

  //modales 
  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  modalAccion: 'cerrarSesion' | null = null;

  // Suscripcion
  private notificacionSub: Subscription | undefined;

  constructor(
    private router : Router,
    private meseroService : MeseroService,
    private empleadoService: EmpleadoService,
    private cdr: ChangeDetectorRef
    
  ) {}

  ngOnInit() {
    this.cargarCategorias();

    // --- ESCUCHAR NOTIFICACIONES ---
    this.notificacionSub = this.meseroService.notificacion$.subscribe((noti: any) => {
        this.mostrarNotificacion(noti);
    });
  }

  ngOnDestroy() {
    if (this.notificacionSub) {
        this.notificacionSub.unsubscribe();
    }
  }

  mostrarNotificacion(noti: any) {
    this.notificaciones.push(noti);
    this.cdr.detectChanges(); 
    
    setTimeout(() => {
      this.cerrarNotificacion(noti.id);
    }, 4000);
  }

  cerrarNotificacion(id: number) {
    const notiIndex = this.notificaciones.findIndex(n => n.id === id);

    if (notiIndex !== -1) {
      this.notificaciones[notiIndex].closing = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.notificaciones = this.notificaciones.filter(n => n.id !== id);
        this.cdr.detectChanges();
      }, 400);
    }
  }

  cargarCategorias(): void {
    this.meseroService.listarCategorias().subscribe({
      next: (data: any) => { 
        console.log('Categorías recibidas:', data);
        this.categorias = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando categorías', err)
    });
  }

  cargarProductos(idCategoria: number): void {
    console.log('Cargando productos de categoría:', idCategoria);
    this.meseroService.listarProductosPorCategoria(idCategoria).subscribe({
      next: (data: any) => {
        console.log('Productos recibidos:', data);
        this.productos = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando productos', err)
    });
  }

  agregarAlPedido(producto: any): void {
      const id = producto.id;
      
      if (producto.stock <= 0) {
          this.mostrarNotificacion({ 
              mensaje: `El producto "${producto.nombre}" está agotado (Stock: 0).` 
          });
          return; 
      }

      const itemExistente = this.pedidoTemporal.find(
        p => (p.ID_Producto ?? p.id ?? p.idProducto) === id
      );

      if (itemExistente) {
          if (itemExistente.cantidad < itemExistente.stock) {
              itemExistente.cantidad++;
          } else {
              this.mostrarNotificacion({ 
                  mensaje: `Stock limitado: Ya tienes ${itemExistente.stock} unidades de ${itemExistente.nombre} en la orden.` 
              });
          }
      } else {
        this.pedidoTemporal.push({ 
            ...producto, 
            cantidad: 1, 
            stock: producto.stock
        });
      }
      console.log('Pedido temporal:', this.pedidoTemporal);
  }
 
  aumentarCantidad(index: number): void {
      const item = this.pedidoTemporal[index];
      if (item.cantidad < item.stock) {
          item.cantidad++;
      } else {
          this.mostrarNotificacion({ 
              mensaje: `Stock limitado: Solo hay ${item.stock} unidades de ${item.nombre}.` 
          });
      }
  }

  disminuirCantidad(index: number): void {
    if (this.pedidoTemporal[index].cantidad > 1) {
      this.pedidoTemporal[index].cantidad--;
    }
  }

  calcularTotal(): number {
    return this.pedidoTemporal.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
    }, 0);
  }

  eliminarDelPedido(index: number): void {
    this.pedidoTemporal.splice(index, 1);
  }

  

  enviarPedido(): void {

    const pedidoData = {
      idCliente: 2, 
      idEmpleado: 1,   
      detalle: this.detallePedido,
      items: this.pedidoTemporal.map((p: any) => ({
        idProducto: p.id || p.ID_Producto,
        cantidad: p.cantidad,
        detalleExtra: this.detallePedido || ''
      }))
    };

    this.pedidoTemporal = [];
    this.detallePedido = "";
    this.productos = []; 

    this.meseroService.crearPedidoMesero(pedidoData).subscribe({
      next: (res: any) => {
        this.mostrarNotificacion({ 
          mensaje: '¡Pedido enviado correctamente!' 
        });

        this.pedidoTemporal = [];
        this.detallePedido = "";
        this.productos = []; 
      },
      error: (err: any) => {
        console.error('Error al enviar el pedido:', err);
        this.mostrarNotificacion({ 
          mensaje: 'Error al enviar el pedido.' 
        });
      }
    });
  }

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

  // Navegacion
  RegisPedidoObli(event: Event){event.preventDefault(); this.router.navigate(['/registrarMesero'])}
  ListPedidos(event: Event){event.preventDefault(); this.router.navigate(['/mesero'])}

}
