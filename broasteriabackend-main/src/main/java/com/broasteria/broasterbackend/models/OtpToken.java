package com.broasteria.broasterbackend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_token", schema = "broasteria")
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Token")
    private Integer idToken;

    @Column(name = "Token", nullable = false, unique = true, length = 100)
    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ID_Cliente", nullable = false)
    private ClienteModel cliente;

    @Column(name = "Fecha_Expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(name = "Usado", nullable = false)
    private Boolean usado = false;

    public OtpToken() {
    }

    // Se pasa el cliente, el token generado y los minutos de validez
    public OtpToken(String token, ClienteModel cliente, int minutosExpiracion) {
        this.token = token;
        this.cliente = cliente;
        this.fechaExpiracion = LocalDateTime.now().plusMinutes(minutosExpiracion);
        this.usado = false;
    }

    public Integer getIdToken() {
        return idToken;
    }

    public void setIdToken(Integer idToken) {
        this.idToken = idToken;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public ClienteModel getCliente() {
        return cliente;
    }

    public void setCliente(ClienteModel cliente) {
        this.cliente = cliente;
    }

    public LocalDateTime getFechaExpiracion() {
        return fechaExpiracion;
    }

    public void setFechaExpiracion(LocalDateTime fechaExpiracion) {
        this.fechaExpiracion = fechaExpiracion;
    }

    public Boolean getUsado() {
        return usado;
    }

    public void setUsado(Boolean usado) {
        this.usado = usado;
    }

    public boolean esValido() {
        return !this.usado && LocalDateTime.now().isBefore(this.fechaExpiracion);
    }
}