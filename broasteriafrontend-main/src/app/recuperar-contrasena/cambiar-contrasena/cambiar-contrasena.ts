import { environment } from 'src/environments';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators'; 

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cambiar-contrasena.html',
  styleUrls: ['./cambiar-contrasena.css']
})
export class CambiarContrasena implements OnInit {
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';
  token: string | null = '';
  
  mostrarPass1: boolean = false;
  mostrarPass2: boolean = false;
  cargando: boolean = false;
  mensajeError: string = '';
  cambioExitoso: boolean = false;

  private apiUrl = environment.apiUrl + '/api/auth/cambiar-contrasena';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.token = localStorage.getItem('tokenRecuperacion');
    if (!this.token) {
      this.router.navigate(['/recuperar-contrasena']);
    }
  }
    
    redirigir() {
        this.router.navigate(['/cliente']);
    }

  private validarContrasenaSegura(pass: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(pass);
  }


  cambiarPassword() {
    if (!this.nuevaContrasena || !this.confirmarContrasena) {
      this.mostrarError('Debes completar ambos campos.');
      return;
    }
    if (!this.validarContrasenaSegura(this.nuevaContrasena)) {
      this.mostrarError('La contraseña debe tener 8+ caracteres, una mayúscula, una minúscula, un número y un símbolo.');
      return;
    }
    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.mostrarError('Las contraseñas no coinciden.');
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.cambioExitoso = false;

    const body = {
      token: this.token,
      nuevaContrasena: this.nuevaContrasena
    };

    this.http.post(this.apiUrl, body)
      .pipe(
          finalize(() => {
              this.cargando = false;
              this.cd.detectChanges();
          })
      )
      .subscribe({
      next: (res: any) => {
        this.cambioExitoso = true; 
        this.cd.detectChanges();

        localStorage.removeItem('correoRecuperacion');
        localStorage.removeItem('tokenRecuperacion');
        localStorage.setItem('passwordCambiado', 'true');
      
      },
      error: (err) => {
        let msg = err.error?.mensaje || 'Error al cambiar la contraseña. El token puede haber expirado.';
        if (typeof err.error === 'string' && err.error.length > 0) {
            msg = err.error;
        } else if (err.error?.message) {
            msg = err.error.message; 
        }
        this.mostrarError(msg);
      }
    });
  }

  mostrarError(msg: string) {
    this.mensajeError = msg;
    this.cd.detectChanges();
    
    setTimeout(() => {
        this.mensajeError = '';
        this.cd.detectChanges();
    }, 4000); 
  }
}