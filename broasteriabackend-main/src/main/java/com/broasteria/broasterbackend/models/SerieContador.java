package com.broasteria.broasterbackend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "serie_contador")
public class SerieContador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Serie")
    private Integer id;

    @Column(name = "Serie", nullable = false, length = 4, unique = true)
    private String serie;

    @Column(name = "Ultimo_Numero", nullable = false)
    private Integer ultimoNumero;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public Integer getUltimoNumero() {
        return ultimoNumero;
    }

    public void setUltimoNumero(Integer ultimoNumero) {
        this.ultimoNumero = ultimoNumero;
    }
}