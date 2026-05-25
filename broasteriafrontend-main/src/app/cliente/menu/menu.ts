import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';

/* --- NUEVO --- */
import { GerenteService } from '../../services/gerente.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css'],
})
export class Menu implements OnInit, OnDestroy {
  showScrollButton = false;
  
  
  mostrarModalLogin = false; 
  
  //estructuras para stock y precio
  productStockMap: { [id: number]: number } = {};
  productPriceMap: { [id: number]: number } = {};

  originalPriceMap: { [id: number]: number } = {
    1: 10, 2: 9, 3: 13, 4: 12,
    5: 6, 6: 8, 7: 13, 8: 6,
    9: 10, 10: 12,
    11: 4, 12: 4, 13: 1.5, 14: 1,
    15: 3, 16: 3, 17: 3, 18: 3, 19: 6.5, 20: 6.5
  };

  constructor(
    private router: Router,
    private clienteService: ClienteService,
    private gerenteService: GerenteService
  ) {}

  ngOnInit() {
    this.fetchProductsData();
  }

  ngOnDestroy(): void {
  }

  /* --- NUEVO --- */
  fetchProductsData() {
    this.gerenteService.obtenerProductos().subscribe({
      next: (productos: any[]) => {
        if (!productos || !Array.isArray(productos)) return;
        const stockMap: { [id: number]: number } = {};
        const priceMap: { [id: number]: number } = {};

        productos.forEach(p => {
          const id = p.id || p.idPro;
          const stock = typeof p.stock === 'number' ? p.stock : (p.stock ? Number(p.stock) : 0);
          const precio = typeof p.precio === 'number' ? p.precio : (p.precio ? Number(p.precio) : undefined);

          if (id != null) {
            stockMap[id] = isNaN(stock) ? 0 : stock;
            if (!isNaN(precio as number) && precio !== undefined) priceMap[id] = Number(precio);
          }
        });

        this.productStockMap = stockMap;
        this.productPriceMap = priceMap;
      },
      error: (err) => {
        console.error('Error al obtener stocks/precios para el menú:', err);
      }
    });
  }

  /*NUEVO: función usada en la plantilla para mostrar precio formateado*/
  getPrice(idProducto: number): string {
    const precioBackend = this.productPriceMap[idProducto];
    const precio = (typeof precioBackend === 'number') ? precioBackend : this.originalPriceMap[idProducto];

    return `S/ ${Number(precio || 0).toFixed(2)}`;
  }

  isOutOfStock(idProducto: number) {
    return (this.productStockMap[idProducto] === 0);
  }

  agregarAlCarrito(event: MouseEvent, idProducto: number, nombre: string, precio: number, imagen: string) {

    if (!this.clienteService.estaLogueado()) {
      this.mostrarModalLogin = true;
      return; 
    }

    const stockActual = this.productStockMap[idProducto];
    if (stockActual === 0) {
      this.notify('Producto agotado', nombre, 'error', 1800);
      return;
    }

    const precioActualBackend = this.productPriceMap[idProducto];
    const precioActual = (typeof precioActualBackend === 'number') ? precioActualBackend : (this.originalPriceMap[idProducto] || precio);

    const cardWrapper = event.currentTarget as HTMLElement; 
    const cardElement = cardWrapper.querySelector('.card') as HTMLElement;

    if (cardElement) {
      cardElement.classList.add('card-clicked');  
      setTimeout(() => {
        cardElement.classList.remove('card-clicked');
      }, 300);
    }
    
    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const existente = carrito.find((p: any) => p.idProducto === idProducto);

    if (existente) {
      existente.cantidad += 1;

      existente.precio = precioActual;
    } else {
      carrito.push({ idProducto, nombre, precio: precioActual, imagen, cantidad: 1 });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    this.notify('Agregado al carrito', nombre, 'success');
  }

  //RUTAS
  inicio(event: Event) { 
    event.preventDefault(); 
    this.router.navigate(['/']); 
  }

  carrito(event: Event) { 
    event.preventDefault(); 
    if (this.clienteService.estaLogueado()) {
      this.router.navigate(['/carrito']); 
    } else {
      this.mostrarModalLogin = true;
    }
  }

  historial(event: Event) { 
  event.preventDefault(); 
  console.log("Estado de login:", this.clienteService.estaLogueado());

  if (this.clienteService.estaLogueado()) {
    this.router.navigate(['/historial']); 
  } else {
    this.mostrarModalLogin = true;
  }
}

  abrirPerfil() { 
    if (this.clienteService.estaLogueado()) {
      this.router.navigate(['/infocliente']); 
    } else {
      this.mostrarModalLogin = true;
    }
  }

  // --- METODOS MODAL ---
  cerrarModal() {
    this.mostrarModalLogin = false;
  }

  onLoginExitoso() {
    this.mostrarModalLogin = false;
    this.notify('¡Bienvenido!', 'Sesión iniciada', 'success');
  }

  // --- UI/UX ---
  private notify(
    title: string,
    message = '',
    type: 'success' | 'error' | 'warn' = 'success',
    timeout = 1800
  )
  {
    let container = document.querySelector('.app-toasts') as HTMLElement;
    if (!container){
      container = document.createElement('div');
      container.className = 'app-toasts';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    toast.innerHTML = `
      <div class="icon">✓</div>
      <div>
        <p class="title">${title}</p>
        ${message ? `<p class="msg">${message}</p>` : ``}
      </div>
      <button class="close" aria-label="Cerrar">&times;</button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    (toast.querySelector('.close') as HTMLButtonElement).onclick = () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 200);
    };

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 200);
    }, timeout);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (window.scrollY > 500) {
      this.showScrollButton = true;
    } else {
      this.showScrollButton = false;
    }
  }

  volverArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  irAlMenu() {
    const menuElement = document.getElementById('menu-abajo');
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
