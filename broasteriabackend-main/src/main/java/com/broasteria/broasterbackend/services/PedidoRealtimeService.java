package com.broasteria.broasterbackend.services;

import com.broasteria.broasterbackend.dto.PedidoEvento;
import com.broasteria.broasterbackend.models.PedidoModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PedidoRealtimeService extends TextWebSocketHandler {

    private final Map<String, PedidoSubscription> subscriptions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public PedidoRealtimeService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        subscriptions.put(session.getId(), PedidoSubscription.from(session));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        subscriptions.remove(session.getId());
    }

    public void publicar(String tipo, PedidoModel pedido) {
        if (pedido == null || pedido.getId() == null) {
            return;
        }

        Integer estadoId = pedido.getEstado() != null ? pedido.getEstado().getId() : null;
        Integer clienteId = pedido.getCliente() != null ? pedido.getCliente().getId() : null;
        boolean pedidoLocal = clienteId != null && clienteId == 1;
        PedidoEvento evento = new PedidoEvento(tipo, pedido.getId(), estadoId, clienteId, pedidoLocal);
        publicar(evento);
    }

    public void publicar(PedidoEvento evento) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    enviar(evento);
                }
            });
            return;
        }

        enviar(evento);
    }

    private void enviar(PedidoEvento evento) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(evento);
        } catch (IOException e) {
            return;
        }

        subscriptions.values().forEach(subscription -> {
            if (subscription.matches(evento)) {
                enviar(subscription.session(), payload);
            }
        });
    }

    private void enviar(WebSocketSession session, String payload) {
        if (!session.isOpen()) {
            subscriptions.remove(session.getId());
            return;
        }

        try {
            session.sendMessage(new TextMessage(payload));
        } catch (IOException e) {
            subscriptions.remove(session.getId());
        }
    }

    private record PedidoSubscription(WebSocketSession session, String role, Integer clienteId) {

        static PedidoSubscription from(WebSocketSession session) {
            URI uri = session.getUri();
            String role = "general";
            Integer clienteId = null;

            if (uri != null) {
                var params = UriComponentsBuilder.fromUri(uri).build().getQueryParams();
                role = params.getFirst("role") != null ? params.getFirst("role") : role;
                String clienteParam = params.getFirst("clienteId");
                if (clienteParam != null) {
                    try {
                        clienteId = Integer.parseInt(clienteParam);
                    } catch (NumberFormatException ignored) {
                        clienteId = null;
                    }
                }
            }

            return new PedidoSubscription(session, role.toLowerCase(), clienteId);
        }

        boolean matches(PedidoEvento evento) {
            return switch (role) {
                case "chef", "cajero" -> true;
                case "mesero" -> Boolean.TRUE.equals(evento.getPedidoLocal());
                case "delivery" -> !Boolean.TRUE.equals(evento.getPedidoLocal());
                case "cliente" -> clienteId != null && clienteId.equals(evento.getClienteId());
                default -> true;
            };
        }
    }
}
