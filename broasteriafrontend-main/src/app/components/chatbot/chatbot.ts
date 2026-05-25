import { environment } from 'src/environments';
import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})
export class ChatbotComponent {

  mostrarChat = false;
  mensajeUsuario = '';
  cargando = false;

  mensajes: any[] = [
    { emisor: 'bot', texto: '¡Hola! Soy PolloBot. ¿En qué puedo ayudarte hoy?' }
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  toggleChat() {
    this.mostrarChat = !this.mostrarChat;
  }

  enviarMensaje() {
    if (!this.mensajeUsuario.trim()) return;

    const textoEnviado = this.mensajeUsuario;
    this.mensajes.push({ emisor: 'user', texto: textoEnviado });
    this.mensajeUsuario = '';
    this.cargando = true;
    
    this.ngZone.run(() => {
        this.cdr.detectChanges();
        setTimeout(() => this.scrollAlFondo(), 100);
    });

    // OBTENEMOS EL ID DEL CLIENTE DEL LOCALSTORAGE
    const clienteJson = localStorage.getItem('cliente');
    let idCliente = null;
    if (clienteJson) {
        const clienteObj = JSON.parse(clienteJson);
        idCliente = clienteObj.id; 
    }

    // ENVIAMOS EL MENSAJE + EL ID DEL CLIENTE
    const payload = { 
        mensaje: textoEnviado,
        idCliente: idCliente  
    };
    
    this.http.post<any>(environment.apiUrl + '/chat/enviar', payload).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
            this.cargando = false;
            this.mensajes.push({ emisor: 'bot', texto: res.respuesta });
            this.cdr.detectChanges(); 
            setTimeout(() => this.scrollAlFondo(), 100);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
            this.cargando = false;
            console.error(err);
            this.mensajes.push({ emisor: 'bot', texto: 'Uy, error de conexión.' });
            this.cdr.detectChanges();
        });
      }
    });
  }

  scrollAlFondo() {
    try {
        const chatBody = document.querySelector('.chat-body');
        if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    } catch(e) { console.error('Error scroll', e); }
  }
}