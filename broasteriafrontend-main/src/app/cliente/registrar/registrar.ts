import { environment } from 'src/environments';
import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './registrar.html',
  styleUrl: './registrar.css',
})
export class Registrar {

  // --- OJITOS ---
  @ViewChild('inputContrasena') inputContrasena!: ElementRef<HTMLInputElement>;
  @ViewChild('iconoOjo') iconoOjo!: ElementRef<HTMLElement>;
  @ViewChild('inputConfirmarContrasena') inputConfirmarContrasena!: ElementRef;
  @ViewChild('iconoConfirmarOjo') iconoConfirmarOjo!: ElementRef;

  private baseUrl = environment.apiUrl + '/clientes';

  mostrarConfirmarContrasena: boolean = false;
  mostrarContrasena = false;
  isModalVisible = false;
  modalTitulo = '';
  modalMensaje = '';
  modalIcono: 'success' | 'error' = 'success';
  isToastVisible = false;
  toastMessage = '';
  
  private toastTimer: any = null;
  
  //VARIABLES PARA DOCUMENTO Y CORREO QUE EXISTEN
  documentoExisteError: boolean = false; 
  correoExisteError: boolean = false;
  
  // --- NUEVA VARIABLE DE ESTADO para API EXTERNA RENIEC/SUNAT ---
  documentoAPIValido: boolean = true; 

  cliente = {
    nombre: '',
    apellido: '',
    direccion: '',
    telefono: 0,
    numeroDocumento: '',
    correo: '',
    contrasena: '',
    tipoDocumento: { id: 1 }
  };

  tiposDocumento = [
    { id: 1, nombreDocumento: 'DNI' },
    { id: 2, nombreDocumento: 'CE' }
  ];

  constructor(private router: Router, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  irALogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/ini-cliente']);
  }

  mostrarModal(tipo: 'success' | 'error', titulo: string, mensaje: string) {
    this.isToastVisible = false; 
    clearTimeout(this.toastTimer);

    this.modalIcono = tipo;
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.isModalVisible = true; 
  }

  cerrarModal() {
    this.isModalVisible = false; 
    if (this.modalIcono === 'success') {
      this.router.navigate(['/ini-cliente']);
    }
  }

