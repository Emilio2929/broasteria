package com.broasteria.broasterbackend.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "detalle_pedido")
public class DetallePedidoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_DetallePedido")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_Producto", nullable = false)
    private ProductoModel producto;

    @ManyToOne
    @JoinColumn(name = "ID_Pedido", nullable = false)
    @JsonBackReference
    private PedidoModel pedido;

    @Column(name = "Cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "Subtotal", nullable = false)
    private Double subtotal;

    @Column(name = "Precio_Unitario", nullable = false)
    private Double precioUnitario;

    @Column(name = "DetalleExtra")
    private String detalleExtra;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public ProductoModel getProducto() {
        return producto;
    }

    public void setProducto(ProductoModel producto) {
        this.producto = producto;
    }

    public PedidoModel getPedido() {
        return pedido;
    }

    public void setPedido(PedidoModel pedido) {
        this.pedido = pedido;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    public Double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(Double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public String getDetalleExtra() {
        return detalleExtra;
    }

    public void setDetalleExtra(String detalleExtra) {
        this.detalleExtra = detalleExtra;
    }
}
