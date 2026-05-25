package com.broasteria.broasterbackend.seguridad;

import lombok.Data;

@Data
public class AuthCredentials {
    private String usuarioLogin;
    private String contrasenaHash;

    public String getUsuarioLogin() {
        return usuarioLogin;
    }

    public void setUsuarioLogin(String usuarioLogin) {
        this.usuarioLogin = usuarioLogin;
    }

    public String getContrasenaHash() {
        return contrasenaHash;
    }

    public void setContrasenaHash(String contrasenaHash) {
        this.contrasenaHash = contrasenaHash;
    }
}