  mostrarToast(mensaje: string) {
    clearTimeout(this.toastTimer);

    this.toastMessage = mensaje;
    this.isToastVisible = true;
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.isToastVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  private validarContrasenaSegura(pass: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    return regex.test(pass);
  }

  private async verificarCorreoExistente(correo: string): Promise<boolean> {
    try {
      const resultado = await firstValueFrom(this.http.get<boolean>(`${this.baseUrl}/existe/${correo}`));
      return resultado ?? false;
    } catch (error) {
      console.error('Error verificando correo:', error);
      return false;
    }
  }

  private async verificarDocumentoExistente(documento: string): Promise<boolean> {
    try {
      const resultado = await firstValueFrom(this.http.get<boolean>(`${this.baseUrl}/documento/existe/${documento}`));
      return resultado ?? false;
    } catch (error) {
      console.error('Error verificando documento:', error);
      return false;
    }
  }
  
  //FUNCIÓN PARA LLAMAR A TU BACK-END SEGURO
 async consultarDocumentoExistencia(tipo: string, numero: string): Promise<{ valido: boolean, mensaje: string }> {
    const timestamp = new Date().getTime(); 
    const url = `${this.baseUrl}/validar-documento/${tipo}/${numero}?t=${timestamp}`; 
    
    try {
        const respuesta = await firstValueFrom(
            this.http.get<{ valido: boolean, mensaje: string }>(url)
        ); 
        
        return { valido: respuesta.valido, mensaje: respuesta.mensaje };
    } catch (error: any) {
        console.error('Error al llamar al Back-end para validar documento:', error);
        const mensajeError = error.error?.mensaje || 'Error de conexión con el servidor de validación.';
        return { valido: false, mensaje: mensajeError };
    }
}

  //FUNCION PRINCIPAL DE VALIDACION EN TIEMPO REAL
  async validarDocumentoExistenteEnTiempoReal(numeroDocumento: string, tipoDocumentoTexto: string) {
    const documentoLimpio = numeroDocumento.trim();
    this.documentoExisteError = false;
    this.documentoAPIValido = true;

    if (!documentoLimpio) {
      this.cdr.detectChanges();
      return;
    }
    // Validar que se haya seleccionado un tipo de documento
    if (!tipoDocumentoTexto) {
        this.documentoAPIValido = false; 
        this.mostrarToast('¡Alerta! Debes seleccionar el Tipo de Documento (DNI o CE) antes de ingresar el número.');
        this.cdr.detectChanges();
        return;
    }

    let formatoValido = true;
    // Se mantiene la validación de formato local (es más rápido)
    if (/[^A-Za-z0-9]/.test(documentoLimpio)) {
      formatoValido = false;
    } else if (tipoDocumentoTexto === 'DNI' && !/^\d{8}$/.test(documentoLimpio)) {
      formatoValido = false;
    } else if (tipoDocumentoTexto === 'CE' && !/^[A-Za-z0-9]{8,12}$/.test(documentoLimpio)) {
      formatoValido = false;
    } 

    if (formatoValido) {
      if (tipoDocumentoTexto === 'DNI') { 
        const resultadoAPI = await this.consultarDocumentoExistencia(tipoDocumentoTexto, documentoLimpio);
        this.documentoAPIValido = resultadoAPI.valido;

        if (!resultadoAPI.valido) {
          this.mostrarToast(`¡Alerta! ${resultadoAPI.mensaje}`);
        }
      } else {
        this.documentoAPIValido = true; 
      }
      
      //Verificar existencia en la base de datos
      const documentoExiste = await this.verificarDocumentoExistente(documentoLimpio);
      this.documentoExisteError = documentoExiste;
      
      if (documentoExiste) {
        this.mostrarToast('¡Advertencia! El número de documento ya está registrado');
      }
      
    } else {
      // Si el formato falla
      this.documentoAPIValido = false; 
      this.documentoExisteError = false; 
      this.mostrarToast(`El formato de ${tipoDocumentoTexto} no es correcto.`);
    }
    
    this.cdr.detectChanges();
}
  async validarCorreoExistenteEnTiempoReal(correo: string) {
    const correoLimpio = correo.trim();
    
    // Limpiar error si el campo está vacío
    if (!correoLimpio) {
      this.correoExisteError = false;
      this.cdr.detectChanges();
      return;
    }

    // Validar formato básico de correo (para no hacer la llamada si es inválido)
    const regexCorreoReal = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!regexCorreoReal.test(correoLimpio)) {
      this.correoExisteError = false;
      this.cdr.detectChanges();
      return; 
    }

    const correoExiste = await this.verificarCorreoExistente(correoLimpio);
    this.correoExisteError = correoExiste;

    if (correoExiste) {
      this.mostrarToast('¡Advertencia! El correo electrónico ya está registrado.');
    }
    
    this.cdr.detectChanges(); 
  }


  async registrarCliente() {
    
    const nombre = (document.querySelector('input[placeholder="Nombre"]') as HTMLInputElement)?.value.trim();
    const apellido = (document.querySelector('input[placeholder="Apellido"]') as HTMLInputElement)?.value.trim();
    const tipoDocumentoTexto = (document.querySelector('.form-select') as HTMLSelectElement)?.value.trim();
    const numeroDocumento = (document.querySelector('input[placeholder="Documento"]') as HTMLInputElement)?.value.trim();
    const telefono = (document.querySelector('input[placeholder="987654321"]') as HTMLInputElement)?.value.trim();
    const direccion = (document.querySelector('input[placeholder="Las cerezas 123"]') as HTMLInputElement)?.value.trim();
    const correo = (document.querySelector('input[placeholder="Cliente123@gmail.com"]') as HTMLInputElement)?.value.trim();
    const contrasena = (document.querySelector('input[placeholder="123456"]') as HTMLInputElement)?.value.trim();
    const confirmarContrasena = (document.querySelectorAll('input[placeholder="123456"]')[1] as HTMLInputElement)?.value.trim();
    const terminosAceptados = (document.querySelector('input[id="terms"]') as HTMLInputElement)?.checked;

    // --- VERIFICACIONES FINALES ANTES DE ENVIAR ---
    if (this.documentoExisteError) {
      this.mostrarToast('El número de documento ya está registrado. No puedes continuar.');
      return;
    }

    if (this.correoExisteError) {
      this.mostrarToast('El correo electrónico ya está registrado. No puedes continuar.');
      return;
    }
    
    // --- NUEVA VERIFICACIÓN DE API EXTERNA ---
    if (!this.documentoAPIValido) {
        this.mostrarToast(`El ${tipoDocumentoTexto} ingresado no es válido o no existe. Por favor, revíselo.`);
        return;
    }

    if (!nombre || !apellido || !tipoDocumentoTexto || !numeroDocumento || !direccion || !telefono || !correo || !contrasena || !confirmarContrasena) {
      this.mostrarToast('Todos los campos marcados con * son obligatorios.');
      return;
    }

    if (!/^[a-zA-ZÁÉÍÓÚáéíóúñÑ ]+$/.test(nombre)) {
      this.mostrarToast('El nombre solo puede contener letras.');
      return;
    }

    if (!/^[a-zA-ZÁÉÍÓÚáéíóúñÑ ]+$/.test(apellido)) {
      this.mostrarToast('El apellido solo puede contener letras.');
      return;
    }

    if (direccion.length < 5) {
      this.mostrarToast('La dirección debe tener al menos 5 caracteres.');
      return;
    }

    if (correo.includes(' ')) {
      this.mostrarToast('El correo no debe contener espacios.');
      return;
    }

    const regexCorreoReal = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!regexCorreoReal.test(correo)) {
      this.mostrarToast('Ingrese un correo electrónico válido.');
      return;
    }

