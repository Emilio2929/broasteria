import { environment } from 'src/environments';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { empleadomodel } from '../models/empleadomodel';
import { estadoempleadomodel } from '../models/estadoempleadomodel';
import { rolmodel } from '../models/rolmodel';

export interface Categoria_producto {
  id: number;
  nombreCategoria: string;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: DoubleRange;
  stock: number;
  categoria: Categoria_producto;
}

@Injectable({
  providedIn: 'root'
})
export class GerenteService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // LISTAR PRODUCTOS POR CATEGORÍA
  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/productos/categoriaPro`);
  }

  // BORRAR PRODUCTO
  BorrarProducto(idPro: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/productos/borrar/${idPro}`);
  }

  // ACTUALIZAR PRECIO Y STOCK
  actualizarPro(
    id: number,
    producto: { precio: number; stock: number }
  ): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/Actualizar/${id}`, producto);
  }

  // REGISTRAR NUEVO PRODUCTO
  registrarProducto(
    producto: {
      nombre: string;
      precio: number;
      stock: number;
      categoria: { id: number };
    }
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/productos/crear`, producto);
  }

  // ----gestion empleados

  listarEmpleados(): Observable<empleadomodel[]> {
    return this.http.get<empleadomodel[]>(`${this.baseUrl}/empleados`);
  }

  crearEmpleados(empleado: empleadomodel): Observable<empleadomodel>{
    return this.http.post<empleadomodel>(`${this.baseUrl}/empleados/crear`, empleado);
  }

  obtenerPorIdEmpleados(id: number): Observable<empleadomodel> {
    return this.http.get<empleadomodel>(`${this.baseUrl}/empleados/codigoempleado/${id}`);
  }

  actualizarEmpleados(id: number, empleado: empleadomodel): Observable<empleadomodel> {
    return this.http.put<empleadomodel>(`${this.baseUrl}/empleados/actualizarempleado/${id}`, empleado);
  }

  eliminarEmpleados(id: number) : Observable<any> {
    return this.http.delete(`${this.baseUrl}/empleados/eliminarempleado/${id}`, { responseType: 'text' });
  }

  // gestion estado de empleados
  listarEstadoEmpleado(): Observable<estadoempleadomodel[]> {
    return this.http.get<estadoempleadomodel[]>(`${this.baseUrl}/estadoempleado`);
  }

  //gestion rol empleado
  listarRoles(): Observable<rolmodel[]> {
    return this.http.get<rolmodel[]>(`${this.baseUrl}/roles`);
  }

  validarAdmin(usuarioLogin: string, contrasena: string) {
    return this.http.post<boolean>(`${this.baseUrl}/empleados/validar-admin`, {
      usuarioLogin,
      contrasena
    });
  }

 //Estadistica
  listarPedidos(fechaInicio: string, fechaFin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pedidos/Completado`,{ params: { fechaInicio, fechaFin } } );
  }


  ventaPorProducto(fechaInicio: string, fechaFin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pedidos/VentaPorProduc`,{ params: { fechaInicio, fechaFin } });
  }

  ProMasVent(fechaInicio: string, fechaFin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pedidos/ProMV` ,{ params: { fechaInicio, fechaFin } });
  }
  ProMenosVent(fechaInicio: string, fechaFin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pedidos/ProMenV` ,{ params: { fechaInicio, fechaFin} });
  }

  ComparacionVentasMensuales(mes: number, anio: number, mes2 : number, anio2: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pedidos/CompVentasMensuales`,{ params: { mes, anio, mes2, anio2 } });
  }

  anioymesActual(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pedidos/mesAnio`);
  }
}