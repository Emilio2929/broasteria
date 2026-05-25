import { Routes } from '@angular/router';

// === IMPORTACIONES ===

import { IniSesion } from './ini-sesion/ini-sesion';
import { SolicitarCorreo } from './recuperar-contrasena/solicitar-correo/solicitar-correo';
import { ValidarCodigo } from './recuperar-contrasena/validar-codigo/validar-codigo';
import { CambiarContrasena } from './recuperar-contrasena/cambiar-contrasena/cambiar-contrasena';

// Cliente
import { Cliente } from './cliente/cliente'; 
import { Registrar } from './cliente/registrar/registrar';
import { Menu } from './cliente/menu/menu';
import { Infocliente } from './cliente/infocliente/infocliente';
import { Carrito } from './cliente/carrito/carrito';
import { Historial } from './cliente/historial/historial';

// Empleado Principal
import { EmpleadoComponent } from './empleado/empleado';

// Roles de Empleado
import { Gerente } from './empleado/gerente/gerente';
import { Cajero } from './empleado/cajero/cajero';
import { ListaPedidos } from './empleado/cajero/lista-pedidos/lista-pedidos';
import { Chef } from './empleado/chef/chef';
import { Mesero } from './empleado/mesero/mesero';
import { RegistrarPedido } from './empleado/mesero/registrar-pedido/registrar-pedido';
import { Delivery } from './empleado/delivery/delivery';

// Subventanas Gerente
import { Estadisticas } from './empleado/gerente/estadisticas/estadisticas';
import { Inventario } from './empleado/gerente/inventario/inventario';

export const routes: Routes = [

    { path: '', component: Menu },
    { path: 'menu', redirectTo: '', pathMatch: 'full' }, 

    { path: 'ini-cliente', component: Cliente }, 
    
    { path: 'registrar', component: Registrar },
    { path: 'infocliente', component: Infocliente },
    { path: 'carrito', component: Carrito },       
    { path: 'historial', component: Historial },     

    // Recuperación de contraseña
    { path: 'recuperar-contrasena', component: SolicitarCorreo },
    { path: 'validar-codigo', component: ValidarCodigo },
    { path: 'cambiar-contrasena', component: CambiarContrasena },

    { path: 'ini-empleado', component: IniSesion },

    // Dashboard principal del empleado
    { path: 'empleado', component: EmpleadoComponent },

    // Sub-rutas específicas de roles
    { path: 'gerente', component: Gerente },
    { path: 'estadisticas', component: Estadisticas },
    { path: 'inventario', component: Inventario },
    
    { path: 'cajero', component: Cajero },
    { path: 'lista-pedidos', component: ListaPedidos },
    
    { path: 'chef', component: Chef },
    
    { path: 'mesero', component: Mesero },
    { path: 'registrarMesero', component: RegistrarPedido },
    
    { path: 'delivery', component: Delivery },

    { path: '**', redirectTo: '' }
];