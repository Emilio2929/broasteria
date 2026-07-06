package com.broasteria.broasterbackend.controllers;

import com.broasteria.broasterbackend.services.ChatGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {

    @Autowired
    private ChatGeminiService chatService;

    @PostMapping("/enviar")
    public Map<String, String> chatear(@RequestBody Map<String, Object> payload) {
        String mensaje = (String) payload.get("mensaje");

        // Recibimos el ID del cliente
        Integer idCliente = null;
        if (payload.get("idCliente") != null) {
            idCliente = Integer.parseInt(payload.get("idCliente").toString());
        }

        // Extraemos el historial de mensajes
        java.util.List<Map<String, String>> historial = null;
        if (payload.get("historial") != null) {
            historial = (java.util.List<Map<String, String>>) payload.get("historial");
        }

        // Se lo pasamos al servicio
        String respuestaIA = chatService.obtenerRespuestaIA(mensaje, idCliente, historial);
        return Collections.singletonMap("respuesta", respuestaIA);
    }
}