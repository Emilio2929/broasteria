import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ClienteService } from './services/cliente.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'broasterfrontend';
  mostrarChatbot = true;

  constructor(private router: Router, private clienteService: ClienteService) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const urlActual = event.urlAfterRedirects || event.url;
      this.verificarVisibilidadChat(urlActual);
    });

    const urlActualGlobal = window.location.href; 
    const pathActual = window.location.pathname.toLowerCase(); 

    if (urlActualGlobal.includes('transactionToken')) {
      console.log('💳 Retorno de Niubiz detectado (transactionToken). Omitiendo validación.');
      return; 
    }

    const rutasAdministrativas = ['/gerente', '/empleado', '/mesero', '/chef', '/cajero', '/delivery', '/cocina'];
    
    if (rutasAdministrativas.some(ruta => pathActual.startsWith(ruta))) {
       console.log('Ruta administrativa detectada, omitiendo validacion de usuario al inicio');
       return;
    }

    this.validarUsuarioAlInicio();
  }

  //para validar la sesion del usuario al inicio
  validarUsuarioAlInicio() {
    // Solo validamos si el cliente esta logueado
    if (this.clienteService.estaLogueado()) {
      
      this.clienteService.validarSesion().subscribe({
        next: () => {
          console.log('Sesión validada correctamente.');
        },
        error: (err) => {
          console.warn('Sesión inválida o usuario no encontrado en BD. Cerrando sesión local...');
          
          this.clienteService.logout(); 
          
          this.router.navigate(['/']); 
          
          // window.location.reload(); 
        }
      });
    }
  }

  verificarVisibilidadChat(url: string) {
    const rolesOcultos = [
      '/gerente',
      '/empleado',
      '/mesero',
      '/chef',
      '/cajero',
      '/delivery',
      '/cocina',
      '/estadisticas',
      '/inventario',
      '/registrarMesero',
      '/lista-pedidos',
      '/ini-empleado'
    ];

    const esRutaPrivada = rolesOcultos.some(rol => url.toLowerCase().includes(rol.toLowerCase()));

    if (esRutaPrivada) {
      this.mostrarChatbot = false; 
    } else {
      this.mostrarChatbot = true;  
    }
  }
}