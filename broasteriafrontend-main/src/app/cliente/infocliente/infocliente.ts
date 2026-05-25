import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ClienteService } from '../../services/cliente.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-infocliente',
  standalone: true,
  templateUrl: './infocliente.html',
  styleUrls: ['./infocliente.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class Infocliente implements OnInit {

  mostrarModalPassword = false;
  passActual: string = '';
  passNueva: string = '';
  passConfirmar: string = '';

  cliente: any = {};
  modoEdicion = false;
  guardando = false;
  
  mostrarPassActual: boolean = false;
  mostrarPassNueva: boolean = false;
  mostrarPassConfirmar: boolean = false;
  
  mostrarModalEliminar = false;
  mostrarModalLogout = false;

  @ViewChild('nombreInput') nombreInput!: ElementRef;
  @ViewChild('apellidoInput') apellidoInput!: ElementRef;
  @ViewChild('telefonoInput') telefonoInput!: ElementRef;
  @ViewChild('direccionInput') direccionInput!: ElementRef;
  @ViewChild('referenciaInput') referenciaInput!: ElementRef;
  @ViewChild('direccion2Input') direccion2Input!: ElementRef;

  constructor(private router: Router, private http: HttpClient, private cdr: ChangeDetectorRef, private clienteService: ClienteService) {}

  ngOnInit() {
    const clienteGuardado = localStorage.getItem('cliente');
    if (clienteGuardado) {
      this.cliente = JSON.parse(clienteGuardado);
    } else {
      this.notify('Sesión requerida', 'Inicia sesión para ver tu información.', 'warn', 2600);
      this.router.navigate(['/']); 
    }
  }

  activarEdicion() {
    if (this.guardando) return;
    this.modoEdicion = !this.modoEdicion;
    this.cdr.detectChanges();
  }

  guardarCambios() {
    if (!this.modoEdicion || this.guardando) return;

    this.guardando = true;
    this.modoEdicion = false;
    this.cdr.detectChanges();

    const nuevoCliente = {
      ...this.cliente,
      nombre: this.nombreInput.nativeElement.value.trim(),
      apellido: this.apellidoInput.nativeElement.value.trim(),
      telefono: this.telefonoInput.nativeElement.value.trim(),
      direccion: this.direccionInput.nativeElement.value.trim(),
      referencia: this.referenciaInput.nativeElement.value.trim(),
      direccion2: this.direccion2Input.nativeElement.value.trim()
    };

    if (!this.cliente.id) {
      this.notify('No se pudo actualizar', 'Faltan datos del cliente.', 'error', 3200);
      this.guardando = false;
      return;
    }

    this.http.put(`http://localhost:8080/clientes/${this.cliente.id}`, nuevoCliente)
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.cliente = nuevoCliente;
          localStorage.setItem('cliente', JSON.stringify(nuevoCliente));
          this.notify('Datos actualizados', 'Se guardaron correctamente.', 'success', 2000);
        },
        error: (error) => {
          console.error('Error al actualizar datos:', error);
          this.notify('Error al guardar', 'Inténtalo de nuevo en unos segundos.', 'error', 3200);
          this.modoEdicion = true; 
        }
      });
  }

  // Eliminacion de cuenta
  confirmarEliminacion() { this.mostrarModalEliminar = true; }
  cancelarEliminacion() { this.mostrarModalEliminar = false; }

  ejecutarEliminarCuenta() {
    if (this.guardando || !this.cliente?.id) return;
    this.guardando = true;
    this.mostrarModalEliminar = false;
    this.cdr.detectChanges();

    this.http.delete(`http://localhost:8080/clientes/${this.cliente.id}`, { responseType: 'text' })
      .pipe(finalize(() => { this.guardando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: () => {
          // Usamos logout del servicio para limpiar todo
          this.clienteService.logout();
          this.notify('Cuenta eliminada', 'Tu cuenta fue eliminada correctamente.', 'success', 2200);
          this.router.navigate(['/']);
        },
        error: (err) => {
          if (err.status === 409) {
            this.notify('No se puede eliminar', 'Tu cuenta tiene operaciones/pedidos activos.', 'warn', 3200);
          } else {
            this.notify('Error al eliminar', 'Inténtalo de nuevo más tarde.', 'error', 3200);
          }
        }
      });
  }
  
  // Cambio de contraseña modal
  abrirModalPassword() {
    this.passActual = '';
    this.passNueva = '';
    this.passConfirmar = '';
    
    this.mostrarPassActual = false;
    this.mostrarPassNueva = false;
    this.mostrarPassConfirmar = false;

    this.mostrarModalPassword = true;
  }

  cancelarPassword() {
    this.mostrarModalPassword = false;
  }
  
  private validarContrasenaSegura(pass: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(pass);
  }

  ejecutarCambioPassword() {
    if (!this.passActual || !this.passNueva || !this.passConfirmar) {
        this.notify('Atención', 'Todos los campos son obligatorios', 'warn');
        return;
    }

    if (this.passNueva.includes(' ') || this.passConfirmar.includes(' ')) {
        this.notify('Atención', 'La contraseña no puede contener espacios.', 'warn');
        return;
    }

    if (!this.validarContrasenaSegura(this.passNueva)) {
        this.notify('Contraseña débil', 'Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.', 'warn');
        return;
    }

    if (this.passNueva !== this.passConfirmar) {
        this.notify('Atención', 'Las nuevas contraseñas no coinciden.', 'warn');
        return;
    }

    if (this.passNueva.toLowerCase().includes(this.cliente.nombre.toLowerCase()) ||
        this.passNueva.toLowerCase().includes(this.cliente.apellido.toLowerCase()) ||
        this.passNueva.toLowerCase().includes(this.cliente.correo.split('@')[0].toLowerCase())) {
        this.notify('Seguridad', 'La contraseña no debe incluir tu nombre, apellido o correo.', 'warn');
        return;
    }

    const datosCambio = {
        id: this.cliente.id,
        contrasenaActual: this.passActual,
        contrasenaNueva: this.passNueva
    };

    this.clienteService.cambiarContrasenaPerfil(datosCambio).subscribe({
        next: (respuesta) => {
            this.notify('Éxito', 'Contraseña actualizada correctamente', 'success');
            this.mostrarModalPassword = false;
            this.passActual = '';
            this.passNueva = '';
            this.passConfirmar = '';
            this.cdr.detectChanges(); 
        },
        error: (err) => {
            console.error(err);
            if(err.status === 401) {
                this.notify('Error', 'La contraseña actual es incorrecta', 'error');
            } else {
                this.notify('Error', 'No se pudo actualizar la contraseña', 'error');
            }
        }
    });
  }

  togglePassActual() { this.mostrarPassActual = !this.mostrarPassActual; }
  togglePassNueva() { this.mostrarPassNueva = !this.mostrarPassNueva; }
  togglePassConfirmar() { this.mostrarPassConfirmar = !this.mostrarPassConfirmar; }

  abrirModalLogout() { this.mostrarModalLogout = true; }
  cancelarLogout() { this.mostrarModalLogout = false; }
  
  confirmarLogout() {
    this.mostrarModalLogout = false;

    this.clienteService.logout(); 

    this.notify('Sesión cerrada', '', 'success', 1400);
    this.router.navigate(['/']); 
  }

  // Navegacion
  inicio(e: Event){ e.preventDefault(); this.router.navigate(['/menu']); }
  carrito(e: Event){ e.preventDefault(); this.router.navigate(['/carrito']); }
  historial(e: Event){ e.preventDefault(); this.router.navigate(['/historial']); }
  abrirPerfil(){ this.router.navigate(['/infocliente']); }

  private notify(title: string, message = '', type: 'success' | 'error' | 'warn' = 'success', timeout = 1800){
    let container = document.querySelector('.app-toasts') as HTMLElement;
    if (!container){
      container = document.createElement('div');
      container.className = 'app-toasts';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    toast.innerHTML = `<div class="icon">${type === 'success' ? '✓' : type === 'warn' ? '!' : '×'}</div><div><p class="title">${title}</p>${message ? `<p class="msg">${message}</p>` : ''}</div><button class="close">×</button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    const hide = () => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 200); };
    toast.querySelector('.close')?.addEventListener('click', hide);
    setTimeout(hide, timeout);
  }
}