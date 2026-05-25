export class ClienteModel {
  id?: number;
  nombre: string = '';
  apellido: string = '';
  direccion: string = '';
  telefono: string = '';
  numeroDocumento: string = '';
  correo: string = '';
  contrasena: string = '';
  tipoDocumento: { id: number } = { id: 1 };
}