    if (/[^A-Za-z0-9]/.test(numeroDocumento)) {
      this.mostrarToast('El documento no debe contener caracteres especiales.');
      return;
    }

    if (tipoDocumentoTexto === 'DNI' && !/^\d{8}$/.test(numeroDocumento)) {
      this.mostrarToast('El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    if (tipoDocumentoTexto === 'CE' && !/^[A-Za-z0-9]{8,12}$/.test(numeroDocumento)) {
      this.mostrarToast('El CE debe tener entre 8 y 12 caracteres alfanuméricos.');
      return;
    }

    if (!/^\d+$/.test(telefono)) {
      this.mostrarToast('El teléfono solo puede contener números.');
      return;
    }

    if (telefono.length === 9 && !telefono.startsWith('9')) {
      this.mostrarToast('El teléfono peruano debe comenzar con 9.');
      return;
    }

    if (telefono.length < 9) {
      this.mostrarToast('Ingrese un número de teléfono válido.');
      return;
    }

    if (telefono.length > 13) {
      this.mostrarToast('El teléfono es demasiado largo para ser válido.');
      return;
    }

    if (contrasena.includes(' ') || confirmarContrasena.includes(' ')) {
      this.mostrarToast('La contraseña no puede contener espacios.');
      return;
    }

    if (!this.validarContrasenaSegura(contrasena)) {
      this.mostrarToast('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.');
      return;
    }

    if (contrasena !== confirmarContrasena) {
      this.mostrarToast('Las contraseñas ingresadas no son iguales.');
      return;
    }

    if (contrasena.toLowerCase().includes(nombre.toLowerCase()) ||
        contrasena.toLowerCase().includes(apellido.toLowerCase()) ||
        contrasena.toLowerCase().includes(correo.split('@')[0].toLowerCase())) {
      this.mostrarToast('La contraseña no debe incluir tu nombre, apellido o correo.');
      return;
    }

    if (!terminosAceptados) {
      this.mostrarToast('Debe aceptar los términos y condiciones.');
      return;
    }

    this.cliente = {
      nombre,
      apellido,
      direccion,
      telefono: parseInt(telefono) || 0,
      numeroDocumento: numeroDocumento,
      correo,
      contrasena,
      tipoDocumento: {
        id: tipoDocumentoTexto === 'CE' ? 2 : 1 
      }
    };

    console.log('Datos validados a enviar:', this.cliente);

    this.http.post(this.baseUrl + '/crear', this.cliente).subscribe({
      next: (res: any) => {
        const mensajeExito = `Cliente registrado correctamente: ${res.nombre} ${res.apellido}`;
        localStorage.setItem('cliente', JSON.stringify(res));

        this.mostrarModal('success', '¡Registrado!', mensajeExito);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        const mensajeError = err.error?.mensaje || err.error?.error || 'Error al registrar el cliente.';
        this.mostrarModal('error', '¡Ups... algo salió mal!', mensajeError);
        this.cdr.detectChanges();
      }
    });
  }

  alternarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
    const input = this.inputContrasena.nativeElement;
    const icon = this.iconoOjo.nativeElement;

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

  alternarConfirmarContrasena() {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;

    const input = this.inputConfirmarContrasena.nativeElement;
    const icon = this.iconoConfirmarOjo.nativeElement;

    if (this.mostrarConfirmarContrasena) {
      input.type = 'text';
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    }
  }
}