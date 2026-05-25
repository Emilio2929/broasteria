package com.broasteria.broasterbackend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "estado_empleado")
public class EstadoEmpleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_EstadoEmpleado")
    private Integer idEstadoEmpleado;

    @Column(name = "Nombre_EstadoEmpleado", nullable = false)
    private String nombreEstadoEmpleado;

    public Integer getIdEstadoEmpleado() {
        return idEstadoEmpleado;
    }

    public void setIdEstadoEmpleado(Integer idEstadoEmpleado) {
        this.idEstadoEmpleado = idEstadoEmpleado;
    }

    public String getNombreEstadoEmpleado() {
        return nombreEstadoEmpleado;
    }

    public void setNombreEstadoEmpleado(String nombreEstadoEmpleado) {
        this.nombreEstadoEmpleado = nombreEstadoEmpleado;
    }
}
