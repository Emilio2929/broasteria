package com.broasteria.broasterbackend.dto;

import java.time.LocalDateTime;

public class PedidoEvento {

    private String tipo;
    private Integer pedidoId;
    private Integer estadoId;
    private Integer clienteId;
    private Boolean pedidoLocal;
    private LocalDateTime fecha;

    public PedidoEvento() {
    }

    public PedidoEvento(String tipo, Integer pedidoId, Integer estadoId, Integer clienteId, Boolean pedidoLocal) {
        this.tipo = tipo;
        this.pedidoId = pedidoId;
        this.estadoId = estadoId;
        this.clienteId = clienteId;
        this.pedidoLocal = pedidoLocal;
        this.fecha = LocalDateTime.now();
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(Integer pedidoId) {
        this.pedidoId = pedidoId;
    }

    public Integer getEstadoId() {
        return estadoId;
    }

    public void setEstadoId(Integer estadoId) {
        this.estadoId = estadoId;
    }

    public Integer getClienteId() {
        return clienteId;
    }

    public void setClienteId(Integer clienteId) {
        this.clienteId = clienteId;
    }

    public Boolean getPedidoLocal() {
        return pedidoLocal;
    }

    public void setPedidoLocal(Boolean pedidoLocal) {
        this.pedidoLocal = pedidoLocal;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}
