package com.broasteria.broasterbackend.config;

import com.broasteria.broasterbackend.services.PedidoRealtimeService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final PedidoRealtimeService pedidoRealtimeService;

    public WebSocketConfig(PedidoRealtimeService pedidoRealtimeService) {
        this.pedidoRealtimeService = pedidoRealtimeService;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(pedidoRealtimeService, "/ws/pedidos")
                .setAllowedOriginPatterns("http://localhost:4200", "https://*.vercel.app");
    }
}
