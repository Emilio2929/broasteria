package com.broasteria.broasterbackend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "tipocomprobante_pago")
public class TipoComprobantePago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_TipoComprobante")
    private Integer id;

    @Column(name = "Nombre_TipoComprobante", nullable = false)
    private String nombreTipoComprobante;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNombreTipoComprobante() {
        return nombreTipoComprobante;
    }

    public void setNombreTipoComprobante(String nombreTipoComprobante) {
        this.nombreTipoComprobante = nombreTipoComprobante;
    }
}
