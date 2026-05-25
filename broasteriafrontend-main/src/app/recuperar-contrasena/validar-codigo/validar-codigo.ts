import { environment } from 'src/environments';
import { Component, ChangeDetectorRef } from '@angular/core'; // <--- 1. Importar esto
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-validar-codigo',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './validar-codigo.html',
  styleUrls: ['./validar-codigo.css']
})
export class ValidarCodigo {
  token: string = '';
  cargando: boolean = false;
  
  mensajeError: string = '';
  mensajeExito: string = '';
  errorInput: boolean = false;

  private apiUrl = environment.apiUrl + '/api/auth/validar-codigo';

  // ChangeDetectorRef en el constructor
  constructor(
    private http: HttpClient, 
    private router: Router,
    private cd: ChangeDetectorRef 
  ) {}

  volver(event: Event) {
    event.preventDefault();
    this.router.navigate(['/recuperar-contrasena']);
  }

  validarToken() {
    if (this.token.length < 6) {
      this.mostrarError('El código debe tener 6 dígitos.');
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.errorInput = false;

    this.http.post(this.apiUrl, { token: this.token })
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cd.detectChanges(); 
        })
      )
      .subscribe({
        next: (res: any) => {
          this.mensajeExito = res.mensaje || '¡Código verificado!';
          localStorage.setItem('tokenRecuperacion', this.token);
          this.cd.detectChanges();
          setTimeout(() => this.router.navigate(['/cambiar-contrasena']), 1500);
        },
        error: (err) => {
          console.log('Error completo:', err);

          let msg = 'Código incorrecto o expirado.';
          
          if (err.error) {
             if (typeof err.error === 'string') {
                 msg = err.error;
             } else if (err.error.mensaje) {
                 msg = err.error.mensaje;
             }
          }
          this.mostrarError(msg);
          this.cd.detectChanges(); 
        }
      });
  }

  mostrarError(msg: string) {
    this.mensajeError = msg;
    this.errorInput = true;
    
    setTimeout(() => {
        this.mensajeError = '';
        this.errorInput = false;
        this.cd.detectChanges(); 
    }, 4000);
  }
}