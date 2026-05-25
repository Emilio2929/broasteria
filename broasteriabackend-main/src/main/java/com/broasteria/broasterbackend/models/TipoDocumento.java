package com.broasteria.broasterbackend.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tipo_documento")
public class TipoDocumento {

    @Id
    @Column(name = "ID_TipoDocumento")
    private Integer id;

    @Column(name = "Nombre_Documento", length = 100, nullable = false)
    private String nombreDocumento;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNombreDocumento() {
        return nombreDocumento;
    }

    public void setNombreDocumento(String nombreDocumento) {
        this.nombreDocumento = nombreDocumento;
    }
}
