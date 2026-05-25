import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { GerenteService } from '../../../services/gerente.service';
import { CommonModule } from '@angular/common';
import { EmpleadoService } from '../../../services/empleado.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit, OnDestroy{

  productosPorCategoria: { [key: string]: any[] } = {};
  categoriaSeleccionada: number | null = null;

  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  modalAccion: 'cerrarSesion' | null = null;

  constructor(
    private router: Router,
    private gerenteService : GerenteService,
    private empleadoService: EmpleadoService,
  
  ) {}

  ngOnInit(): void {
    this.cargarInventario();
  }
  ngOnDestroy(): void {
  }
  cargarTablaInicial() {
    const tabla = document.getElementById('tablaInventario');
    if (!tabla) return;
    
    tabla.innerHTML = '';

    this.gerenteService.obtenerProductos().subscribe({
      next: (productos) => {
        if (!productos || productos.length === 0) {
          tabla.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay productos.</td></tr>`;
          return;
        }
        this.renderizarFilas(productos, tabla);
      },
      error: (err) => console.error(err)
    });
  }

  //actualización silenciosa
  actualizarDatosSilenciosamente() {
    if (document.querySelector('.btn-success')) return;

    this.gerenteService.obtenerProductos().subscribe({
      next: (productos) => {
        if (!productos) return;

        productos.forEach((prod: any) => {
          const idProd = prod.id || prod.idPro;
          
          const celdaStock = document.getElementById(`stock-${idProd}`);
          const celdaPrecio = document.getElementById(`precio-${idProd}`);

          if (celdaStock && celdaPrecio) {

            if (celdaStock.textContent !== prod.stock.toString()) {
              celdaStock.textContent = prod.stock.toString();

              if (prod.stock < 5) celdaStock.classList.add('text-danger', 'fw-bold');
              else celdaStock.classList.remove('text-danger', 'fw-bold');
            }

            const precioFormato = `S/ ${prod.precio}`; 
            if (!celdaPrecio.textContent?.includes(prod.precio.toString())) {
               celdaPrecio.textContent = precioFormato;
            }
          }
        });
      },
      error: (err) => console.error('Error polling', err)
    });
  }

  // Lógica auxiliar para dibujar filas 
  renderizarFilas(productos: any[], tabla: HTMLElement) {

    const productosPorCategoria: { [key: string]: any[] } = {};
    productos.forEach((p: any) => {
      const nombreCat = p.categoria?.nombreCategoria || 'Sin categoría';
      if (!productosPorCategoria[nombreCat]) productosPorCategoria[nombreCat] = [];
      productosPorCategoria[nombreCat].push(p);
    });

    Object.entries(productosPorCategoria).forEach(([categoria, lista]) => {
      const numProductos = lista.length;
      lista.forEach((prod, index) => {
        const fila = document.createElement('tr');
        const idProd = prod.id || prod.idPro; 

        if (index === 0) {
          const celdaCategoria = document.createElement('td');
          celdaCategoria.rowSpan = numProductos;
          celdaCategoria.textContent = categoria;
          celdaCategoria.className = 'fw-bold align-middle text-center bg-light';
          fila.appendChild(celdaCategoria);
        }

        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = prod.nombre;
        fila.appendChild(celdaNombre);

        const celdaPrecio = document.createElement('td');
        celdaPrecio.id = `precio-${idProd}`; 
        celdaPrecio.textContent = `S/ ${prod.precio}`;
        fila.appendChild(celdaPrecio);

        const celdaStock = document.createElement('td');
        celdaStock.id = `stock-${idProd}`;  
        celdaStock.textContent = prod.stock.toString();
        if (prod.stock < 5) celdaStock.classList.add('text-danger', 'fw-bold');
        fila.appendChild(celdaStock);

        const celdaAcciones = document.createElement('td');
        celdaAcciones.innerHTML = `
          <button class="btn btn-primary btn-sm me-1 btn-editar"><i class="bi bi-pencil-square"></i> Editar</button>
          <button class="btn btn-danger btn-sm btn-eliminar"><i class="bi bi-trash"></i> Eliminar</button>
        `;
        
        this.asignarEventosBotones(celdaAcciones, prod, celdaPrecio, celdaStock);
        fila.appendChild(celdaAcciones);
        tabla.appendChild(fila);
      });
    });
  }

  // Separo los eventos para que el código sea legible
  asignarEventosBotones(celdaAcciones: HTMLElement, prod: any, celdaPrecio: HTMLElement, celdaStock: HTMLElement) {
    const btnEditar = celdaAcciones.querySelector('.btn-editar') as HTMLButtonElement;
    const btnEliminar = celdaAcciones.querySelector('.btn-eliminar') as HTMLButtonElement;
    const idProd = prod.id || prod.idPro;

    btnEliminar.addEventListener('click', () => {
      this.eliminarProducto(idProd);
    });

    btnEditar.addEventListener('click', () => {
      const esModoEdicion = btnEditar.classList.contains('btn-primary');
      if (esModoEdicion) {
        btnEditar.innerHTML = '<i class="bi bi-check-lg"></i> Guardar';
        btnEditar.classList.replace('btn-primary', 'btn-success');
        
    
        celdaPrecio.removeAttribute('id'); 
        celdaStock.removeAttribute('id');

        celdaPrecio.innerHTML = `<input type="number" value="${prod.precio}" class="form-control form-control-sm input-precio" min="0" step="0.1">`;
        celdaStock.innerHTML = `<input type="number" value="${prod.stock}" class="form-control form-control-sm input-stock" min="0">`;
      } else {
        // GUARDAR
        const inputPrecio = celdaPrecio.querySelector('.input-precio') as HTMLInputElement;
        const inputStock = celdaStock.querySelector('.input-stock') as HTMLInputElement;
        if (!inputPrecio || !inputStock) return;

        const nuevoPrecio = parseFloat(inputPrecio.value);
        const nuevoStock = parseInt(inputStock.value);

        if (isNaN(nuevoPrecio) || isNaN(nuevoStock)) { alert('Valores inválidos'); return; }

        this.gerenteService.actualizarPro(idProd, { precio: nuevoPrecio, stock: nuevoStock }).subscribe({
          next: () => {
            alert('Actualizado');
            // Restauramos texto y IDs
            celdaPrecio.textContent = `S/ ${nuevoPrecio.toFixed(2)}`;
            celdaStock.textContent = nuevoStock.toString();
            
            celdaPrecio.id = `precio-${idProd}`; 
            celdaStock.id = `stock-${idProd}`;

            if(nuevoStock < 5) celdaStock.classList.add('text-danger', 'fw-bold');
            else celdaStock.classList.remove('text-danger', 'fw-bold');

            btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
            btnEditar.classList.replace('btn-success', 'btn-primary');
            
            prod.precio = nuevoPrecio;
            prod.stock = nuevoStock;
          },
          error: () => alert('Error al actualizar')
        });
      }
    });
  }

  registrarProducto() {
    const nombreInput = (document.getElementById('nombreProducto') as HTMLInputElement).value;
    const precioInput = parseFloat((document.getElementById('precioProducto') as HTMLInputElement).value);
    const stockInput = parseInt((document.getElementById('stockProducto') as HTMLInputElement).value);
    const categoriaInput = parseInt((document.getElementById('categoriaProducto') as HTMLSelectElement).value);

    if (!nombreInput || isNaN(precioInput) || isNaN(stockInput) || isNaN(categoriaInput)) {
      alert('Por favor completa todos los campos correctamente.');
      return;
    }

    const nuevoProducto = {
      nombre: nombreInput,
      precio: precioInput,
      stock: stockInput,
      categoria: { id: categoriaInput }
    };
    this.gerenteService.registrarProducto(nuevoProducto).subscribe({
      next: () => {
        alert('Producto registrado exitosamente.');
        this.cargarInventario(); 
        // Limpia los campos
        (document.getElementById('nombreProducto') as HTMLInputElement).value = '';
        (document.getElementById('precioProducto') as HTMLInputElement).value = '';
        (document.getElementById('stockProducto') as HTMLInputElement).value = '';
        (document.getElementById('categoriaProducto') as HTMLSelectElement).value = '';
      },
      error: (err) => {
        console.error('Error al registrar producto:', err);
        alert('Error al registrar producto.');
      }
    });
  }

  cargarInventario() {
    const tabla = document.getElementById('tablaInventario');
    if (!tabla) return;
    tabla.innerHTML = '';

    this.gerenteService.obtenerProductos().subscribe({
      next: (productos) => {
        if (!productos || productos.length === 0) {
          tabla.innerHTML = `
            <tr>
              <td colspan="6" class="text-center text-muted">No hay productos registrados.</td>
            </tr>`;
          return;
        }

        // Agrupar productos por categoría
        const productosPorCategoria: { [key: string]: any[] } = {};
        productos.forEach((p: any) => {
          const nombreCat = p.categoria?.nombreCategoria || 'Sin categoría';
          if (!productosPorCategoria[nombreCat]) {
            productosPorCategoria[nombreCat] = [];
          }
          productosPorCategoria[nombreCat].push(p);
        });

        // Crear filas dinámicamente
        Object.entries(productosPorCategoria).forEach(([categoria, lista]) => {
          const numProductos = lista.length;

          lista.forEach((prod, index) => {
            const fila = document.createElement('tr');

            if (index === 0) {
              const celdaCategoria = document.createElement('td');
              celdaCategoria.rowSpan = numProductos;
              celdaCategoria.textContent = categoria;
              celdaCategoria.className = 'fw-bold align-middle text-center bg-light';
              fila.appendChild(celdaCategoria);
            }

            const celdaNombre = document.createElement('td');
            celdaNombre.textContent = prod.nombre;
            fila.appendChild(celdaNombre);

            const celdaPrecio = document.createElement('td');
            celdaPrecio.textContent = `S/ ${prod.precio}`;
            fila.appendChild(celdaPrecio);

            const celdaStock = document.createElement('td');
            celdaStock.textContent = prod.stock.toString();
            fila.appendChild(celdaStock);

            const celdaAcciones = document.createElement('td');

            celdaAcciones.innerHTML = `
              <button class="btn btn-primary btn-sm me-1 btn-editar"><i class="bi bi-pencil-square"></i> Editar</button>
              <button class="btn btn-danger btn-sm btn-eliminar"><i class="bi bi-trash"></i> Eliminar</button>
            `;

            const btnEditar = celdaAcciones.querySelector('.btn-editar') as HTMLButtonElement;
            const btnEliminar = celdaAcciones.querySelector('.btn-eliminar') as HTMLButtonElement;

            btnEliminar.addEventListener('click', () => {
              this.eliminarProducto(prod.id || prod.idPro);
            });

            btnEditar.addEventListener('click', () => {
              const esModoEdicion = btnEditar.classList.contains('btn-primary');

              if (esModoEdicion) {
                btnEditar.innerHTML = '<i class="bi bi-check-lg"></i> Guardar';
                btnEditar.classList.replace('btn-primary', 'btn-success');

                celdaPrecio.innerHTML = `
                  <input type="number" value="${prod.precio}" class="form-control form-control-sm input-precio" min="0" step="0.1">
                `;
                celdaStock.innerHTML = `
                  <input type="number" value="${prod.stock}" class="form-control form-control-sm input-stock" min="0">
                `;

              } else {

                const inputPrecio = celdaPrecio.querySelector('.input-precio') as HTMLInputElement;
                const inputStock = celdaStock.querySelector('.input-stock') as HTMLInputElement;

                if (!inputPrecio || !inputStock) return;

                const nuevoPrecio = parseFloat(inputPrecio.value);
                const nuevoStock = parseInt(inputStock.value);

                if (isNaN(nuevoPrecio) || isNaN(nuevoStock)) {
                  alert('Por favor, ingrese valores válidos.');
                  return;
                }

                const productoUpdate = { precio: nuevoPrecio, stock: nuevoStock };
                
                const idProducto = prod.id || prod.idPro;

                this.gerenteService.actualizarPro(idProducto, productoUpdate).subscribe({
                  next: () => {
                    alert(`Producto "${prod.nombre}" actualizado correctamente.`);

                    celdaPrecio.textContent = `S/ ${nuevoPrecio.toFixed(2)}`;
                    celdaStock.textContent = nuevoStock.toString();

                    btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
                    btnEditar.classList.replace('btn-success', 'btn-primary');

                    prod.precio = nuevoPrecio;
                    prod.stock = nuevoStock;
                  },
                  error: (err) => {
                    console.error('Error al actualizar producto:', err);
                    alert('Error al conectar con el servidor.');
                  },
                });
              }
            });

            fila.appendChild(celdaAcciones);
            tabla.appendChild(fila);
          });
        });
      },
      error: (err) => {
        console.error('Error al cargar inventario:', err);
        tabla.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-danger">Error al cargar el inventario.</td>
          </tr>`;
      },
    });
  }
  //Eliminar Producto
  eliminarProducto(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.gerenteService.BorrarProducto(id).subscribe({
        next: () => {
          alert('Producto eliminado correctamente.');
          this.cargarInventario();
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Error al eliminar producto.');
        }
      });
    }
  }

  //Actualizar Producto
  editarProducto(prod: any, fila: HTMLTableRowElement) {
    const precioInput = prompt(`Nuevo precio para ${prod.nombre}:`, prod.precio.toString());
    const stockInput = prompt(`Nuevo stock para ${prod.nombre}:`, prod.stock.toString());

    // Verificar si el usuario canceló alguno de los prompts
    if (precioInput === null || stockInput === null) {
      alert('Edición cancelada.');
      return;
    }

    // Convertir a número
    const nuevoPrecio = parseFloat(precioInput);
    const nuevoStock = parseInt(stockInput);

    if (isNaN(nuevoPrecio) || isNaN(nuevoStock)) {
      alert('Por favor ingrese valores válidos.');
      return;
    }

    const productoUpdate = {
      precio: nuevoPrecio,
      stock: nuevoStock
    };

    this.gerenteService.actualizarPro(prod.idPro, productoUpdate).subscribe({
      next: () => {
        alert(`Producto "${prod.nombre}" actualizado correctamente.`);

        //Actualiza los valores directamente en la tabla
        prod.precio = nuevoPrecio;
        prod.stock = nuevoStock;

        const indicePrecio = fila.children.length === 5 ? 2 : 1;
        const indiceStock = fila.children.length === 5 ? 3 : 2;

        fila.children[indicePrecio].textContent = `S/ ${nuevoPrecio}`;
        fila.children[indiceStock].textContent = nuevoStock.toString();
      },
      error: (err) => {
        console.error('Error al actualizar producto:', err);
        alert('Error al actualizar el producto.');
      }
    });
  }
  
  
  //cerrar sesion modificado
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

    this.empleadoService.logoutBackend().subscribe({
      next: () => {
        this.empleadoService.logout();
        this.cerrarModal();
        this.router.navigate(['/empleado']);
      },
      error: () => {
        this.empleadoService.logout();
        this.cerrarModal();
        this.router.navigate(['/empleado']);
      }
    });

  }
}
CerrarSesion(event: Event) {
  event.preventDefault();
  this.mostrarAlertaCerrarSesion();
}



    empleados(event: Event) {event.preventDefault(); this.router.navigate(['/gerente']);}
    inventario(event: Event) {event.preventDefault(); this.router.navigate(['/inventario']);}
    estadistica(event: Event) {event.preventDefault(); this.router.navigate(['/estadisticas']);}
}

