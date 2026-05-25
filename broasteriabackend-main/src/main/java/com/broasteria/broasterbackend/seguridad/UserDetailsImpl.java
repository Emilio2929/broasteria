package com.broasteria.broasterbackend.seguridad;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.broasteria.broasterbackend.models.ClienteModel; // <--- IMPORTANTE
import com.broasteria.broasterbackend.models.EmpleadoModel;

public class UserDetailsImpl implements UserDetails {

    private EmpleadoModel empleado;
    private ClienteModel cliente;

    // Constructor para Empleados
    public UserDetailsImpl(EmpleadoModel empleado) {
        this.empleado = empleado;
    }

    // Constructor para Clientes
    public UserDetailsImpl(ClienteModel cliente) {
        this.cliente = cliente;
    }

    @Override
    public String getUsername() {
        if (empleado != null) {
            return empleado.getUsuarioLogin();
        }
        return cliente.getCorreo();
    }

    public String getNombre() {
        if (empleado != null) {
            return empleado.getNombre();
        }
        return cliente.getNombre();
    }

    public String getRol() {
        if (empleado != null) {
            return empleado.getRol().getNombreRol();
        }
        return "CLIENTE";
    }

    public Integer getIdEmpleado() {
        if (empleado != null) {
            return empleado.getIdEmpleado();
        }
        return null;
    }

    public Integer getIdCliente() {
        if (cliente != null) {
            return cliente.getId();
        }
        return null;
    }

    public Integer getIdUsuario() {
        if (empleado != null)
            return empleado.getIdEmpleado();
        return cliente.getId();
    }

    @Override
    public String getPassword() {
        if (empleado != null) {
            return empleado.getContrasenaHash();
        }
        return cliente.getContrasena();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String rol = getRol();
        if (rol != null) {
            return Collections.singletonList(new SimpleGrantedAuthority(rol));
        }
        return Collections.emptyList();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}