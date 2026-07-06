import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmpleadoService, Empleado } from '../services/empleado.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-empleado',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './empleado.html',
  styleUrl: './empleado.css',
})
export class EmpleadoComponent {
  @ViewChild('inputContrasena') inputContrasena!: ElementRef;
  @ViewChild('iconoOjo') iconoOjo!: ElementRef;

  usuarioLogin = '';
  contrasenaHash = '';
  cargando = false;
  mostrarContrasena = false;

  mostrarToast = false;
  closingToast = false;
  toastTitulo = '';
  toastMensaje = '';
  toastTipo = '';
  private toastTimeout: any;
  private animationTimeout: any;

  constructor(private router: Router, private empleadoService: EmpleadoService, private cd: ChangeDetectorRef) {}

  // Alternar visibilidad de contraseña
  alternarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
    const input = this.inputContrasena.nativeElement;
    const icon = this.iconoOjo.nativeElement;
    if (this.mostrarContrasena) {
      input.type = 'text';
      icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
  }

  volver(event?: Event) {
    event?.preventDefault();
    this.router.navigate(['/ini-empleado']);
  }

  // === LOGICA DEL TOAST ===
  lanzarToast(titulo: string, mensaje: string, tipo: string) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    if (this.animationTimeout) clearTimeout(this.animationTimeout);

    this.toastTitulo = titulo;
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.mostrarToast = true;
    this.closingToast = false;

    this.cd.detectChanges(); 

    this.toastTimeout = setTimeout(() => {
      this.cerrarToast();
    }, 3000);
  }

  cerrarToast() {
    if (!this.mostrarToast) return;
    this.closingToast = true;
    this.animationTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.closingToast = false;
    }, 500);
  }

  ingresar() {
      if (!this.usuarioLogin || !this.contrasenaHash) {
        this.lanzarToast('Campos Vacíos', 'Complete usuario y contraseña.', 'error');
        return;
      }

      this.cargando = true; 
      this.empleadoService.login(this.usuarioLogin, this.contrasenaHash)
        .subscribe({
          next: () => {
            this.cargando = false; 
            setTimeout(() => {
              const rol = (sessionStorage.getItem('rolEmpleado') || '').toLowerCase();
              if (rol === 'mesero') this.router.navigate(['/mesero']);
              else if (rol === 'chef') this.router.navigate(['/chef']);
              else if (rol === 'cajero') this.router.navigate(['/cajero']);
              else if (rol === 'administrador' || rol === 'gerente') this.router.navigate(['/gerente']);
              else if (rol === 'delivery') {this.router.navigate(['/delivery']);}
              else this.lanzarToast('Error', 'Rol no reconocido: ' + rol, 'error');
            }, 500);
          },
          error: (err) => {
            console.log("Error recibido:", err);
            
            this.cargando = false; 
            
            if (err.status === 401 || err.status === 403) {
              this.lanzarToast('Credenciales Incorrectas', 'Usuario o contraseña inválidos.', 'error');
            } else if (err.status === 404) {
              this.lanzarToast('Usuario no encontrado', 'El usuario no existe.', 'error');
            } else {
              this.lanzarToast('Error', 'No se pudo conectar (' + err.status + ')', 'error');
            }
          }
        });
  }
}
