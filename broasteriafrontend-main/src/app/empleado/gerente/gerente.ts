import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { empleadomodel } from '../../models/empleadomodel';
import { rolmodel } from '../../models/rolmodel';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GerenteService } from '../../services/gerente.service';
import { Detalleditar } from './detalleditar/detalleditar';
import { EmpleadoService } from '../../services/empleado.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-gerente',
  standalone: true,
  imports: [CommonModule, FormsModule,  MatButtonModule, MatIconModule, MatTableModule, MatDialogModule],
  templateUrl: './gerente.html',
  styleUrl: './gerente.css',
})
export class Gerente implements OnInit, OnDestroy {
  
  empleaditos: empleadomodel[] = [];
  roles: rolmodel[] = [];
  
  empleadoParaEditar: any = null;
  
  ocultarPassword = true;
  ocultarPasswordAdmin = true; 

  mostrarToast = false;
  closingToast = false;
  toastTitulo = '';
  toastMensaje = '';
  toastTipo = ''; 

  private toastTimeout: any;      
  private animationTimeout: any; 

  // Modales
  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  
  // Aceptamos 'cerrarSesion' o 'eliminarEmpleado'
  modalAccion: 'cerrarSesion' | 'eliminarEmpleado' | null = null;
  
  // Variable temporal para guardar el ID a eliminar
  idParaEliminar: number | null = null; 

  mostrarModalAdmin = false;
  adminPasswordInput = '';


  nuevoEmpleado: empleadomodel = {
    nombre: '',
    apellido: '',
    usuarioLogin: '',
    contrasenaHash: '',
    rol: null,
  };

  constructor(
    private router: Router,
    private empleadoService: EmpleadoService,
    private gerenteService: GerenteService,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listarEmpleado(); 
    this.cargarRol();
  }

  ngOnDestroy(): void {
  }

  // LISTAR EMPLEADOS 
  listarEmpleado(mostrarError: boolean = true): void {
    this.gerenteService.listarEmpleados().subscribe({
      next: (data) => {
        this.empleaditos = data.filter(emp => emp.usuarioLogin !== 'sistema'); 
        this.cdRef.detectChanges();
      },
      error: (err) => {
        if (mostrarError) console.error('Error al listar empleados', err);
      }
    });
  }

  trackByEmpleado(index: number, item: empleadomodel): any {
    return item.idEmpleado;
  }

  cargarRol(): void {
    this.gerenteService.listarRoles().subscribe({
    next: (data) => {
      const rolesUnicos = new Map<string, rolmodel>();

      data
        .filter(r => r.idRol !== 1 && (r.nombreRol || '').trim().toLowerCase() !== 'sistema')
        .forEach((rol) => {
          const nombre = (rol.nombreRol || '').trim().toLowerCase();

          if (nombre && !rolesUnicos.has(nombre)) {
            rolesUnicos.set(nombre, rol);
          }
        });

      this.roles = Array.from(rolesUnicos.values());
    },
      error: (err) => console.error('Error al cargar roles', err)
    });
  }

  compararRoles(a: rolmodel | null, b: rolmodel | null): boolean {
    return a?.idRol === b?.idRol;
  }

  trackByRol(index: number, item: rolmodel): any {
    return item.idRol || item.nombreRol || index;
  }


