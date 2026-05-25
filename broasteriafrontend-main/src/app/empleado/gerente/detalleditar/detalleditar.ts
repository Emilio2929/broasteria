import { CommonModule } from '@angular/common';
import { Component, Inject, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { empleadomodel } from '../../../models/empleadomodel';
import { rolmodel } from '../../../models/rolmodel';
import { estadoempleadomodel } from '../../../models/estadoempleadomodel';
import { GerenteService } from '../../../services/gerente.service';

@Component({
  selector: 'app-detalleditar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './detalleditar.html',
  styleUrl: './detalleditar.css',
})
export class Detalleditar implements OnInit, AfterViewInit {

  empleado: empleadomodel = {
    nombre: '',
    apellido: '',
    usuarioLogin: '',
    contrasenaHash: '',
    rol: null,
    estado: null
  };

  roles: rolmodel[] = [];
  estados: estadoempleadomodel[] = [];
  isSaving = false;


  ocultarPassword = true; 
  mensajeErrorPassword = '';


  constructor(
    private dialogRef: MatDialogRef<Detalleditar>,
    @Inject(MAT_DIALOG_DATA) public data: { empleado: empleadomodel | null },
    private gerenteService: GerenteService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.empleado) {
      this.empleado = JSON.parse(JSON.stringify(this.data.empleado));
      this.empleado.contrasenaHash = '';
    }
  }

  ngAfterViewInit(): void {

    this.gerenteService.listarRoles().subscribe(r => {
      this.roles = (r || []).filter(rol => 
        rol.idRol !== 1 || (this.empleado.rol && this.empleado.rol.idRol === 1)
      );
      this.cdRef.detectChanges();
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
  validarContrasena(): boolean {
    this.mensajeErrorPassword = '';
    
    const pass = this.empleado.contrasenaHash || '';

    if (this.empleado.idEmpleado && (!pass || pass.trim() === '')) {
      return true;
    }

    if (!this.empleado.idEmpleado && (!pass || pass.trim() === '')) {
      this.mensajeErrorPassword = 'La contraseña es obligatoria para nuevos empleados.';
      return false;
    }

    const regexFuerte = /(?=.*\d)(?=.*[\W_]).{8,}/;

    if (!regexFuerte.test(pass)) {
      this.mensajeErrorPassword = 'La contraseña debe tener al menos 8 caracteres, 1 número y 1 símbolo.';
      return false;
    }

    return true;
  }

  guardar() {
    if (!this.validarContrasena()) {
      alert(this.mensajeErrorPassword); 
      return; 
    }

    this.isSaving = true;

    if (this.empleado.idEmpleado) {
       // Actualizar
       this.gerenteService.actualizarEmpleados(this.empleado.idEmpleado, this.empleado).subscribe({
         next: () => this.dialogRef.close('guardado'),
         error: () => { 
           this.isSaving = false; 
           alert('Error al actualizar empleado.'); 
         }
       });

    } else {
       // Crear
       this.gerenteService.crearEmpleados(this.empleado).subscribe({
         next: () => this.dialogRef.close('created'),
         error: () => { 
           this.isSaving = false; 
           alert('Error al crear empleado.'); 
         }
       });
    }
  }

  compararRoles(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.idRol === o2.idRol : o1 === o2;
  }

  compararEstados(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.idEstadoEmpleado === o2.idEstadoEmpleado : o1 === o2;
  }
}
