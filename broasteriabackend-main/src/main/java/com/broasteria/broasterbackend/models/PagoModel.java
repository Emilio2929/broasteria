package com.broasteria.broasterbackend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pago")
public class PagoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Pago")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_Pedido", nullable = false)
    private PedidoModel pedido;

    @Column(name = "Fecha_Pago")
    private LocalDateTime fechaPago = LocalDateTime.now();

    @Column(name = "Monto", nullable = false)
    private Double monto;

    @ManyToOne
    @JoinColumn(name = "ID_TipoComprobante", nullable = false)
    private TipoComprobantePago tipoComprobante;

    @ManyToOne
    @JoinColumn(name = "ID_TipoPago", nullable = false)
    private TipoPago tipoPago;

    @Column(name = "Código_Autorizacion")
    private String codigoAutorizacion;

    @Column(name = "Código_Transaccion")
    private String codigoTransaccion;

    @Column(name = "N°_Seguimiento")
    private String numeroSeguimiento;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public PedidoModel getPedido() {
        return pedido;
    }

    public void setPedido(PedidoModel pedido) {
        this.pedido = pedido;
    }

    public LocalDateTime getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }

    public Double getMonto() {
        return monto;
    }

    public void setMonto(Double monto) {
        this.monto = monto;
    }

    public TipoComprobantePago getTipoComprobante() {
        return tipoComprobante;
    }

    public void setTipoComprobante(TipoComprobantePago tipoComprobante) {
        this.tipoComprobante = tipoComprobante;
    }

    public TipoPago getTipoPago() {
        return tipoPago;
    }

    public void setTipoPago(TipoPago tipoPago) {
        this.tipoPago = tipoPago;
    }

    public String getCodigoAutorizacion() {
        return codigoAutorizacion;
    }

    public void setCodigoAutorizacion(String codigoAutorizacion) {
        this.codigoAutorizacion = codigoAutorizacion;
    }

    public String getCodigoTransaccion() {
        return codigoTransaccion;
    }

    public void setCodigoTransaccion(String codigoTransaccion) {
        this.codigoTransaccion = codigoTransaccion;
    }

    public String getNumeroSeguimiento() {
        return numeroSeguimiento;
    }

    public void setNumeroSeguimiento(String numeroSeguimiento) {
        this.numeroSeguimiento = numeroSeguimiento;
    }
}