 crearEmpleado(): void {
    //Validar campos vacios
    if (!this.nuevoEmpleado.nombre || !this.nuevoEmpleado.usuarioLogin || !this.nuevoEmpleado.contrasenaHash || !this.nuevoEmpleado.rol) {
      this.lanzarToast('Error', 'Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    //Validar Contraseña
    const passwordRegex = /(?=.*\d)(?=.*[\W_]).{8,}/;
    if (!passwordRegex.test(this.nuevoEmpleado.contrasenaHash)) {
      this.lanzarToast('Contraseña Débil', 'Mínimo 8 caracteres, 1 número y 1 símbolo.', 'error');
      return;
    }

    //Guardar en BD
    this.gerenteService.crearEmpleados(this.nuevoEmpleado).subscribe({
      next: () => {
        this.lanzarToast('¡Éxito!', 'Empleado registrado correctamente.', 'success');
        
        this.nuevoEmpleado = { nombre: '', apellido: '', usuarioLogin: '', contrasenaHash: '', rol: null };
        this.ocultarPassword = true;
        this.listarEmpleado();
      },
      error: (err) => {
        console.error('Error al crear empleado', err);
        this.lanzarToast('Error', 'Hubo un problema al registrar el empleado.', 'error');
      }
    });
  }
  
  mostrarAlertaError(titulo: string, mensaje: string) {
      this.modalTipo = 'error';
      this.modalTitulo = titulo;
      this.modalMensaje = mensaje;
      this.modalAccion = null;
      this.mostrarModal = true;
    }

  editarEmpleado(empleado: any): void {
    this.abrirModalAdmin(empleado);
  }

  abrirModalAdmin(empleado: any) {
    this.adminPasswordInput = '';
    this.ocultarPasswordAdmin = true;
    this.mostrarModalAdmin = true;
    this.empleadoParaEditar = empleado;
  }

  validarAdminYEditar() {
    const usuarioAdmin = sessionStorage.getItem('usuarioLogin');

    if (!this.adminPasswordInput) {
      alert('Ingrese la contraseña.');
      return;
    }

    this.gerenteService.validarAdmin(usuarioAdmin!, this.adminPasswordInput).subscribe({
      next: (ok) => {
        if (!ok) {
          alert('Contraseña incorrecta o no es administrador.');
          return;
        }
        this.mostrarModalAdmin = false;
        this.adminPasswordInput = '';
        this.cdRef.detectChanges();

        setTimeout(() => {
          const dialogRef = this.dialog.open(Detalleditar, {
            width: '700px',
            data: { empleado: this.empleadoParaEditar },
          });

          dialogRef.afterClosed().subscribe(() => {
            this.empleadoParaEditar = null;
            this.listarEmpleado(false);
          });
        }, 200);
      },
      error: (err) => {
        console.error('Error al validar administrador', err);
        alert('Error de servicio al validar permisos de administrador.');
      },
    });
  }

  eliminarEmpleado(idEmpleado?: number): void {
    if (!idEmpleado) {
      this.lanzarToast('Error', 'No se puede eliminar: el ID es indefinido.', 'error');
      return;
    }

    this.idParaEliminar = idEmpleado;

    this.modalTipo = 'confirm';
    this.modalTitulo = 'Confirmar Eliminación';
    this.modalMensaje = '¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.';
    this.modalAccion = 'eliminarEmpleado'; 
    this.mostrarModal = true;
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
    this.idParaEliminar = null; 
  }

  // Maneja ambas acciones 
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
    // Eliminar Empleado
    else if (this.modalAccion === 'eliminarEmpleado') {
      if (this.idParaEliminar) {
        this.gerenteService.eliminarEmpleados(this.idParaEliminar).subscribe({
          next: () => {
            this.cerrarModal();
            this.lanzarToast('Eliminado', 'Empleado eliminado correctamente', 'success');
            this.listarEmpleado();
          },
          error: (err) => {
            this.cerrarModal();
            console.error('Error al eliminar empleado', err);
            this.lanzarToast('Error', 'No se pudo eliminar el empleado.', 'error');
          }
        });
      }
    }
  }

  CerrarSesion(event: Event) {
    event.preventDefault();
    this.mostrarAlertaCerrarSesion();
  }

  // === FUNCIONES PARA CONTROLAR EL TOAST ===
  lanzarToast(titulo: string, mensaje: string, tipo: string) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }

    this.toastTitulo = titulo;
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.mostrarToast = true;
    this.closingToast = false; 

    this.cdRef.detectChanges();

    this.toastTimeout = setTimeout(() => {
      this.cerrarToast();
    }, 3000);
  }

  cerrarToast() {
    if (!this.mostrarToast) return;

    this.closingToast = true;

    this.cdRef.detectChanges();

    this.animationTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.closingToast = false; 
    }, 500);
  }

  empleados(event: Event) { event.preventDefault(); this.router.navigate(['/gerente']); }
  inventario(event: Event) { event.preventDefault(); this.router.navigate(['/inventario']); }
  estadistica(event: Event) { event.preventDefault(); this.router.navigate(['/estadisticas']); }
}
