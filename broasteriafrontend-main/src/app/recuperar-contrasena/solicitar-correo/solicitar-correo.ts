import { environment } from 'src/environments';
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient,  } from '@angular/common/http';

@Component({
  selector: 'app-solicitar-correo',
  standalone: true,
  imports: [CommonModule, FormsModule, ],
  templateUrl: './solicitar-correo.html',
  styleUrls: ['./solicitar-correo.css']
})
export class SolicitarCorreo {
  correo: string = '';
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';

  private apiUrl = environment.apiUrl + '/api/auth/recuperar-contrasena';

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  irALogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/ini-cliente']);
  }

  enviarCodigo() {
    if (!this.correo) {
      this.mostrarError('Por favor, ingresa tu correo.');
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.http.post(this.apiUrl, { correo: this.correo }).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.mensajeExito = res.mensaje || 'Código enviado correctamente.';
  
        localStorage.setItem('correoRecuperacion', this.correo);

        setTimeout(() => {
          this.router.navigate(['/validar-codigo']);
        }, 1500);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
      let msg = 'Error al conectar con el servidor.';
      if (err.error && err.error.mensaje) {
        msg = err.error.mensaje;
      }

      this.mostrarError(msg); 
      
      this.cdr.detectChanges(); 
    }
  });
}

  mostrarError(msg: string) {
    this.mensajeError = msg;
    setTimeout(() => this.mensajeError = '', 3000);
  }
}
