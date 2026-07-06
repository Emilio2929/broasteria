import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { ClienteService } from '../services/cliente.service'; 
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], 
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.css']
})
export class Cliente implements OnInit {
  // Modelos
  correo: string = '';
  password: string = '';
  
  // Estados UI
  mostrarContrasena = false;
  loggingIn = false;

  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  @ViewChild('eyeIcon') eyeIcon!: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private clienteService: ClienteService
  ) {}

  ngOnInit() {
    // Si vienes de recuperar contraseña
    const passCambiado = localStorage.getItem('passwordCambiado');
    if (passCambiado === 'true') {
      localStorage.removeItem('passwordCambiado');
      this.notify('¡Éxito!', 'Tu contraseña ha sido actualizada.', 'success', 3000);
    }
    
    // Si ya está logueado, lo mandamos al menú
    if (this.clienteService.estaLogueado()) {
        this.router.navigate(['/']);
    }
  }

  registrar() { this.router.navigate(['/registrar']); }
  
  volver(event?: Event) {
    event?.preventDefault();
    this.router.navigate(['/']); 
  }

  togglePassword() {
    this.mostrarContrasena = !this.mostrarContrasena;
    const input = this.passwordInput.nativeElement;
    const icon = this.eyeIcon.nativeElement;

    if (this.mostrarContrasena) {
      input.type = 'text';
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    }
  }

  iniciarSesion() {
    if (this.loggingIn) return;

    const correo = this.correo.trim();
    const password = this.password.trim();

    if (!correo || !password) {
      this.notify('Campos incompletos', 'Por favor completa correo y contraseña.', 'warn', 2600);
      return;
    }

    this.loggingIn = true; 
    const loginData = { correo, contrasena: password };

    this.clienteService.login(loginData)
      .pipe(
        finalize(() => {
          this.loggingIn = false; 
        })
      )
      .subscribe({
        next: (respuesta: any) => {
          
          this.notify('Inicio de sesión exitoso', '', 'success', 1500);

          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error en inicio de sesión', error);
          let mensaje = 'Correo o contraseña incorrectos.';
          
          if (error.status === 404) mensaje = 'El correo no está registrado.';
          if (error.status === 401) mensaje = 'Contraseña incorrecta.';
          
          this.notify('Error de acceso', mensaje, 'error', 3000);
        }
      });
  }
  
  irARecuperar(event: Event) {
    event.preventDefault();
    this.router.navigate(['/recuperar-contrasena']);
  }

  // --- SISTEMA DE NOTIFICACIONES ---
  private notify(
    title: string,
    message = '',
    type: 'success' | 'error' | 'warn' = 'success',
    timeout = 1800
  ) {
    let container = document.querySelector('.app-toasts') as HTMLElement;
    if (!container) {
      container = document.createElement('div');
      container.className = 'app-toasts';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    // Accesibilidad
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = type === 'success' ? '✓' : type === 'warn' ? '!' : '×';
    
    const textBox = document.createElement('div');
    const t = document.createElement('p'); t.className = 'title'; t.textContent = title;
    textBox.appendChild(t);
    
    if (message) {
      const m = document.createElement('p'); m.className = 'msg'; m.textContent = message;
      textBox.appendChild(m);
    }
    
    const close = document.createElement('button');
    close.className = 'close';
    close.setAttribute('aria-label', 'Cerrar');
    close.textContent = '×';
    
    toast.append(icon, textBox, close);
    container.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    const hide = () => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 200); };
    close.onclick = hide;
    let timer: number = window.setTimeout(hide, timeout);
    
    toast.addEventListener('mouseenter', () => { clearTimeout(timer); });
    toast.addEventListener('mouseleave', () => { timer = window.setTimeout(hide, 800); });
  }
}
