package com.broasteria.broasterbackend.models;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedido")
public class PedidoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Pedido")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_Cliente", nullable = false)
    private ClienteModel cliente;

    @Column(name = "Numero_Pedido_Cliente", nullable = true)
    private Integer numeroPedidoCliente;

    @Column(name = "Fecha_Pedido", nullable = false)
    private LocalDateTime fechaPedido = LocalDateTime.now();

    @Column(name = "Total_Pedido", nullable = false)
    private Double totalPedido;

    @ManyToOne
    @JoinColumn(name = "ID_Estado_Pedido", nullable = false)
    private EstadoPedido estado;

    @ManyToOne
    @JoinColumn(name = "ID_Empleado", nullable = false)
    private EmpleadoModel empleado;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<DetallePedidoModel> detalles = new ArrayList<>();

    @OneToMany(mappedBy = "pedido", fetch = FetchType.EAGER)
    @JsonIgnoreProperties("pedido")
    private List<PagoModel> pagos;

    @Column(name = "Direccion_Entrega")
    private String direccionEntrega;

    @Column(name = "Referencia_Entrega")
    private String referenciaEntrega;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public ClienteModel getCliente() {
        return cliente;
    }

    public void setCliente(ClienteModel cliente) {
        this.cliente = cliente;
    }

    public Integer getNumeroPedidoCliente() {
        return numeroPedidoCliente;
    }

    public void setNumeroPedidoCliente(Integer numeroPedidoCliente) {
        this.numeroPedidoCliente = numeroPedidoCliente;
    }

    public LocalDateTime getFechaPedido() {
        return fechaPedido;
    }

    public void setFechaPedido(LocalDateTime fechaPedido) {
        this.fechaPedido = fechaPedido;
    }

    public Double getTotalPedido() {
        return totalPedido;
    }

    public void setTotalPedido(Double totalPedido) {
        this.totalPedido = totalPedido;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    public EmpleadoModel getEmpleado() {
        return empleado;
    }

    public void setEmpleado(EmpleadoModel empleado) {
        this.empleado = empleado;
    }

    public List<DetallePedidoModel> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetallePedidoModel> detalles) {
        this.detalles = detalles;
    }

    public List<PagoModel> getPagos() {
        return pagos;
    }

    public void setPagos(List<PagoModel> pagos) {
        this.pagos = pagos;
    }

    public String getDireccionEntrega() {
        return direccionEntrega;
    }

    public void setDireccionEntrega(String direccionEntrega) {
        this.direccionEntrega = direccionEntrega;
    }

    public String getReferenciaEntrega() {
        return referenciaEntrega;
    }

    public void setReferenciaEntrega(String referenciaEntrega) {
        this.referenciaEntrega = referenciaEntrega;
    }

}
