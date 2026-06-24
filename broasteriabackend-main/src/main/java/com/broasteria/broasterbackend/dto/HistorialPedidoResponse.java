package com.broasteria.broasterbackend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class HistorialPedidoResponse {

    private Integer id;
    private Integer numeroPedidoCliente;
    private LocalDateTime fechaPedido;
    private Double totalPedido;
    private EstadoResponse estado;
    private List<DetalleResponse> detalles;

    public HistorialPedidoResponse(Integer id, Integer numeroPedidoCliente, LocalDateTime fechaPedido,
            Double totalPedido, EstadoResponse estado, List<DetalleResponse> detalles) {
        this.id = id;
        this.numeroPedidoCliente = numeroPedidoCliente;
        this.fechaPedido = fechaPedido;
        this.totalPedido = totalPedido;
        this.estado = estado;
        this.detalles = detalles;
    }

    public Integer getId() {
        return id;
    }

    public Integer getNumeroPedidoCliente() {
        return numeroPedidoCliente;
    }

    public LocalDateTime getFechaPedido() {
        return fechaPedido;
    }

    public Double getTotalPedido() {
        return totalPedido;
    }

    public EstadoResponse getEstado() {
        return estado;
    }

    public List<DetalleResponse> getDetalles() {
        return detalles;
    }

    public static class EstadoResponse {
        private Integer id;
        private String nombre;

        public EstadoResponse(Integer id, String nombre) {
            this.id = id;
            this.nombre = nombre;
        }

        public Integer getId() {
            return id;
        }

        public String getNombre() {
            return nombre;
        }
    }

    public static class DetalleResponse {
        private Integer cantidad;
        private Double subtotal;
        private String detalleExtra;
        private ProductoResponse producto;

        public DetalleResponse(Integer cantidad, Double subtotal, String detalleExtra, ProductoResponse producto) {
            this.cantidad = cantidad;
            this.subtotal = subtotal;
            this.detalleExtra = detalleExtra;
            this.producto = producto;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public Double getSubtotal() {
            return subtotal;
        }

        public String getDetalleExtra() {
            return detalleExtra;
        }

        public ProductoResponse getProducto() {
            return producto;
        }
    }

    public static class ProductoResponse {
        private Integer id;
        private String nombre;

        public ProductoResponse(Integer id, String nombre) {
            this.id = id;
            this.nombre = nombre;
        }

        public Integer getId() {
            return id;
        }

        public String getNombre() {
            return nombre;
        }
    }
}
